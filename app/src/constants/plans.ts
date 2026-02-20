export const PENDING_CHECKOUT_KEY = 'kanlogic_pending_checkout_plan';

export const PLANS = [
  { id: 'starter', name: 'Starter', monthly: '$1,500 – $4,500' },
  { id: 'growth', name: 'Growth', monthly: '$6,000 – $25,000', popular: true },
  { id: 'commerce', name: 'Commerce', monthly: '$15,000 – $60,000' },
  { id: 'enterprise', name: 'Enterprise', monthly: '$50,000 – $300,000+' },
] as const;
