import { createHmac } from 'crypto';

export const getRevenueCatAppUserId = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const secret = (
    process.env.SUBSCRIPTION_USER_ID_SECRET ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();

  if (!secret) {
    throw new Error('SUBSCRIPTION_USER_ID_SECRET is not configured.');
  }

  return `smp_${createHmac('sha256', secret).update(normalizedEmail).digest('hex')}`;
};
