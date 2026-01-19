/**
 * HIPAA-Compliant Audit Logging Module
 *
 * HIPAA requires maintaining audit logs for at least 6 years.
 * This module provides immutable logging for PHI access and security events.
 */

import fs from 'fs';
import path from 'path';

// Audit event types for HIPAA compliance
export type AuditEventType =
  | 'PHI_ACCESS'           // Patient Health Information accessed
  | 'PHI_DECRYPT'          // Sensitive field decrypted
  | 'PHI_MODIFY'           // Patient data modified
  | 'PHI_CREATE'           // New patient record created
  | 'PHI_DELETE'           // Patient record deleted
  | 'AUTH_LOGIN_SUCCESS'   // Successful login
  | 'AUTH_LOGIN_FAILURE'   // Failed login attempt
  | 'AUTH_LOGOUT'          // User logout
  | 'AUTH_SESSION_EXPIRED' // Session expired
  | 'RATE_LIMIT_EXCEEDED'  // Rate limit hit
  | 'SECURITY_VIOLATION'   // Security policy violation
  | 'ADMIN_ACTION'         // Administrative action
  | 'API_ACCESS'           // External API accessed
  | 'ERROR';               // System error

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  patientId?: string;
  resourceType?: string;
  action?: string;
  field?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

// In-memory buffer for batch writing (production should use a proper logging service)
const auditBuffer: AuditLogEntry[] = [];
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_BUFFER_SIZE = 100;

// Log directory
const LOG_DIR = process.env.AUDIT_LOG_DIR || './logs/audit';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Get current log file path (daily rotation)
 */
function getLogFilePath(): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `audit-${date}.log`);
}

/**
 * Flush buffer to disk
 */
function flushBuffer(): void {
  if (auditBuffer.length === 0) return;

  const entries = auditBuffer.splice(0, auditBuffer.length);
  const logContent = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';

  fs.appendFileSync(getLogFilePath(), logContent, { flag: 'a' });
}

// Periodic flush
setInterval(flushBuffer, FLUSH_INTERVAL);

// Flush on process exit
process.on('exit', flushBuffer);
process.on('SIGINT', () => {
  flushBuffer();
  process.exit(0);
});

/**
 * Log an audit event (HIPAA-compliant)
 *
 * @param eventType - Type of audit event
 * @param details - Additional details about the event
 * @param request - Express request object (optional, for extracting user/session info)
 */
export function auditLog(
  eventType: AuditEventType,
  details: Partial<AuditLogEntry> & Record<string, unknown> = {},
  request?: { session?: any; ip?: string; headers?: Record<string, any> }
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    success: details.success !== false,
    ...details,
  };

  // Extract request information if available
  if (request) {
    entry.userId = entry.userId || request.session?.userId;
    entry.userEmail = entry.userEmail || request.session?.userEmail;
    entry.userRole = entry.userRole || request.session?.userRole;
    entry.sessionId = entry.sessionId || request.session?.id;
    entry.ipAddress = entry.ipAddress || request.ip || request.headers?.['x-forwarded-for'] as string;
    entry.userAgent = entry.userAgent || request.headers?.['user-agent'];
  }

  // Add to buffer
  auditBuffer.push(entry);

  // Flush if buffer is full
  if (auditBuffer.length >= MAX_BUFFER_SIZE) {
    flushBuffer();
  }

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUDIT] ${entry.eventType}:`, JSON.stringify(entry, null, 2));
  }
}

/**
 * Log PHI access event
 */
export function logPhiAccess(
  patientId: string,
  action: string,
  request: { session?: any; ip?: string; headers?: Record<string, any> },
  field?: string
): void {
  auditLog('PHI_ACCESS', {
    patientId,
    action,
    field,
    resourceType: 'Patient',
  }, request);
}

/**
 * Log PHI decryption event (sensitive operation)
 */
export function logPhiDecrypt(
  patientId: string,
  field: string,
  request: { session?: any; ip?: string; headers?: Record<string, any> }
): void {
  auditLog('PHI_DECRYPT', {
    patientId,
    field,
    resourceType: 'Patient',
    action: 'decrypt',
  }, request);
}

/**
 * Log authentication event
 */
export function logAuth(
  eventType: 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_FAILURE' | 'AUTH_LOGOUT',
  userEmail: string,
  success: boolean,
  request: { ip?: string; headers?: Record<string, any> },
  errorMessage?: string
): void {
  auditLog(eventType, {
    userEmail,
    success,
    errorMessage,
  }, request);
}

/**
 * Log security violation
 */
export function logSecurityViolation(
  description: string,
  request: { session?: any; ip?: string; headers?: Record<string, any> },
  details?: Record<string, unknown>
): void {
  auditLog('SECURITY_VIOLATION', {
    action: description,
    success: false,
    details,
  }, request);
}
