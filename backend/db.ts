/**
 * Database handle.
 *
 * The app runs against the in-memory mockup database (see `./mock-db`), which
 * is seeded from `mockupdata/db/*.json`. The query-builder surface and
 * the condition helpers below mirror the drizzle API the routes already used,
 * so callers import `eq` / `inArray` from here instead of from "drizzle-orm".
 */
export {
  db,
  eq,
  ne,
  and,
  or,
  inArray,
  isNull,
  isNotNull,
  initMockDb,
  resetMockDb,
  MOCK_DB_DIR,
  type MockCondition,
} from "./mock-db";
