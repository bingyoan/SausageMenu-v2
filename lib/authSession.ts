import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const GOOGLE_AUDIENCES = [
  '708202943885-tmfdkjpeencn7nqbgqtmnlc7bjp8vajh.apps.googleusercontent.com',
  '708202943885-rev2dlrdaivfqavra8rc1q2u79o0vaht.apps.googleusercontent.com',
];

const sessionSecret = () => {
  const secret = (
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUBSCRIPTION_USER_ID_SECRET ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();
  if (!secret) throw new Error('AUTH_SESSION_SECRET is not configured.');
  return new TextEncoder().encode(secret);
};

export const issueSessionToken = async (email: string, providerSubject: string) =>
  new SignJWT({ email: email.trim().toLowerCase() })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(providerSubject)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(sessionSecret());

export const verifySessionToken = async (token: string) => {
  const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ['HS256'] });
  if (typeof payload.email !== 'string' || !payload.sub) throw new Error('Invalid session.');
  return { email: payload.email.toLowerCase(), subject: payload.sub };
};

export const verifyGoogleIdentity = async (idToken?: string, accessToken?: string) => {
  if (idToken) {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: GOOGLE_AUDIENCES,
    });
    if (typeof payload.email !== 'string' || !payload.sub) throw new Error('Google account has no email.');
    return { email: payload.email.toLowerCase(), subject: `google:${payload.sub}` };
  }

  if (accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Google access token is invalid.');
    const profile = await response.json();
    if (typeof profile.email !== 'string' || !profile.sub) throw new Error('Google account has no email.');
    return { email: profile.email.toLowerCase(), subject: `google:${profile.sub}` };
  }

  throw new Error('Google sign-in proof is missing.');
};

export const verifyAppleIdentity = async (identityToken: string) => {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: 'com.sausagemenu.app',
  });
  if (typeof payload.email !== 'string' || !payload.sub) throw new Error('Apple account has no email.');
  return { email: payload.email.toLowerCase(), subject: `apple:${payload.sub}` };
};
