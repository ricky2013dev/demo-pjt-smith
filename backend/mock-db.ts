/**
 * In-memory mockup database.
 *
 * The backend used to talk to PostgreSQL through drizzle. It now talks to this
 * module instead: every table lives in memory and is seeded from the JSON files
 * in `mockupdata/db/` (one file per physical table name).
 *
 * The exported `db` object mimics the subset of the drizzle query builder the
 * app actually uses:
 *
 *   db.select().from(t).where(cond).orderBy(col)
 *   db.select({ id: t.id }).from(t)
 *   db.insert(t).values(row | row[]).returning()
 *   db.update(t).set(patch).where(cond).returning()
 *   db.delete(t).where(cond).returning()
 *
 * Table/column metadata is read from the real drizzle schema in
 * `shared/schema.ts`, so column defaults, snake_case names and types keep
 * working exactly as they did against PostgreSQL.
 *
 * Writes are in-memory only and reset on restart. Set MOCK_DB_PERSIST=true to
 * flush changed tables back to their JSON file.
 */
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { getTableColumns, getTableName, is, Table } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "@shared/schema";
import { encrypt } from "./crypto";

type Row = Record<string, any>;
type AnyTable = any;
type AnyColumn = any;

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Folder holding one JSON file per table, named after the physical table.
 * Resolved against the source tree in development and the repo root once
 * `backend/` has been bundled into `dist/`.
 */
export const MOCK_DB_DIR = [
  process.env.MOCK_DB_DIR,
  resolve(__dirname, "../mockupdata/db"),
  join(process.cwd(), "mockupdata", "db"),
].find((candidate): candidate is string => Boolean(candidate) && existsSync(candidate!))
  ?? resolve(__dirname, "../mockupdata/db");

const PERSIST = process.env.MOCK_DB_PERSIST === "true";
const BCRYPT_ROUNDS = 10;

/* ------------------------------------------------------------------ */
/* Conditions (drop-in replacements for the drizzle operators we use)   */
/* ------------------------------------------------------------------ */

export type MockCondition =
  | { kind: "eq"; column: AnyColumn; value: any }
  | { kind: "ne"; column: AnyColumn; value: any }
  | { kind: "isNull"; column: AnyColumn }
  | { kind: "isNotNull"; column: AnyColumn }
  | { kind: "inArray"; column: AnyColumn; values: any[] }
  | { kind: "and"; conditions: MockCondition[] }
  | { kind: "or"; conditions: MockCondition[] };

export const eq = (column: AnyColumn, value: any): MockCondition => ({ kind: "eq", column, value });
export const ne = (column: AnyColumn, value: any): MockCondition => ({ kind: "ne", column, value });
export const isNull = (column: AnyColumn): MockCondition => ({ kind: "isNull", column });
export const isNotNull = (column: AnyColumn): MockCondition => ({ kind: "isNotNull", column });
export const inArray = (column: AnyColumn, values: any[]): MockCondition => ({ kind: "inArray", column, values: values ?? [] });
export const and = (...conditions: (MockCondition | undefined)[]): MockCondition => ({
  kind: "and",
  conditions: conditions.filter(Boolean) as MockCondition[],
});
export const or = (...conditions: (MockCondition | undefined)[]): MockCondition => ({
  kind: "or",
  conditions: conditions.filter(Boolean) as MockCondition[],
});

/* ------------------------------------------------------------------ */
/* Schema introspection                                                */
/* ------------------------------------------------------------------ */

const columnInfoCache = new WeakMap<object, { table: string; key: string }>();

/** Maps a drizzle column back to the table name + JS property it stores. */
function columnInfo(column: AnyColumn): { table: string; key: string } {
  const cached = columnInfoCache.get(column);
  if (cached) return cached;

  const table = getTableName(column.table);
  const entry = Object.entries(getTableColumns(column.table)).find(([, candidate]) => candidate === column);
  if (!entry) throw new Error(`Column "${column.name}" does not belong to table "${table}"`);

  const info = { table, key: entry[0] };
  columnInfoCache.set(column, info);
  return info;
}

const columnKey = (column: AnyColumn) => columnInfo(column).key;

/** Resolves the value a column default would have produced in PostgreSQL. */
function defaultValueFor(column: AnyColumn): any {
  if (!column.hasDefault) return null;
  if (typeof column.defaultFn === "function") return column.defaultFn();

  const value = column.default;
  const isSqlExpression = value !== null && typeof value === "object" && !(value instanceof Date);
  if (!isSqlExpression) return value === undefined ? null : value;

  // sql`gen_random_uuid()` / defaultNow()
  return column.dataType === "date" ? new Date() : randomUUID();
}

function coerce(column: AnyColumn, value: any): any {
  if (value === undefined || value === null) return null;
  switch (column.dataType) {
    case "date":
      return value instanceof Date ? value : new Date(value);
    case "boolean":
      return typeof value === "boolean" ? value : value === "true" || value === 1;
    case "number":
      return typeof value === "number" ? value : Number(value);
    default:
      return value;
  }
}

/**
 * Normalises an incoming row to the table shape: fills defaults, accepts either
 * JS (`stediMode`) or column (`stedi_mode`) keys, and drops unknown fields.
 */
function toTableRow(table: AnyTable, input: Row): Row {
  const row: Row = {};
  for (const [key, column] of Object.entries<any>(getTableColumns(table))) {
    let value = input[key];
    if (value === undefined) value = input[column.name];
    if (value === undefined) value = defaultValueFor(column);
    row[key] = coerce(column, value);
  }
  return row;
}

function applyPatch(table: AnyTable, row: Row, patch: Row): void {
  const columns: Record<string, any> = getTableColumns(table);
  for (const [key, value] of Object.entries(patch)) {
    const column = columns[key];
    if (!column || value === undefined) continue;
    row[key] = coerce(column, value);
  }
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

const store = new Map<string, Row[]>();

function rowsOf(table: AnyTable): Row[] {
  const name = getTableName(table);
  let rows = store.get(name);
  if (!rows) {
    rows = [];
    store.set(name, rows);
  }
  return rows;
}

function clone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value.getTime()) as any;
  if (Array.isArray(value)) return value.map(clone) as any;
  const out: Row = {};
  for (const [key, item] of Object.entries(value as Row)) out[key] = clone(item);
  return out as T;
}

function sameValue(a: any, b: any): boolean {
  if (a instanceof Date || b instanceof Date) {
    const left = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const right = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return left === right;
  }
  return a === b;
}

function matches(row: Row, condition: MockCondition): boolean {
  switch (condition.kind) {
    case "eq":
      return sameValue(row[columnKey(condition.column)], condition.value);
    case "ne":
      return !sameValue(row[columnKey(condition.column)], condition.value);
    case "isNull":
      return row[columnKey(condition.column)] === null;
    case "isNotNull":
      return row[columnKey(condition.column)] !== null;
    case "inArray":
      return condition.values.some((value) => sameValue(row[columnKey(condition.column)], value));
    case "and":
      return condition.conditions.every((child) => matches(row, child));
    case "or":
      return condition.conditions.some((child) => matches(row, child));
    default:
      return true;
  }
}

function compare(a: any, b: any): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1; // nulls last
  if (b === null || b === undefined) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/* ------------------------------------------------------------------ */
/* Persistence (opt-in)                                                */
/* ------------------------------------------------------------------ */

const pendingWrites = new Set<string>();
let flushTimer: NodeJS.Timeout | null = null;

function schedulePersist(table: AnyTable): void {
  if (!PERSIST) return;
  pendingWrites.add(getTableName(table));
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    for (const name of pendingWrites) {
      try {
        if (!existsSync(MOCK_DB_DIR)) mkdirSync(MOCK_DB_DIR, { recursive: true });
        writeFileSync(join(MOCK_DB_DIR, `${name}.json`), `${JSON.stringify(store.get(name) ?? [], null, 2)}\n`, "utf-8");
      } catch (error) {
        console.error(`[mock-db] failed to persist "${name}":`, error);
      }
    }
    pendingWrites.clear();
  }, 250);
  flushTimer.unref?.();
}

/* ------------------------------------------------------------------ */
/* Query builders                                                      */
/* ------------------------------------------------------------------ */

/** Lazily executed, awaitable query. The work happens on the first `await`. */
abstract class MockQuery<T = any> implements PromiseLike<T> {
  private executed = false;
  private result: any;

  protected abstract run(): any;

  private exec(): any {
    if (!this.executed) {
      this.result = this.run();
      this.executed = true;
    }
    return this.result;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      return Promise.resolve(this.exec()).then(onfulfilled, onrejected);
    } catch (error) {
      return Promise.reject(error).then(onfulfilled, onrejected);
    }
  }

  catch(onrejected?: ((reason: any) => any) | null): Promise<any> {
    return this.then(undefined, onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<any> {
    return this.then(
      (value) => {
        onfinally?.();
        return value;
      },
      (reason) => {
        onfinally?.();
        throw reason;
      },
    );
  }
}

class SelectQuery extends MockQuery<any[]> {
  private table: AnyTable = null;
  private condition: MockCondition | null = null;
  private orderColumns: AnyColumn[] = [];
  private rowLimit: number | null = null;
  private rowOffset = 0;

  constructor(private readonly projection?: Record<string, AnyColumn>) {
    super();
  }

  from(table: AnyTable): this {
    this.table = table;
    return this;
  }

  where(condition?: MockCondition | null): this {
    this.condition = condition ?? null;
    return this;
  }

  orderBy(...columns: AnyColumn[]): this {
    this.orderColumns.push(...columns);
    return this;
  }

  limit(count: number): this {
    this.rowLimit = count;
    return this;
  }

  offset(count: number): this {
    this.rowOffset = count;
    return this;
  }

  protected run(): any[] {
    if (!this.table) throw new Error("[mock-db] select() is missing a from() table");

    let rows = rowsOf(this.table).filter((row) => (this.condition ? matches(row, this.condition) : true));

    // Apply sort keys right-to-left so the first orderBy column wins.
    for (const column of [...this.orderColumns].reverse()) {
      const key = columnKey(column);
      rows = rows.map((row, index) => ({ row, index }))
        .sort((a, b) => compare(a.row[key], b.row[key]) || a.index - b.index)
        .map(({ row }) => row);
    }

    rows = rows.slice(this.rowOffset, this.rowLimit === null ? undefined : this.rowOffset + this.rowLimit);

    if (!this.projection) return rows.map(clone);
    return rows.map((row) => {
      const projected: Row = {};
      for (const [alias, column] of Object.entries(this.projection!)) {
        projected[alias] = clone(row[columnKey(column)]);
      }
      return projected;
    });
  }
}

class InsertQuery extends MockQuery {
  private inputs: Row[] = [];
  private withReturning = false;

  constructor(private readonly table: AnyTable) {
    super();
  }

  values(input: Row | Row[]): this {
    this.inputs = Array.isArray(input) ? input : [input];
    return this;
  }

  returning(): this {
    this.withReturning = true;
    return this;
  }

  protected run(): any {
    const inserted = this.inputs.map((input) => toTableRow(this.table, input));
    rowsOf(this.table).push(...inserted);
    schedulePersist(this.table);
    const rows = inserted.map(clone);
    return this.withReturning ? rows : { rowCount: rows.length, rows };
  }
}

class UpdateQuery extends MockQuery {
  private patch: Row = {};
  private condition: MockCondition | null = null;
  private withReturning = false;

  constructor(private readonly table: AnyTable) {
    super();
  }

  set(patch: Row): this {
    this.patch = patch ?? {};
    return this;
  }

  where(condition?: MockCondition | null): this {
    this.condition = condition ?? null;
    return this;
  }

  returning(): this {
    this.withReturning = true;
    return this;
  }

  protected run(): any {
    const updated = rowsOf(this.table).filter((row) => (this.condition ? matches(row, this.condition) : true));
    for (const row of updated) applyPatch(this.table, row, this.patch);
    if (updated.length > 0) schedulePersist(this.table);
    const rows = updated.map(clone);
    return this.withReturning ? rows : { rowCount: rows.length, rows };
  }
}

class DeleteQuery extends MockQuery {
  private condition: MockCondition | null = null;
  private withReturning = false;

  constructor(private readonly table: AnyTable) {
    super();
  }

  where(condition?: MockCondition | null): this {
    this.condition = condition ?? null;
    return this;
  }

  returning(): this {
    this.withReturning = true;
    return this;
  }

  protected run(): any {
    const all = rowsOf(this.table);
    const removed: Row[] = [];
    const kept: Row[] = [];
    for (const row of all) {
      if (this.condition ? matches(row, this.condition) : true) removed.push(row);
      else kept.push(row);
    }
    all.length = 0;
    all.push(...kept);
    if (removed.length > 0) schedulePersist(this.table);
    const rows = removed.map(clone);
    return this.withReturning ? rows : { rowCount: rows.length, rows };
  }
}

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

/** Fields the app stores encrypted; mockup JSON keeps them readable. */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  patients: ["birthDate", "ssn"],
  insurances: ["groupNumber", "subscriberId"],
  if_call_transaction_list: ["policyNumber", "groupNumber", "subscriberId"],
};

const looksEncrypted = (value: unknown): boolean =>
  typeof value === "string" && value.split(":").length === 4 && value.length > 120;

const looksHashed = (value: unknown): boolean => typeof value === "string" && /^\$2[aby]?\$/.test(value);

/** Turns readable mockup JSON into the at-rest shape the routes expect. */
function prepareSeedRow(tableName: string, row: Row): Row {
  const prepared: Row = { ...row };

  for (const field of ENCRYPTED_FIELDS[tableName] ?? []) {
    const value = prepared[field];
    if (typeof value === "string" && value.length > 0 && !looksEncrypted(value)) {
      prepared[field] = encrypt(value);
    }
  }

  if (tableName === "users" && typeof prepared.password === "string" && !looksHashed(prepared.password)) {
    prepared.password = bcrypt.hashSync(prepared.password, BCRYPT_ROUNDS);
  }

  return prepared;
}

function readSeedFile(tableName: string): Row[] {
  const file = join(MOCK_DB_DIR, `${tableName}.json`);
  if (!existsSync(file)) return [];

  const parsed = JSON.parse(readFileSync(file, "utf-8"));
  if (!Array.isArray(parsed)) throw new Error(`[mock-db] ${tableName}.json must contain an array of rows`);
  return parsed;
}

let loaded = false;
let loadStats: Record<string, number> = {};

/** Loads every table from `mockupdata/db/`. Safe to call repeatedly. */
export function initMockDb(): Record<string, number> {
  if (loaded) return loadStats;
  loaded = true;

  for (const table of Object.values(schema)) {
    if (!is(table as any, Table)) continue;
    const tableName = getTableName(table as any);
    try {
      const rows = readSeedFile(tableName).map((row) => toTableRow(table, prepareSeedRow(tableName, row)));
      store.set(tableName, rows);
      loadStats[tableName] = rows.length;
    } catch (error) {
      console.error(`[mock-db] failed to seed "${tableName}":`, error);
      store.set(tableName, []);
      loadStats[tableName] = 0;
    }
  }

  return loadStats;
}

/** Drops every row and re-seeds from disk. Useful for tests. */
export function resetMockDb(): Record<string, number> {
  store.clear();
  loaded = false;
  loadStats = {};
  return initMockDb();
}

// Seed eagerly so any module importing `db` sees a populated database.
initMockDb();

/* ------------------------------------------------------------------ */
/* Public database handle                                              */
/* ------------------------------------------------------------------ */

export const db = {
  select: (projection?: Record<string, AnyColumn>) => new SelectQuery(projection),
  insert: (table: AnyTable) => new InsertQuery(table),
  update: (table: AnyTable) => new UpdateQuery(table),
  delete: (table: AnyTable) => new DeleteQuery(table),
  /** Raw access to a table's in-memory rows, for debugging only. */
  $rows: (table: AnyTable) => rowsOf(table).map(clone),
  $stats: () => ({ ...loadStats }),
};
