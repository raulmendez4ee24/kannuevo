export const PENDING_CHECKOUT_KEY = 'kanlogic_pending_checkout_plan';

export const PLANS = [
  { id: 'starter', name: 'Starter', monthly: '$900 MXN' },
  { id: 'growth', name: 'Growth', monthly: '$4,500 MXN', popular: true },
  { id: 'commerce', name: 'Commerce', monthly: '$12,000 MXN' },
  { id: 'enterprise', name: 'Enterprise', monthly: '$50,000 MXN' },
] as const;
