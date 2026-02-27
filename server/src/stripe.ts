import Stripe from 'stripe';
import { env } from './env.js';

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

export function isStripeEnabled(): boolean {
  return stripe !== null;
}
