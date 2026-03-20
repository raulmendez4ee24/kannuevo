import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { prisma } from './prisma.js';
import {
  AuthedRequest,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createSession,
  destroySession,
  requireAuth,
  requirePermission,
  setSessionCookie,
  verifyPassword,
} from './auth.js';
import { randomOtpCode, randomToken, sha256, encryptPaymentObject, isExpiryValid, isValidCardNumber, maskCardNumber } from './security.js';
import { sseAddClient, sseBroadcast, ssePing, sseRemoveClient } from './realtime.js';
import { permissionsForRoles } from './permissions.js';
import { sendContactEmail, sendAuditEmail, sendPaymentNotification } from './email.js';
import { createAuditLogSafe, getClientIp, inferSeverityFromStatus } from './audit.js';
import { rateLimit } from './rateLimit.js';
import { stripe, isStripeEnabled } from './stripe.js';

const app = express();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, name: 'auth' });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, name: 'otp' });
app.set('trust proxy', 1);

// Stripe webhook needs raw body for signature verification — must be BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeEnabled() || !stripe) {
    return res.status(400).json({ error: 'STRIPE_NOT_CONFIGURED' });
  }
  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    return res.status(400).json({ error: 'MISSING_SIGNATURE' });
  }
  try {
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    let event;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Without webhook secret, parse but log warning
      console.warn('[STRIPE] No STRIPE_WEBHOOK_SECRET set — skipping signature verification');
      event = JSON.parse(req.body.toString());
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await prisma.payment.updateMany({
          where: { paymentId },
          data: {
            status: 'completed',
            processedAt: new Date(),
            notes: `Stripe session: ${session.id}`,
          },
        });
        console.log('[STRIPE] Payment completed via webhook:', paymentId);
        await createAuditLogSafe({
          organizationId: session.metadata?.organizationId || null,
          action: 'PAYMENT_COMPLETED',
          resource: 'payment',
          resourceId: paymentId,
          req,
          severity: 'medium',
          details: {
            stripeSessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_email,
          },
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[STRIPE] Webhook error:', err);
    res.status(400).json({ error: 'WEBHOOK_ERROR' });
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true,
  }),
);

// Best-effort audit log for authenticated, state-changing API calls
app.use((req, res, next) => {
  const requestId = randomToken(8);
  const startAt = Date.now();
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => {
    void (async () => {
      try {
        const auth = (req as Partial<AuthedRequest>).auth;
        if (!auth) return;
        if (!req.path.startsWith('/api/')) return;
        if (req.method === 'GET') return;
        if (res.statusCode >= 500) return;

        await createAuditLogSafe({
          organizationId: auth.organizationId,
          actorUserId: auth.userId,
          action: `${req.method} ${req.path}`,
          resource: 'api',
          req,
          severity: inferSeverityFromStatus(res.statusCode),
          details: {
            statusCode: res.statusCode,
            requestId,
            durationMs: Date.now() - startAt,
          },
        });
      } catch {
        // ignore
      }
    })();
  });
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---- Auth ----

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const org = await prisma.organization.findUnique({ where: { id: auth.organizationId } });
  if (!org) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const role = user.systemRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : auth.orgRole ?? 'ORG_USER';
  const permissions = permissionsForRoles(user.systemRole, auth.orgRole);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      organization: {
        id: org.id,
        name: org.name,
        plan: org.plan,
        status: org.status,
        createdAt: org.createdAt.toISOString(),
      },
      permissions,
      lastLogin: (user.lastLoginAt ?? user.createdAt).toISOString(),
    },
    isImpersonating: auth.isImpersonating,
  });
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    orgName: z.string().min(2),
  });
  const body = schema.parse(req.body);

  const email = body.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'EMAIL_IN_USE' });

  const passwordHash = await bcrypt.hash(body.password, 12);
  const org = await prisma.organization.create({
    data: { name: body.orgName, plan: 'starter', status: 'trial' },
  });
  const user = await prisma.user.create({
    data: { email, name: body.name, passwordHash, systemRole: 'NONE' },
  });
  await prisma.membership.create({ data: { userId: user.id, organizationId: org.id, role: 'ORG_ADMIN' } });

  const { token, session } = await createSession({ userId: user.id, organizationId: org.id });
  setSessionCookie(res, token, session.expiresAt);

  res.json({ ok: true });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const body = schema.parse(req.body);
  const email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(400).json({ error: 'INVALID_CREDENTIALS' });
  if (!user.isActive) return res.status(400).json({ error: 'USER_DISABLED' });

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'INVALID_CREDENTIALS' });

  const membership = await prisma.membership.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  const orgId = membership?.organizationId ?? 'org_system';

  const { token, session } = await createSession({ userId: user.id, organizationId: orgId });
  setSessionCookie(res, token, session.expiresAt);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.json({ ok: true });
});

app.post('/api/auth/login/otp/start', otpLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const body = schema.parse(req.body);
  const email = body.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });

  const code = randomOtpCode();
  const codeHash = sha256(code);
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Demo: in production send email/SMS
  console.log(`[OTP] code sent to ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}`);
  res.json({ ok: true });
});

app.post('/api/auth/login/otp/verify', otpLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().email(), code: z.string().length(6) });
  const body = schema.parse(req.body);
  const email = body.email.toLowerCase();

  const codeHash = sha256(body.code);
  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      codeHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return res.status(400).json({ error: 'INVALID_OTP' });

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(400).json({ error: 'INVALID_OTP' });

  const membership = await prisma.membership.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  const orgId = membership?.organizationId ?? 'org_system';

  const { token, session } = await createSession({ userId: user.id, organizationId: orgId });
  setSessionCookie(res, token, session.expiresAt);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.json({ ok: true });
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token && typeof token === 'string') await destroySession(token).catch((err) => { console.warn('Failed to destroy session on logout:', err); });
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post('/api/auth/password/forgot', authLimiter, async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const body = schema.parse(req.body);
  const email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ ok: true });

  const token = randomToken(32);
  const tokenHash = sha256(token);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  console.log(`[RESET] token generated for ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}`);
  res.json({ ok: true });
});

app.post('/api/auth/password/reset', async (req, res) => {
  const schema = z.object({ token: z.string().min(10), password: z.string().min(8) });
  const body = schema.parse(req.body);
  const tokenHash = sha256(body.token);
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.consumedAt || reset.expiresAt.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'INVALID_RESET_TOKEN' });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { consumedAt: new Date() } }),
  ]);

  res.json({ ok: true });
});

// ---- Real-time SSE ----

app.get('/api/events/stream', requireAuth, async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const clientId = randomToken(12);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write(`event: hello\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  sseAddClient({ id: clientId, orgId: auth.organizationId, res });

  req.on('close', () => {
    sseRemoveClient(clientId);
  });
});

setInterval(() => ssePing(), 25_000).unref();

// ---- Client API ----

app.get('/api/client/overview', requireAuth, requirePermission('dashboard:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;

  const [events, workflows, integrations] = await Promise.all([
    prisma.event.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.workflow.findMany({ where: { organizationId: auth.organizationId } }),
    prisma.integration.findMany({ where: { organizationId: auth.organizationId } }),
  ]);

  const systemStatus =
    workflows.some((w: typeof workflows[number]) => w.healthStatus === 'error') || integrations.some((i: typeof integrations[number]) => i.healthStatus === 'error')
      ? 'error'
      : workflows.some((w: typeof workflows[number]) => w.healthStatus === 'warning') || integrations.some((i: typeof integrations[number]) => i.healthStatus === 'warning')
        ? 'warning'
        : 'healthy';

  const conversations = workflows.find((w: typeof workflows[number]) => (w.config as any)?.trigger === 'webhook:whatsapp')?.runCount ?? 0;
  const leads = Math.round(conversations * 0.12);
  const appointments = Math.round(leads * 0.57);
  const roi = 3.2;

  res.json({
    kpis: {
      conversations: { value: conversations, change: 12, trend: 'up' },
      leads: { value: leads, change: 8, trend: 'up' },
      appointments: { value: appointments, change: -3, trend: 'down' },
      roi: { value: roi, change: 0.4, trend: 'up' },
      timeSaved: { value: 42, unit: 'horas' },
      automationsActive: workflows.filter((w: typeof workflows[number]) => w.status === 'active').length,
    },
    systemStatus,
    recentActivity: events.map((e: typeof events[number]) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      timestamp: e.createdAt.toISOString(),
      status: e.status,
      metadata: e.metadata ?? undefined,
    })),
  });
});

app.get('/api/client/activity', requireAuth, requirePermission('dashboard:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const limit = z.coerce.number().int().positive().max(200).default(50).parse(req.query.limit ?? '50');

  const events = await prisma.event.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  res.json({
    events: events.map((e: typeof events[number]) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      timestamp: e.createdAt.toISOString(),
      status: e.status,
      metadata: e.metadata ?? undefined,
    })),
  });
});

app.get('/api/client/workflows', requireAuth, requirePermission('automation:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const workflows = await prisma.workflow.findMany({ where: { organizationId: auth.organizationId }, orderBy: { createdAt: 'asc' } });
  res.json({
    workflows: workflows.map((w: typeof workflows[number]) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      status: w.status,
      lastRun: w.lastRunAt?.toISOString() ?? null,
      nextRun: w.nextRunAt?.toISOString() ?? null,
      runCount: w.runCount,
      successRate: w.successRate,
      healthStatus: w.healthStatus,
      config: w.config,
    })),
  });
});

app.post('/api/client/workflows/:id/toggle', requireAuth, requirePermission('automation:edit'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const wf = await prisma.workflow.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!wf) return res.status(404).json({ error: 'NOT_FOUND' });
  const status = wf.status === 'active' ? 'paused' : 'active';
  await prisma.workflow.update({ where: { id }, data: { status } });
  res.json({ ok: true });
});

app.post('/api/client/workflows/:id/run', requireAuth, requirePermission('automation:run'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const wf = await prisma.workflow.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!wf) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.workflow.update({
    where: { id },
    data: { lastRunAt: new Date(), runCount: { increment: 1 }, status: wf.status === 'error' ? 'warning' : wf.status },
  });

  const event = await prisma.event.create({
    data: {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      type: 'automation',
      title: updated.name,
      description: 'Ejecución manual disparada desde el dashboard',
      status: 'success',
      metadata: { workflowId: updated.id },
    },
  });
  sseBroadcast(auth.organizationId, { type: 'activity', payload: { id: event.id, type: event.type, title: event.title, description: event.description, timestamp: event.createdAt.toISOString(), status: event.status, metadata: event.metadata } });

  res.json({ ok: true });
});

app.post('/api/client/workflows/:id/repair', requireAuth, requirePermission('automation:edit'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const wf = await prisma.workflow.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!wf) return res.status(404).json({ error: 'NOT_FOUND' });
  await prisma.workflow.update({ where: { id }, data: { status: 'active', healthStatus: 'healthy' } });
  res.json({ ok: true });
});

app.get('/api/client/tasks', requireAuth, requirePermission('tasks:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const tasks = await prisma.task.findMany({ where: { organizationId: auth.organizationId }, orderBy: { createdAt: 'asc' } });
  const runs = await prisma.taskRun.findMany({
    where: { organizationId: auth.organizationId, taskId: { in: tasks.map((t: typeof tasks[number]) => t.id) } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const steps = await prisma.taskStep.findMany({
    where: { organizationId: auth.organizationId, taskRunId: { in: runs.map((r: typeof runs[number]) => r.id) } },
    orderBy: { createdAt: 'asc' },
  });

  const lastRunByTask = new Map<string, (typeof runs)[number]>();
  for (const r of runs) {
    if (!lastRunByTask.has(r.taskId)) lastRunByTask.set(r.taskId, r);
  }
  const stepsByRun = new Map<string, typeof steps>();
  for (const s of steps) {
    const existing = stepsByRun.get(s.taskRunId) ?? [];
    existing.push(s);
    stepsByRun.set(s.taskRunId, existing);
  }

  res.json({
    tasks: tasks.map((t: typeof tasks[number]) => {
      const lastRun = lastRunByTask.get(t.id) ?? null;
      const lastRunSteps = lastRun ? stepsByRun.get(lastRun.id) ?? [] : [];
      const status = t.isPaused
        ? 'paused'
        : lastRun && (lastRun.status === 'running' || lastRun.status === 'queued' || lastRun.status === 'awaiting_approval')
          ? 'running'
          : lastRun?.status === 'completed'
            ? 'completed'
            : lastRun?.status === 'failed'
              ? 'failed'
              : 'idle';
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        status,
        schedule: t.schedule,
        lastRun: lastRun
          ? {
              id: lastRun.id,
              taskId: lastRun.taskId,
              status: lastRun.status,
              startedAt: (lastRun.startedAt ?? lastRun.createdAt).toISOString(),
              completedAt: lastRun.completedAt?.toISOString() ?? null,
              progress: lastRun.progress,
              steps: lastRunSteps.map((s: typeof steps[number]) => ({
                id: s.id,
                name: s.name,
                status: s.status,
                progress: s.progress,
                startedAt: s.startedAt?.toISOString(),
                completedAt: s.completedAt?.toISOString(),
                logs: (s.logs as any) ?? undefined,
              })),
              evidence: (lastRun.evidence as any) ?? undefined,
            }
          : null,
        runHistory: [],
        requiresApproval: t.requiresApproval,
        createdAt: t.createdAt.toISOString(),
      };
    }),
  });
});

app.post('/api/client/tasks', requireAuth, requirePermission('tasks:create'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    schedule: z.string().min(1),
    requiresApproval: z.boolean().optional().default(false),
  });
  const body = schema.parse(req.body);

  const task = await prisma.task.create({
    data: {
      organizationId: auth.organizationId,
      name: body.name,
      description: body.description,
      schedule: body.schedule,
      requiresApproval: body.requiresApproval,
    },
  });

  const event = await prisma.event.create({
    data: {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      type: 'task',
      title: 'Nueva misión creada',
      description: task.name,
      status: 'success',
      metadata: { taskId: task.id },
    },
  });
  sseBroadcast(auth.organizationId, {
    type: 'activity',
    payload: {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.createdAt.toISOString(),
      status: event.status,
      metadata: event.metadata,
    },
  });

  res.json({ ok: true, taskId: task.id });
});

app.post('/api/client/tasks/:id/toggle-pause', requireAuth, requirePermission('tasks:edit'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const task = await prisma.task.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!task) return res.status(404).json({ error: 'NOT_FOUND' });

  const updated = await prisma.task.update({ where: { id }, data: { isPaused: !task.isPaused } });
  const event = await prisma.event.create({
    data: {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      type: 'task',
      title: updated.isPaused ? 'Misión pausada' : 'Misión reanudada',
      description: updated.name,
      status: 'success',
      metadata: { taskId: updated.id, isPaused: updated.isPaused },
    },
  });
  sseBroadcast(auth.organizationId, {
    type: 'activity',
    payload: {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.createdAt.toISOString(),
      status: event.status,
      metadata: event.metadata,
    },
  });

  res.json({ ok: true, isPaused: updated.isPaused });
});

app.get('/api/client/task-runs', requireAuth, requirePermission('tasks:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const limit = z.coerce.number().int().positive().max(200).default(50).parse(req.query.limit ?? '50');
  const taskId = req.query.taskId ? z.string().parse(req.query.taskId) : null;

  const runs = await prisma.taskRun.findMany({
    where: { organizationId: auth.organizationId, ...(taskId ? { taskId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  const steps = await prisma.taskStep.findMany({
    where: { organizationId: auth.organizationId, taskRunId: { in: runs.map((r: typeof runs[number]) => r.id) } },
    orderBy: { createdAt: 'asc' },
  });
  const stepsByRun = new Map<string, typeof steps>();
  for (const s of steps) {
    const existing = stepsByRun.get(s.taskRunId) ?? [];
    existing.push(s);
    stepsByRun.set(s.taskRunId, existing);
  }

  res.json({
    taskRuns: runs.map((r: typeof runs[number]) => ({
      id: r.id,
      taskId: r.taskId,
      status: r.status,
      startedAt: (r.startedAt ?? r.createdAt).toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
      progress: r.progress,
      steps: (stepsByRun.get(r.id) ?? []).map((s: typeof steps[number]) => ({ id: s.id, name: s.name, status: s.status, progress: s.progress })),
      evidence: (r.evidence as any) ?? undefined,
    })),
  });
});

async function startTaskRunSimulation(params: { orgId: string; runId: string; taskName: string }) {
  // Simple in-memory simulation
  const checkpoints = [
    { progress: 10, step: 0, stepProgress: 20, message: 'Inicializando' },
    { progress: 30, step: 0, stepProgress: 100, message: 'Inicialización completa' },
    { progress: 60, step: 1, stepProgress: 60, message: 'Procesando' },
    { progress: 90, step: 2, stepProgress: 80, message: 'Finalizando' },
    { progress: 100, step: 2, stepProgress: 100, message: 'Completado' },
  ];

  for (const [idx, c] of checkpoints.entries()) {
    await new Promise((r) => setTimeout(r, 1200));

    const run = await prisma.taskRun.update({
      where: { id: params.runId },
      data: {
        status: c.progress >= 100 ? 'completed' : 'running',
        progress: c.progress,
        startedAt: idx === 0 ? new Date() : undefined,
        completedAt: c.progress >= 100 ? new Date() : null,
        evidence:
          c.progress >= 100
            ? {
                screenshots: ['/evidence/before.png', '/evidence/after.png'],
                logs: ['Ejecución completada', 'Resultado verificado'],
              }
            : undefined,
      },
    });

    const runSteps = await prisma.taskStep.findMany({
      where: { taskRunId: params.runId },
      orderBy: { createdAt: 'asc' },
    });
    const now = new Date();
    for (const [i, step] of runSteps.entries()) {
      if (i < c.step) {
        await prisma.taskStep.update({
          where: { id: step.id },
          data: {
            status: 'completed',
            progress: 100,
            startedAt: step.startedAt ?? now,
            completedAt: step.completedAt ?? now,
          },
        });
        continue;
      }

      if (i === c.step) {
        const existingLogs = Array.isArray(step.logs) ? (step.logs as string[]) : [];
        const nextLogs = [...existingLogs, `[${now.toISOString()}] ${c.message}`];
        await prisma.taskStep.update({
          where: { id: step.id },
          data: {
            status: c.stepProgress >= 100 ? 'completed' : 'running',
            progress: c.stepProgress,
            startedAt: step.startedAt ?? now,
            completedAt: c.stepProgress >= 100 ? now : null,
            logs: nextLogs as any,
          },
        });

        sseBroadcast(params.orgId, {
          type: 'task_log',
          payload: {
            runId: params.runId,
            stepId: step.id,
            stepName: step.name,
            message: c.message,
            timestamp: now.toISOString(),
          },
        });
        continue;
      }

      await prisma.taskStep.update({
        where: { id: step.id },
        data: { status: 'pending', progress: 0 },
      });
    }

    const event = await prisma.event.create({
      data: {
        organizationId: params.orgId,
        type: 'task',
        title: params.taskName,
        description: `Progreso ${c.progress}% - ${c.message}`,
        status: c.progress >= 100 ? 'success' : 'pending',
        metadata: { runId: run.id, progress: run.progress },
      },
    });

    sseBroadcast(params.orgId, {
      type: 'task_progress',
      payload: {
        runId: run.id,
        progress: run.progress,
        status: run.status,
      },
    });
    sseBroadcast(params.orgId, {
      type: 'activity',
      payload: {
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        timestamp: event.createdAt.toISOString(),
        status: event.status,
        metadata: event.metadata,
      },
    });
  }
}

app.post('/api/client/tasks/run', requireAuth, requirePermission('tasks:run'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const schema = z.object({ taskId: z.string().min(1) });
  const body = schema.parse(req.body);

  const task = await prisma.task.findFirst({ where: { id: body.taskId, organizationId: auth.organizationId } });
  if (!task) return res.status(404).json({ error: 'NOT_FOUND' });
  if (task.isPaused) return res.status(400).json({ error: 'TASK_PAUSED' });

  const canApprove = auth.permissions.includes('*') || auth.permissions.includes('approvals:approve');

  if (task.requiresApproval && !canApprove) {
    const run = await prisma.taskRun.create({
      data: {
        organizationId: auth.organizationId,
        taskId: task.id,
        requestedByUserId: auth.userId,
        status: 'awaiting_approval',
        progress: 0,
      },
    });
    const approval = await prisma.approval.create({
      data: {
        organizationId: auth.organizationId,
        taskRunId: run.id,
        type: 'task_run',
        title: `Ejecutar: ${task.name}`,
        description: `Se requiere aprobación para ejecutar esta misión`,
        status: 'pending',
        requestedByUserId: auth.userId,
        metadata: { taskId: task.id, taskRunId: run.id },
      },
    });

    const event = await prisma.event.create({
      data: {
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        type: 'approval',
        title: 'Aprobación requerida',
        description: `${task.name} espera aprobación`,
        status: 'pending',
        metadata: { approvalId: approval.id },
      },
    });
    sseBroadcast(auth.organizationId, { type: 'activity', payload: { id: event.id, type: event.type, title: event.title, description: event.description, timestamp: event.createdAt.toISOString(), status: event.status, metadata: event.metadata } });

    return res.json({ ok: true, awaitingApproval: true, approvalId: approval.id, runId: run.id });
  }

  const run = await prisma.taskRun.create({
    data: {
      organizationId: auth.organizationId,
      taskId: task.id,
      requestedByUserId: auth.userId,
      status: 'running',
      startedAt: new Date(),
      progress: 0,
    },
  });
  await prisma.taskStep.createMany({
    data: [
      { organizationId: auth.organizationId, taskRunId: run.id, name: 'Inicializando', status: 'running', progress: 0 },
      { organizationId: auth.organizationId, taskRunId: run.id, name: 'Procesando', status: 'pending', progress: 0 },
      { organizationId: auth.organizationId, taskRunId: run.id, name: 'Finalizando', status: 'pending', progress: 0 },
    ],
  });

  void startTaskRunSimulation({ orgId: auth.organizationId, runId: run.id, taskName: task.name });

  res.json({ ok: true, runId: run.id });
});

app.post('/api/client/approve', requireAuth, requirePermission('approvals:approve'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const schema = z.object({ approvalId: z.string().min(1), decision: z.enum(['approve', 'reject']) });
  const body = schema.parse(req.body);

  const approval = await prisma.approval.findFirst({
    where: { id: body.approvalId, organizationId: auth.organizationId, status: 'pending' },
  });
  if (!approval) return res.status(404).json({ error: 'NOT_FOUND' });

  const newStatus = body.decision === 'approve' ? 'approved' : 'rejected';
  const updated = await prisma.approval.update({
    where: { id: approval.id },
    data: { status: newStatus, decidedByUserId: auth.userId, decidedAt: new Date() },
  });

  if (updated.taskRunId && newStatus === 'approved') {
    const run = await prisma.taskRun.findUnique({ where: { id: updated.taskRunId } });
    if (run) {
      const task = await prisma.task.findUnique({ where: { id: run.taskId } });
      await prisma.taskRun.update({
        where: { id: run.id },
        data: { status: 'running', startedAt: new Date(), progress: 0 },
      });
      await prisma.taskStep.createMany({
        data: [
          { organizationId: auth.organizationId, taskRunId: run.id, name: 'Inicializando', status: 'running', progress: 0 },
          { organizationId: auth.organizationId, taskRunId: run.id, name: 'Procesando', status: 'pending', progress: 0 },
          { organizationId: auth.organizationId, taskRunId: run.id, name: 'Finalizando', status: 'pending', progress: 0 },
        ],
        skipDuplicates: true,
      });
      void startTaskRunSimulation({ orgId: auth.organizationId, runId: run.id, taskName: task?.name ?? 'Tarea' });
    }
  }

  const event = await prisma.event.create({
    data: {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      type: 'approval',
      title: `Aprobación ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}`,
      description: updated.title,
      status: newStatus === 'approved' ? 'success' : 'warning',
      metadata: { approvalId: updated.id, status: updated.status },
    },
  });
  sseBroadcast(auth.organizationId, { type: 'activity', payload: { id: event.id, type: event.type, title: event.title, description: event.description, timestamp: event.createdAt.toISOString(), status: event.status, metadata: event.metadata } });

  res.json({ ok: true });
});

app.get('/api/client/approvals', requireAuth, requirePermission('approvals:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const approvals = await prisma.approval.findMany({
    where: { organizationId: auth.organizationId },
    include: { requestedBy: true },
    orderBy: { requestedAt: 'desc' },
    take: 100,
  });
  res.json({
    approvals: approvals.map((a: typeof approvals[number]) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      requestedBy: a.requestedBy?.name ?? a.requestedBy?.email ?? 'system',
      requestedAt: a.requestedAt.toISOString(),
      status: a.status,
      metadata: a.metadata ?? undefined,
    })),
  });
});

// Integrations
app.get('/api/client/integrations', requireAuth, requirePermission('integrations:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const integrations = await prisma.integration.findMany({ where: { organizationId: auth.organizationId }, orderBy: { createdAt: 'asc' } });
  res.json({
    integrations: integrations.map((i: typeof integrations[number]) => ({
      id: i.id,
      name: i.name,
      provider: i.provider,
      status: i.status,
      lastSync: i.lastSyncAt?.toISOString() ?? null,
      healthStatus: i.healthStatus,
      config: i.config,
      credentials: i.credentials,
      estimatedCost: i.estimatedCost ?? undefined,
    })),
  });
});

app.post('/api/client/integrations/:id/test', requireAuth, requirePermission('integrations:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const integration = await prisma.integration.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!integration) return res.status(404).json({ error: 'NOT_FOUND' });

  const ok = integration.healthStatus !== 'error';
  res.json({ success: ok, message: ok ? 'Conexión exitosa' : 'Error de conexión: Token inválido' });
});

app.post('/api/client/integrations/:id/disconnect', requireAuth, requirePermission('integrations:connect'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const integration = await prisma.integration.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!integration) return res.status(404).json({ error: 'NOT_FOUND' });
  await prisma.integration.update({ where: { id }, data: { status: 'disconnected' } });

  const event = await prisma.event.create({
    data: {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      type: 'integration',
      title: 'Integración desconectada',
      description: integration.name,
      status: 'warning',
      metadata: { integrationId: integration.id },
    },
  });
  sseBroadcast(auth.organizationId, {
    type: 'activity',
    payload: {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.createdAt.toISOString(),
      status: event.status,
      metadata: event.metadata,
    },
  });
  res.json({ ok: true });
});

app.patch('/api/client/integrations/:id/config', requireAuth, requirePermission('integrations:edit'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = z.string().parse(req.params.id);
  const schema = z.object({
    appIconUrl: z.string().url().nullable().optional(),
    privacyPolicyUrl: z.string().url().nullable().optional(),
    userDataDeletionUrl: z.string().url().nullable().optional(),
    category: z.string().min(2).nullable().optional(),
  });
  const body = schema.parse(req.body);

  const integration = await prisma.integration.findFirst({ where: { id, organizationId: auth.organizationId } });
  if (!integration) return res.status(404).json({ error: 'NOT_FOUND' });

  const config = (integration.config as any) ?? {};
  const merged = { ...config, ...body };
  await prisma.integration.update({ where: { id }, data: { config: merged } });

  const event = await prisma.event.create({
    data: {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      type: 'integration',
      title: 'Requisitos actualizados',
      description: integration.name,
      status: 'success',
      metadata: { integrationId: integration.id },
    },
  });
  sseBroadcast(auth.organizationId, {
    type: 'activity',
    payload: {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.createdAt.toISOString(),
      status: event.status,
      metadata: event.metadata,
    },
  });

  res.json({ ok: true });
});

// Users
app.get('/api/client/users', requireAuth, requirePermission('security:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const memberships = await prisma.membership.findMany({
    where: { organizationId: auth.organizationId },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({
    users: memberships.map((m: typeof memberships[number]) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.user.systemRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : m.role,
      isActive: m.user.isActive,
      lastLoginAt: (m.user.lastLoginAt ?? m.user.createdAt).toISOString(),
    })),
  });
});

app.get('/api/client/audit-logs', requireAuth, requirePermission('security:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const limit = z.coerce.number().int().positive().max(200).default(50).parse(req.query.limit ?? '50');
  const logs = await prisma.auditLog.findMany({
    where: { organizationId: auth.organizationId },
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json({
    logs: logs.map((l: typeof logs[number]) => ({
      id: l.id,
      organizationId: l.organizationId,
      userId: l.actorUserId,
      userName: l.actor?.name ?? null,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      timestamp: l.createdAt.toISOString(),
      ip: l.ip,
      userAgent: l.userAgent,
      severity: l.severity,
      details: (l.details as any) ?? undefined,
    })),
  });
});

// ---- Admin API ----

app.get('/api/admin/clients', requireAuth, requirePermission('admin:clients'), async (_req, res) => {
  const orgs = await prisma.organization.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({
    clients: orgs.map((o: typeof orgs[number]) => ({ id: o.id, name: o.name, plan: o.plan, status: o.status, createdAt: o.createdAt.toISOString() })),
  });
});

app.get('/api/admin/users', requireAuth, requirePermission('admin:impersonate'), async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const orgId = typeof req.query.orgId === 'string' ? req.query.orgId : null;
  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [{ email: { contains: q } }, { name: { contains: q } }],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });
  const memberships = await prisma.membership.findMany({
    where: { userId: { in: users.map((u: typeof users[number]) => u.id) }, ...(orgId ? { organizationId: orgId } : {}) },
  });
  const membershipsByUser = new Map<string, typeof memberships>();
  for (const m of memberships) {
    const existing = membershipsByUser.get(m.userId) ?? [];
    existing.push(m);
    membershipsByUser.set(m.userId, existing);
  }
  res.json({
    users: users.map((u: typeof users[number]) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      systemRole: u.systemRole,
      memberships: (membershipsByUser.get(u.id) ?? []).map((m: typeof memberships[number]) => ({ organizationId: m.organizationId, role: m.role })),
    })),
  });
});

app.get('/api/admin/metrics', requireAuth, requirePermission('admin:metrics'), async (_req, res) => {
  const [orgs, users, runs, events] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.taskRun.count(),
    prisma.event.count(),
  ]);
  res.json({ orgs, users, taskRuns: runs, events });
});

app.get('/api/admin/logs', requireAuth, requirePermission('admin:logs'), async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({
    logs: logs.map((l: typeof logs[number]) => ({
      id: l.id,
      organizationId: l.organizationId,
      userId: l.actorUserId,
      userName: l.actor?.name ?? l.actor?.email ?? null,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      ip: l.ip,
      userAgent: l.userAgent,
      severity: l.severity,
      timestamp: l.createdAt.toISOString(),
      details: l.details ?? undefined,
    })),
  });
});

app.post('/api/admin/impersonate', requireAuth, requirePermission('admin:impersonate'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const schema = z.object({
    userId: z.string().nullable().optional(),
    organizationId: z.string().nullable().optional(),
  });
  const body = schema.parse(req.body);

  const session = await prisma.session.findUnique({ where: { id: auth.sessionId } });
  if (!session) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  if (!body.userId) {
    await prisma.session.update({
      where: { id: session.id },
      data: { impersonatedUserId: null, impersonatedOrgId: null },
    });
    return res.json({ ok: true });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!targetUser) return res.status(404).json({ error: 'NOT_FOUND' });

  const targetMemberships = await prisma.membership.findMany({ where: { userId: targetUser.id }, orderBy: { createdAt: 'asc' } });
  const orgId = body.organizationId ?? targetMemberships[0]?.organizationId ?? null;
  if (!orgId) return res.status(400).json({ error: 'NO_ORG' });

  const membership = targetMemberships.find((m: typeof targetMemberships[number]) => m.organizationId === orgId) ?? null;
  if (!membership && targetUser.systemRole !== 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'NO_ORG_ACCESS' });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      impersonatedUserId: targetUser.id,
      impersonatedOrgId: orgId,
    },
  });
  res.json({ ok: true });
});

// ---- Public Contact Forms ----

app.post('/api/contact', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(10),
  });
  const body = schema.parse(req.body);

  try {
    await sendContactEmail(body);
    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Error sending contact email:', error);
    res.status(500).json({ error: 'FAILED_TO_SEND' });
  }
});

app.post('/api/audit', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    whatsapp: z.string().optional(),
    businessName: z.string().min(2),
    businessType: z.string().min(1),
    priorities: z.array(z.string()),
    monthlyLeads: z.string().optional(),
    monthlyRevenue: z.string().optional(),
  });
  const body = schema.parse(req.body);

  try {
    await sendAuditEmail(body);
    const auth = (req as Partial<AuthedRequest>).auth;
    await createAuditLogSafe({
      organizationId: auth?.organizationId,
      actorUserId: auth?.userId,
      action: 'AUDIT_REQUEST_SUBMITTED',
      resource: 'audit_request',
      req,
      severity: 'low',
      details: {
        businessType: body.businessType,
        prioritiesCount: body.priorities.length,
      },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Error sending audit email:', error);
    res.status(500).json({ error: 'FAILED_TO_SEND' });
  }
});

// ---- Stripe Checkout API ----

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!isStripeEnabled() || !stripe) {
    return res.status(400).json({ error: 'STRIPE_NOT_CONFIGURED' });
  }

  const schema = z.object({
    planId: z.string(),
    planName: z.string(),
    amount: z.number().int().positive().max(100_000_000), // cents MXN
    customerEmail: z.string().email(),
    organizationId: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'INVALID_REQUEST', details: parsed.error.flatten() });
  }
  const { planId, planName, amount, customerEmail, organizationId } = parsed.data;

  try {
    const paymentId = `pay_${randomToken(16)}`;

    // Create payment record as pending
    await prisma.payment.create({
      data: {
        organizationId: organizationId || null,
        paymentId,
        amount,
        currency: 'mxn',
        status: 'pending',
        planId,
        planName,
        customerEmail,
        encryptedData: '', // No card data — Stripe handles it
        metadata: {
          ip: getClientIp(req),
          userAgent: req.get('user-agent') || 'unknown',
          paymentMethod: 'stripe_checkout',
        } as any,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Plan ${planName}`,
              description: `Empleado Digital – Plan ${planName} (mensualidad)`,
            },
            unit_amount: amount, // already in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId,
        planId,
        planName,
        organizationId: organizationId || '',
      },
      success_url: `${env.APP_ORIGIN}/#/dashboard?checkout=success&paymentId=${paymentId}`,
      cancel_url: `${env.APP_ORIGIN}/#/dashboard?checkout=cancel`,
    });

    await createAuditLogSafe({
      organizationId: organizationId || null,
      action: 'STRIPE_CHECKOUT_CREATED',
      resource: 'payment',
      resourceId: paymentId,
      req,
      severity: 'medium',
      details: {
        stripeSessionId: session.id,
        amount,
        currency: 'mxn',
        customerEmail,
        planId,
      },
    });

    console.log('[STRIPE] Checkout session created:', session.id, 'paymentId:', paymentId);
    res.json({ url: session.url, sessionId: session.id, paymentId });
  } catch (error) {
    console.error('[STRIPE] Error creating checkout session:', error);
    res.status(500).json({ error: 'STRIPE_CHECKOUT_FAILED' });
  }
});

// Check if Stripe is available
app.get('/api/stripe/status', (_req, res) => {
  res.json({ enabled: isStripeEnabled() });
});

// ---- Payment API (Sistema Encriptado Propio) ----

app.post('/api/payment/process', async (req, res) => {
  const schema = z.object({
    planId: z.string(),
    planName: z.string(),
    amount: z.number().int().positive().max(100_000_000), // Amount in cents
    currency: z.string().trim().min(3).max(3).default('mxn'),
    customerEmail: z.string().email(),
    customerName: z.string().optional(),
    // Datos de pago
    cardNumber: z.string().min(13).max(25),
    cardHolder: z.string().min(2),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/),
    organizationId: z.string().optional(),
  });
  
  const parsedBody = schema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'INVALID_PAYMENT_REQUEST', details: parsedBody.error.flatten() });
  }
  const body = parsedBody.data;

  try {
    const cardNumberDigits = body.cardNumber.replace(/\D/g, '');
    if (!isValidCardNumber(cardNumberDigits)) {
      return res.status(400).json({ error: 'INVALID_CARD_NUMBER' });
    }
    if (!isExpiryValid(body.expiry)) {
      return res.status(400).json({ error: 'INVALID_CARD_EXPIRY' });
    }

    // Generar ID único del pago
    const paymentId = `pay_${randomToken(16)}`;
    const cardLast4 = cardNumberDigits.slice(-4);
    const maskedCard = maskCardNumber(cardNumberDigits);
    
    // Preparar datos de pago para encriptar
    const paymentData = {
      cardNumber: cardNumberDigits,
      cardHolder: body.cardHolder,
      expiry: body.expiry,
      timestamp: new Date().toISOString(),
    };

    // Encriptar datos sensibles
    const encryptedData = encryptPaymentObject(paymentData);

    // Crear registro de pago en la base de datos
    const payment = await prisma.payment.create({
      data: {
        organizationId: body.organizationId || null,
        paymentId,
        amount: body.amount,
        currency: body.currency.toLowerCase(),
        status: 'pending',
        planId: body.planId,
        planName: body.planName,
        customerEmail: body.customerEmail,
        customerName: body.customerName || null,
        encryptedData,
        metadata: {
          ip: getClientIp(req),
          userAgent: req.get('user-agent') || 'unknown',
          cardLast4,
        } as any,
      },
    });

    // Enviar notificación por email con los datos (para que puedas procesar el pago)
    void sendPaymentNotification({
      paymentId,
      planName: body.planName,
      amount: body.amount,
      currency: body.currency,
      customerName: body.customerName || 'Cliente',
      customerEmail: body.customerEmail,
      paymentData: {
        maskedCard,
        cardLast4,
        cardHolder: body.cardHolder,
        expiry: body.expiry,
      },
    }).catch(err => {
      console.error('[EMAIL] Error sending payment notification:', err);
    });

    await createAuditLogSafe({
      organizationId: payment.organizationId,
      action: 'PAYMENT_CREATED',
      resource: 'payment',
      resourceId: payment.paymentId,
      req,
      severity: 'medium',
      details: {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        customerEmail: payment.customerEmail,
        cardLast4,
      },
    });

    console.log('[PAYMENT] Payment created:', paymentId);

    res.json({
      success: true,
      paymentId,
      status: 'pending',
      message: 'Pago recibido y encriptado. Serás notificado por email.',
    });
  } catch (error) {
    console.error('[API] Error processing payment:', error);
    const requestOrgId = typeof req.body?.organizationId === 'string' ? req.body.organizationId : null;
    await createAuditLogSafe({
      organizationId: requestOrgId,
      action: 'PAYMENT_FAILED',
      resource: 'payment',
      req,
      severity: 'high',
      details: {
        reason: 'FAILED_TO_PROCESS_PAYMENT',
      },
    });
    res.status(500).json({ error: 'FAILED_TO_PROCESS_PAYMENT' });
  }
});

// Endpoint para obtener detalles de un pago (requiere autenticación)
app.get('/api/payment/:paymentId', requireAuth, async (req, res) => {
  const { paymentId } = req.params;
  const auth = (req as AuthedRequest).auth;

  try {
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      return res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });
    }

    // Solo el admin o el dueño de la organización puede ver el pago
    if (auth.systemRole !== 'SUPER_ADMIN' && payment.organizationId !== auth.organizationId) {
      await createAuditLogSafe({
        organizationId: auth.organizationId,
        actorUserId: auth.userId,
        action: 'PAYMENT_ACCESS_DENIED',
        resource: 'payment',
        resourceId: paymentId,
        req,
        severity: 'high',
      });
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    // NO devolver los datos encriptados directamente por seguridad
    // Solo información básica
    res.json({
      id: payment.id,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      planId: payment.planId,
      planName: payment.planName,
      customerEmail: payment.customerEmail,
      customerName: payment.customerName,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      // Los datos encriptados solo se pueden desencriptar en el servidor con la clave
    });
  } catch (error) {
    console.error('[API] Error fetching payment:', error);
    res.status(500).json({ error: 'FAILED_TO_FETCH_PAYMENT' });
  }
});

// ---- Serve Web (optional) ----
const webDistDir = process.env.WEB_DIST_DIR
  ? path.resolve(process.env.WEB_DIST_DIR)
  : path.resolve(process.cwd(), '../app/dist');
const webIndex = path.join(webDistDir, 'index.html');

if (fs.existsSync(webIndex)) {
  app.use(express.static(webDistDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'NOT_FOUND' });
    res.sendFile(webIndex);
  });
}

app.listen(env.PORT, () => {
  console.log(`API listo en http://localhost:${env.PORT}`);
});
