import type { Request } from 'express';
import { prisma } from './prisma.js';

export type AuditSeverity = 'low' | 'medium' | 'high';

export function inferSeverityFromStatus(statusCode: number): AuditSeverity {
  if (statusCode >= 500) return 'high';
  if (statusCode >= 400) return 'medium';
  return 'low';
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
}

export function getRequestId(req: Request): string {
  const value = req.headers['x-request-id'];
  return typeof value === 'string' && value.trim() ? value : 'unknown';
}

export async function createAuditLogSafe(input: {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  req?: Request;
  severity: AuditSeverity;
  details?: Record<string, unknown>;
}) {
  if (!input.organizationId) return;
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        ip: input.req ? getClientIp(input.req) : 'unknown',
        userAgent: input.req?.headers['user-agent'] ?? 'unknown',
        severity: input.severity,
        details: (input.details ?? undefined) as any,
      },
    });
  } catch {
    // Best-effort log; do not break request flow.
  }
}
