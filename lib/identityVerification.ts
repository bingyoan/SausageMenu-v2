import { createPublicKey, verify, type JsonWebKey } from 'crypto';

interface JwtPayload {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface Identity {
  providerId: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
}

const GOOGLE_AUDIENCES = new Set([
  '708202943885-rev2dlrdaivfqavra8rc1q2u79o0vaht.apps.googleusercontent.com',
  '708202943885-tmfdkjpeencn7nqbgqtmnlc7bjp8vajh.apps.googleusercontent.com',
  ...(process.env.GOOGLE_CLIENT_IDS || '').split(',').map((value) => value.trim()).filter(Boolean),
]);

const APPLE_AUDIENCES = new Set([
  'com.sausagemenu.app',
  ...(process.env.APPLE_CLIENT_IDS || '').split(',').map((value) => value.trim()).filter(Boolean),
]);

function decodePart<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

async function verifyJwt(
  token: string,
  jwksUrl: string,
  issuers: Set<string>,
  audiences: Set<string>
): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid identity token');

  const header = decodePart<{ alg?: string; kid?: string }>(parts[0]);
  const payload = decodePart<JwtPayload>(parts[1]);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported identity token');

  const response = await fetch(jwksUrl, { cache: 'force-cache' });
  if (!response.ok) throw new Error('Unable to verify identity provider');
  const jwks = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Identity signing key was not found');

  const key = createPublicKey({ key: jwk, format: 'jwk' });
  const valid = verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    key,
    Buffer.from(parts[2], 'base64url')
  );
  if (!valid) throw new Error('Invalid identity token signature');

  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud || ''];
  if (!payload.iss || !issuers.has(payload.iss)) throw new Error('Invalid identity token issuer');
  if (!audience.some((value) => audiences.has(value))) throw new Error('Invalid identity token audience');
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Identity token expired');
  if (!payload.sub) throw new Error('Identity token has no subject');
  return payload;
}

export async function verifyGoogleCredential(input: {
  idToken?: string;
  accessToken?: string;
}): Promise<Identity> {
  if (input.idToken) {
    const payload = await verifyJwt(
      input.idToken,
      'https://www.googleapis.com/oauth2/v3/certs',
      new Set(['accounts.google.com', 'https://accounts.google.com']),
      GOOGLE_AUDIENCES
    );
    if (!payload.email) throw new Error('Google account has no email');
    return {
      providerId: payload.sub!,
      email: payload.email,
      displayName: payload.name,
      photoUrl: payload.picture,
    };
  }

  if (input.accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${input.accessToken}` },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Google access token is invalid');
    const profile = await response.json() as {
      sub?: string; email?: string; name?: string; picture?: string;
    };
    if (!profile.sub || !profile.email) throw new Error('Google profile is incomplete');
    return {
      providerId: profile.sub,
      email: profile.email,
      displayName: profile.name,
      photoUrl: profile.picture,
    };
  }

  throw new Error('Google credential is required');
}

export async function verifyAppleCredential(identityToken: string): Promise<Identity> {
  const payload = await verifyJwt(
    identityToken,
    'https://appleid.apple.com/auth/keys',
    new Set(['https://appleid.apple.com']),
    APPLE_AUDIENCES
  );
  if (!payload.email) throw new Error('Apple account email is unavailable');
  return { providerId: payload.sub!, email: payload.email };
}
