import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type Stripe from 'stripe';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
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
import { randomOtpCode, randomToken, sha256, encryptPaymentObject } from './security.js';
import { sseAddClient, sseBroadcast, ssePing, sseRemoveClient } from './realtime.js';
import { permissionsForRoles } from './permissions.js';
import { sendContactEmail, sendAuditEmail } from './email.js';
import { createAuditLogSafe, getClientIp, inferSeverityFromStatus } from './audit.js';
import { rateLimit } from './rateLimit.js';
import { isStripeEnabled, stripe } from './stripe.js';

const app = express();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, name: 'auth' });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, name: 'otp' });
app.set('trust proxy', 1);

const DEFAULT_CHECKOUT_RETURN_HASH = '#/workforce';

function asJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeJsonObject(base: unknown, updates: Record<string, unknown>) {
  return {
    ...asJsonObject(base),
    ...updates,
  };
}

function normalizeCheckoutReturnHash(returnHash?: string): string {
  const trimmed = returnHash?.trim();
  if (!trimmed || !trimmed.startsWith('#/')) return DEFAULT_CHECKOUT_RETURN_HASH;
  return trimmed;
}

function resolveAppOrigin(req: express.Request): string {
  const originHeader = req.get('origin');
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      // ignore invalid origin header
    }
  }

  const host = req.get('x-forwarded-host') ?? req.get('host');
  if (host) {
    const protocol = (req.get('x-forwarded-proto') ?? req.protocol).split(',')[0]?.trim() || req.protocol;
    return `${protocol}://${host}`;
  }

  return env.APP_ORIGIN;
}

function buildCheckoutReturnUrl(
  req: express.Request,
  status: 'success' | 'canceled',
  paymentId: string,
  returnHash?: string,
  includeSessionId = false,
) {
  const params = new URLSearchParams({
    checkout: status,
    payment_id: paymentId,
  });
  if (includeSessionId) params.set('session_id', '{CHECKOUT_SESSION_ID}');
  return `${resolveAppOrigin(req)}/?${params.toString()}${normalizeCheckoutReturnHash(returnHash)}`;
}

async function updatePaymentFromStripe(params: {
  paymentId: string;
  status: string;
  metadata?: Record<string, unknown>;
  processedAt?: Date | null;
  notes?: string | null;
}) {
  const payment = await prisma.payment.findUnique({ where: { paymentId: params.paymentId } });
  if (!payment) return null;

  return prisma.payment.update({
    where: { paymentId: params.paymentId },
    data: {
      status: params.status,
      processedAt: params.processedAt === undefined ? payment.processedAt : params.processedAt,
      notes: params.notes === undefined ? payment.notes : params.notes,
      metadata: mergeJsonObject(payment.metadata, params.metadata ?? {}) as any,
    },
  });
}

function buildCheckoutSessionParams(
  req: express.Request,
  body: {
    planId: string;
    planName: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName?: string;
    organizationId?: string;
    billingLabel: 'monthly' | 'one_time';
    returnHash?: string;
  },
  paymentId: string,
): Stripe.Checkout.SessionCreateParams {
  const currency = body.currency.toLowerCase();
  const metadata: Record<string, string> = {
    paymentId,
    planId: body.planId,
    billingLabel: body.billingLabel,
  };

  if (body.organizationId) metadata.organizationId = body.organizationId;
  if (body.customerName) metadata.customerName = body.customerName;

  const productName = body.billingLabel === 'monthly' ? `${body.planName} - mensualidad` : body.planName;
  const productDescription = body.billingLabel === 'monthly'
    ? 'Suscripcion mensual administrada por Stripe Checkout.'
    : 'Pago unico procesado por Stripe Checkout.';

  const common: Stripe.Checkout.SessionCreateParams = {
    success_url: buildCheckoutReturnUrl(req, 'success', paymentId, body.returnHash, true),
    cancel_url: buildCheckoutReturnUrl(req, 'canceled', paymentId, body.returnHash),
    customer_email: body.customerEmail,
    client_reference_id: paymentId,
    billing_address_collection: 'auto',
    locale: 'es',
    metadata,
    line_items: [],
  };

  if (body.billingLabel === 'monthly') {
    common.mode = 'subscription';
    common.line_items = [
      {
        quantity: 1,
        price_data: {
          currency,
          recurring: { interval: 'month' },
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: body.amount,
        },
      },
    ];
    common.subscription_data = { metadata };
    return common;
  }

  common.mode = 'payment';
  common.line_items = [
    {
      quantity: 1,
      price_data: {
        currency,
        product_data: {
          name: productName,
          description: productDescription,
        },
        unit_amount: body.amount,
      },
    },
  ];
  common.payment_intent_data = { metadata };
  return common;
}

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'STRIPE_WEBHOOK_NOT_CONFIGURED' });
  }

  const signature = req.get('stripe-signature');
  if (!signature) {
    return res.status(400).json({ error: 'MISSING_STRIPE_SIGNATURE' });
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'INVALID_WEBHOOK_PAYLOAD' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('[STRIPE] Invalid webhook signature:', error);
    return res.status(400).send('Invalid Stripe signature');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = event.data.object;
        const paymentId = session.metadata?.paymentId || session.client_reference_id;
        if (!paymentId) break;

        const paymentStatus =
          event.type === 'checkout.session.expired'
            ? 'canceled'
            : event.type === 'checkout.session.async_payment_failed'
              ? 'failed'
              : session.payment_status === 'paid'
                ? 'completed'
                : 'processing';

        const updatedPayment = await updatePaymentFromStripe({
          paymentId,
          status: paymentStatus,
          processedAt: paymentStatus === 'completed' || paymentStatus === 'failed' || paymentStatus === 'canceled'
            ? new Date()
            : undefined,
          metadata: {
            stripeCheckoutSessionId: session.id,
            stripeSessionStatus: session.status,
            stripePaymentStatus: session.payment_status,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            stripeSubscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id ?? null,
            stripeLastEventId: event.id,
            stripeLastEventType: event.type,
          },
          notes:
            paymentStatus === 'completed'
              ? 'Pago confirmado por Stripe.'
              : paymentStatus === 'failed'
                ? 'Stripe reporto una falla en el cobro.'
                : paymentStatus === 'canceled'
                  ? 'La sesion de Stripe fue cancelada o expiro.'
                  : undefined,
        });

        if (updatedPayment) {
          await createAuditLogSafe({
            organizationId: updatedPayment.organizationId,
            action: 'STRIPE_WEBHOOK_PROCESSED',
            resource: 'payment',
            resourceId: updatedPayment.paymentId,
            req,
            severity: paymentStatus === 'completed' ? 'low' : 'medium',
            details: {
              eventId: event.id,
              eventType: event.type,
              status: paymentStatus,
            },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const paymentId = paymentIntent.metadata?.paymentId;
        if (!paymentId) break;

        const updatedPayment = await updatePaymentFromStripe({
          paymentId,
          status: 'failed',
          processedAt: new Date(),
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            stripeLastEventId: event.id,
            stripeLastEventType: event.type,
            stripeFailureCode: paymentIntent.last_payment_error?.code ?? null,
            stripeFailureMessage: paymentIntent.last_payment_error?.message ?? null,
          },
          notes: 'Stripe reporto que el PaymentIntent fallo.',
        });

        if (updatedPayment) {
          await createAuditLogSafe({
            organizationId: updatedPayment.organizationId,
            action: 'STRIPE_PAYMENT_FAILED',
            resource: 'payment',
            resourceId: updatedPayment.paymentId,
            req,
            severity: 'high',
            details: {
              eventId: event.id,
              paymentIntentId: paymentIntent.id,
              failureCode: paymentIntent.last_payment_error?.code ?? null,
            },
          });
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[STRIPE] Error processing webhook:', error);
    res.status(500).json({ error: 'STRIPE_WEBHOOK_PROCESSING_FAILED' });
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

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function buildDefaultOrgName(name: string, email: string) {
  const firstName = name.trim().split(/\s+/)[0];
  const fallback = email.split('@')[0];
  return `${firstName || fallback} Workspace`;
}

async function ensureSessionForUser(res: express.Response, userId: string, organizationId: string) {
  const { token, session } = await createSession({ userId, organizationId });
  setSessionCookie(res, token, session.expiresAt);
}

async function findOrCreateSocialUser(params: {
  provider: 'google' | 'apple';
  providerUserId: string;
  email?: string | null;
  name?: string | null;
}) {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: params.provider,
        providerUserId: params.providerUserId,
      },
    },
    include: {
      user: {
        include: {
          memberships: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (existingAccount) {
    if (!existingAccount.user.isActive) throw new Error('USER_DISABLED');
    const membership = existingAccount.user.memberships[0];
    if (!membership) throw new Error('NO_ORG_ACCESS');
    await prisma.user.update({
      where: { id: existingAccount.user.id },
      data: { lastLoginAt: new Date() },
    });
    return { userId: existingAccount.user.id, organizationId: membership.organizationId };
  }

  if (!params.email) throw new Error('EMAIL_REQUIRED');
  const email = params.email.toLowerCase();
  const displayName = params.name?.trim() || email.split('@')[0];

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (existingUser) {
    if (!existingUser.isActive) throw new Error('USER_DISABLED');
    const membership = existingUser.memberships[0];
    if (!membership) throw new Error('NO_ORG_ACCESS');

    await prisma.$transaction([
      prisma.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: params.provider,
          providerUserId: params.providerUserId,
          email,
        },
      }),
      prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: existingUser.name || displayName,
          lastLoginAt: new Date(),
        },
      }),
    ]);

    return { userId: existingUser.id, organizationId: membership.organizationId };
  }

  const org = await prisma.organization.create({
    data: {
      name: buildDefaultOrgName(displayName, email),
      plan: 'starter',
      status: 'trial',
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      name: displayName,
      passwordHash: null,
      systemRole: 'NONE',
      lastLoginAt: new Date(),
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'ORG_ADMIN',
    },
  });

  await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider: params.provider,
      providerUserId: params.providerUserId,
      email,
    },
  });

  return { userId: user.id, organizationId: org.id };
}

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

app.post('/api/auth/oauth/google', async (req, res) => {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({ error: 'GOOGLE_LOGIN_NOT_CONFIGURED' });
  }

  const schema = z.object({ idToken: z.string().min(10) });
  const body = schema.parse(req.body);

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: body.idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      return res.status(400).json({ error: 'INVALID_GOOGLE_TOKEN' });
    }

    const authTarget = await findOrCreateSocialUser({
      provider: 'google',
      providerUserId: payload.sub,
      email: payload.email,
      name: payload.name,
    });

    await ensureSessionForUser(res, authTarget.userId, authTarget.organizationId);
    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Google OAuth failed:', error);
    res.status(400).json({ error: 'INVALID_GOOGLE_TOKEN' });
  }
});

app.post('/api/auth/oauth/apple', async (req, res) => {
  if (!env.APPLE_CLIENT_ID) {
    return res.status(501).json({ error: 'APPLE_LOGIN_NOT_CONFIGURED' });
  }

  const schema = z.object({ idToken: z.string().min(10) });
  const body = schema.parse(req.body);

  try {
    const verified = await jwtVerify(body.idToken, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: env.APPLE_CLIENT_ID,
    });
    const payload = verified.payload;
    const providerUserId = typeof payload.sub === 'string' ? payload.sub : '';
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const name = typeof payload.email === 'string' ? payload.email.split('@')[0] : undefined;

    if (!providerUserId) {
      return res.status(400).json({ error: 'INVALID_APPLE_TOKEN' });
    }

    const authTarget = await findOrCreateSocialUser({
      provider: 'apple',
      providerUserId,
      email,
      name,
    });

    await ensureSessionForUser(res, authTarget.userId, authTarget.organizationId);
    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Apple OAuth failed:', error);
    res.status(400).json({ error: 'INVALID_APPLE_TOKEN' });
  }
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

  const [events, workflows, integrations, conversationCount, unreadAgg] = await Promise.all([
    prisma.event.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.workflow.findMany({ where: { organizationId: auth.organizationId } }),
    prisma.integration.findMany({ where: { organizationId: auth.organizationId } }),
    prisma.conversation.count({ where: { organizationId: auth.organizationId } }),
    prisma.conversation.aggregate({ where: { organizationId: auth.organizationId }, _sum: { unreadCount: true } }),
  ]);

  const systemStatus =
    workflows.some((w: typeof workflows[number]) => w.healthStatus === 'error') || integrations.some((i: typeof integrations[number]) => i.healthStatus === 'error')
      ? 'error'
      : workflows.some((w: typeof workflows[number]) => w.healthStatus === 'warning') || integrations.some((i: typeof integrations[number]) => i.healthStatus === 'warning')
        ? 'warning'
        : 'healthy';

  const conversations = conversationCount > 0
    ? conversationCount
    : (workflows.find((w: typeof workflows[number]) => (w.config as any)?.trigger === 'webhook:whatsapp')?.runCount ?? 0);
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
      unreadMessages: unreadAgg._sum.unreadCount ?? 0,
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

// ---- Conversations / Messages ----

app.get('/api/client/conversations', requireAuth, requirePermission('dashboard:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const status = req.query.status === 'archived' ? 'archived' : 'active';
  const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = z.coerce.number().int().positive().max(100).default(50).parse(req.query.limit ?? '50');

  const where: any = {
    organizationId: auth.organizationId,
    status,
    ...(channel ? { channel } : {}),
    ...(search ? {
      OR: [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search } },
      ],
    } : {}),
  };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
  });

  const convIds = conversations.map(c => c.id);
  const lastMessages = convIds.length > 0
    ? await prisma.message.findMany({
        where: { conversationId: { in: convIds } },
        orderBy: { timestamp: 'desc' },
        distinct: ['conversationId'],
      })
    : [];
  const lastMsgMap = new Map(lastMessages.map(m => [m.conversationId, m]));

  res.json({
    conversations: conversations.map(c => {
      const lastMsg = lastMsgMap.get(c.id);
      return {
        id: c.id,
        contactPhone: c.contactPhone,
        contactName: c.contactName,
        channel: c.channel,
        status: c.status,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
        unreadCount: c.unreadCount,
        lastMessage: lastMsg ? {
          body: lastMsg.body,
          direction: lastMsg.direction,
          timestamp: lastMsg.timestamp.toISOString(),
        } : null,
      };
    }),
  });
});

app.get('/api/client/conversations/:id/messages', requireAuth, requirePermission('dashboard:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = req.params.id;
  const limit = z.coerce.number().int().positive().max(100).default(50).parse(req.query.limit ?? '50');

  const conversation = await prisma.conversation.findFirst({
    where: { id, organizationId: auth.organizationId },
  });
  if (!conversation) return res.status(404).json({ error: 'NOT_FOUND' });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });

  // Mark as read
  if (conversation.unreadCount > 0) {
    await prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } });
  }

  res.json({
    conversation: {
      id: conversation.id,
      contactPhone: conversation.contactPhone,
      contactName: conversation.contactName,
      channel: conversation.channel,
      status: conversation.status,
    },
    messages: messages.map(m => ({
      id: m.id,
      direction: m.direction,
      body: m.body,
      mediaUrl: m.mediaUrl,
      timestamp: m.timestamp.toISOString(),
      status: m.status,
    })),
  });
});

app.post('/api/client/conversations/:id/messages', requireAuth, requirePermission('dashboard:view'), async (req, res) => {
  const auth = (req as AuthedRequest).auth;
  const id = req.params.id;
  const body = z.object({ body: z.string().min(1).max(4096) }).parse(req.body);

  const conversation = await prisma.conversation.findFirst({
    where: { id, organizationId: auth.organizationId },
  });
  if (!conversation) return res.status(404).json({ error: 'NOT_FOUND' });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      organizationId: auth.organizationId,
      direction: 'outbound',
      body: body.body,
      timestamp: new Date(),
      status: 'sent',
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: message.timestamp },
  });

  sseBroadcast(auth.organizationId, {
    type: 'new_message',
    payload: {
      conversationId: conversation.id,
      message: {
        id: message.id,
        direction: message.direction,
        body: message.body,
        timestamp: message.timestamp.toISOString(),
        status: message.status,
      },
    },
  });

  res.json({
    ok: true,
    message: {
      id: message.id,
      direction: message.direction,
      body: message.body,
      timestamp: message.timestamp.toISOString(),
      status: message.status,
    },
  });
});

// ---- Meta Webhook (for future WhatsApp Business API) ----

app.get('/api/webhooks/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (env.META_VERIFY_TOKEN || 'kanlogic_verify')) {
    console.log('[META] Webhook verified');
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'FORBIDDEN' });
});

app.post('/api/webhooks/meta', async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const data = req.body;
    if (data?.object !== 'whatsapp_business_account') return;

    const integration = await prisma.integration.findFirst({
      where: { provider: 'Meta', status: 'connected' },
    });
    if (!integration) return;

    const orgId = integration.organizationId;

    for (const entry of data.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        const value = change.value;

        for (const msg of value?.messages ?? []) {
          const from = msg.from;
          const contact = value?.contacts?.find((c: any) => c.wa_id === from);
          const contactName = contact?.profile?.name ?? null;
          const msgBody = msg.text?.body ?? '';
          const timestamp = new Date(parseInt(msg.timestamp) * 1000);

          const conversation = await prisma.conversation.upsert({
            where: { organizationId_contactPhone_channel: { organizationId: orgId, contactPhone: from, channel: 'whatsapp' } },
            update: { contactName: contactName || undefined, lastMessageAt: timestamp, unreadCount: { increment: 1 }, status: 'active' },
            create: { organizationId: orgId, contactPhone: from, contactName, channel: 'whatsapp', lastMessageAt: timestamp, unreadCount: 1 },
          });

          const existing = msg.id ? await prisma.message.findFirst({ where: { externalId: msg.id } }) : null;
          if (existing) continue;

          const newMsg = await prisma.message.create({
            data: {
              conversationId: conversation.id, organizationId: orgId,
              direction: 'inbound', body: msgBody, timestamp, status: 'delivered',
              externalId: msg.id ?? null,
            },
          });

          sseBroadcast(orgId, {
            type: 'new_message',
            payload: {
              conversationId: conversation.id,
              message: { id: newMsg.id, direction: 'inbound', body: msgBody, timestamp: timestamp.toISOString(), status: 'delivered' },
              contact: { phone: from, name: contactName },
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('[META] Webhook error:', err);
  }
});

// ---- Meta Data Deletion Callback ----
// Meta requires this endpoint to handle user data deletion requests
// See: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

app.post('/api/webhooks/meta/data-deletion', async (req, res) => {
  try {
    const { signed_request } = req.body;

    // Parse signed_request if META_APP_SECRET is available
    let userId = 'unknown';
    if (signed_request && env.META_APP_SECRET) {
      const [, payload] = signed_request.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
      userId = decoded.user_id ?? 'unknown';
    }

    // Generate a confirmation code
    const confirmationCode = `KAN-DEL-${Date.now().toString(36).toUpperCase()}`;
    const statusUrl = `${env.APP_ORIGIN}/#/data-deletion?code=${confirmationCode}`;

    console.log(`[META] Data deletion request for user ${userId}, code: ${confirmationCode}`);

    // Delete any conversations/messages associated with this Meta user if we can identify them
    // For now, log the request — actual deletion happens through the dashboard or support

    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error('[META] Data deletion error:', err);
    res.json({
      url: `${env.APP_ORIGIN}/#/data-deletion`,
      confirmation_code: `KAN-DEL-${Date.now().toString(36).toUpperCase()}`,
    });
  }
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
    selectedPlan: z.string().optional(),
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

// Check if Stripe is available
app.get('/api/stripe/status', (_req, res) => {
  res.json({ enabled: isStripeEnabled() });
});

// ---- Payment API (Stripe Checkout) ----

const paymentCheckoutSchema = z.object({
  planId: z.string().min(1),
  planName: z.string().min(1),
  amount: z.number().int().positive().max(100_000_000), // Amount in cents
  currency: z.string().trim().min(3).max(3).default('mxn'),
  customerEmail: z.string().email(),
  customerName: z.string().trim().min(2).optional(),
  organizationId: z.string().optional(),
  billingLabel: z.enum(['monthly', 'one_time']).default('monthly'),
  returnHash: z.string().optional(),
});

async function createStripeCheckoutSession(req: express.Request, res: express.Response) {
  if (!isStripeEnabled() || !stripe) {
    return res.status(503).json({ error: 'PAYMENT_NOT_CONFIGURED' });
  }

  const parsedBody = paymentCheckoutSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'INVALID_PAYMENT_REQUEST', details: parsedBody.error.flatten() });
  }

  const body = parsedBody.data;
  const paymentId = `pay_${randomToken(16)}`;
  const encryptedData = encryptPaymentObject({
    provider: 'stripe',
    checkoutInitializedAt: new Date().toISOString(),
    billingLabel: body.billingLabel,
  });

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
        provider: 'stripe',
        billingLabel: body.billingLabel,
        returnHash: normalizeCheckoutReturnHash(body.returnHash),
        ip: getClientIp(req),
        userAgent: req.get('user-agent') || 'unknown',
      } as any,
    },
  });

  try {
    const session = await stripe.checkout.sessions.create(buildCheckoutSessionParams(req, body, paymentId));

    if (!session.url) {
      throw new Error('Stripe Checkout session was created without URL');
    }

    await prisma.payment.update({
      where: { paymentId },
      data: {
        status: 'processing',
        metadata: mergeJsonObject(payment.metadata, {
          stripeCheckoutSessionId: session.id,
          stripeMode: session.mode,
        }) as any,
      },
    });

    await createAuditLogSafe({
      organizationId: payment.organizationId,
      action: 'STRIPE_CHECKOUT_CREATED',
      resource: 'payment',
      resourceId: payment.paymentId,
      req,
      severity: 'medium',
      details: {
        amount: payment.amount,
        currency: payment.currency,
        billingLabel: body.billingLabel,
        stripeCheckoutSessionId: session.id,
        stripeMode: session.mode,
      },
    });

    res.json({
      success: true,
      paymentId,
      url: session.url,
    });
  } catch (error) {
    console.error('[API] Error creating Stripe checkout session:', error);

    await prisma.payment.update({
      where: { paymentId },
      data: {
        status: 'failed',
        processedAt: new Date(),
        notes: 'No se pudo crear la sesion de Stripe Checkout.',
        metadata: mergeJsonObject(payment.metadata, {
          stripeSessionCreationFailedAt: new Date().toISOString(),
        }) as any,
      },
    });

    await createAuditLogSafe({
      organizationId: payment.organizationId,
      action: 'STRIPE_CHECKOUT_FAILED',
      resource: 'payment',
      resourceId: payment.paymentId,
      req,
      severity: 'high',
      details: {
        reason: 'FAILED_TO_CREATE_STRIPE_CHECKOUT_SESSION',
      },
    });

    res.status(500).json({ error: 'FAILED_TO_CREATE_CHECKOUT_SESSION' });
  }
}

app.post('/api/payment/checkout-session', createStripeCheckoutSession);
app.post('/api/payment/process', createStripeCheckoutSession);

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
