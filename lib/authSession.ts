import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'smp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface AuthSession {
  email: string;
  exp: number;
}

function getSecret(): string {
  const secret = (
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUBSCRIPTION_USER_ID_SECRET ||
    ''
  ).trim();
  if (secret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must contain at least 32 characters');
  }
  return secret;
}

function encode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken(email: string): string {
  const payload = encode(JSON.stringify({
    email: email.toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  } satisfies AuthSession));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string | null): AuthSession | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  try {
    const expected = sign(payload);
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthSession;
    if (!session.email || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function getRequestSession(request: NextRequest): AuthSession | null {
  return readSessionToken(request.cookies.get(COOKIE_NAME)?.value);
}

export function setSessionCookie(response: NextResponse, email: string): void {
  response.cookies.set(COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
