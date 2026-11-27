import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

interface ClaimedCredential {
  username: string;
  salt: string;
  passwordHash: string;
}

interface SessionPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface AuthedRequest extends Request {
  appUser?: string;
}

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS_PER_WINDOW = 10;

// Runtime signing key: uses SESSION_SECRET if configured, otherwise an ephemeral random key in memory.
const SESSION_SIGNING_KEY =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

let claimedCredential: ClaimedCredential | null = null;
const revokedJtis = new Map<string, number>();
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getEnvCredentials(): { username: string; password: string } | null {
  const username = process.env.APP_ACCESS_USERNAME?.trim();
  const password = process.env.APP_ACCESS_PASSWORD;
  if (username && password && password.length > 0) {
    return { username, password };
  }
  return null;
}

function constantTimeStringMatch(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function verifyPasswordScrypt(password: string, salt: string, storedHashHex: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHashHex, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function pruneExpiredState() {
  const now = Date.now();
  for (const [jti, exp] of revokedJtis.entries()) {
    if (exp <= now) revokedJtis.delete(jti);
  }
  for (const [ip, record] of loginAttempts.entries()) {
    if (record.resetAt <= now) loginAttempts.delete(ip);
  }
}

function signSessionToken(username: string): string {
  const now = Date.now();
  const payload: SessionPayload = {
    sub: username,
    jti: crypto.randomBytes(16).toString('hex'),
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyBearerToken(authHeader: string | undefined): SessionPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (
      !parsed ||
      typeof parsed.sub !== 'string' ||
      typeof parsed.jti !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    if (parsed.exp <= Date.now()) return null;
    if (revokedJtis.has(parsed.jti)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function isRateLimited(ip: string): boolean {
  pruneExpiredState();
  const record = loginAttempts.get(ip);
  if (!record) return false;
  return record.count >= MAX_ATTEMPTS_PER_WINDOW && record.resetAt > Date.now();
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const existing = loginAttempts.get(ip);
  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    existing.count += 1;
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function isAuthInitialized(): boolean {
  return getEnvCredentials() !== null || claimedCredential !== null;
}

export function getAuthStatusHandler(req: Request, res: Response): void {
  const envCreds = getEnvCredentials();
  const session = verifyBearerToken(req.headers.authorization);
  res.json({
    initialized: envCreds !== null || claimedCredential !== null,
    envConfigured: envCreds !== null,
    authenticated: session !== null,
    username: session ? session.sub : null,
  });
}

export function setupCredentialsHandler(req: Request, res: Response): void {
  if (getEnvCredentials() !== null || claimedCredential !== null) {
    res.status(409).json({
      error: 'Access credentials are already configured. Please sign in.',
    });
    return;
  }

  const rawUsername = req.body?.username;
  const rawPassword = req.body?.password;

  if (typeof rawUsername !== 'string' || typeof rawPassword !== 'string') {
    res.status(400).json({ error: 'Username and password must be strings.' });
    return;
  }

  const username = rawUsername.trim();
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    res.status(400).json({
      error: 'Username must be 3–32 characters (letters, numbers, _, ., or -).',
    });
    return;
  }

  if (rawPassword.length < 8 || rawPassword.length > 128) {
    res.status(400).json({
      error: 'Password must be between 8 and 128 characters.',
    });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(rawPassword, salt, 64).toString('hex');
  claimedCredential = {
    username,
    salt,
    passwordHash,
  };

  const token = signSessionToken(username);
  res.status(201).json({
    token,
    username,
    envConfigured: false,
  });
}

export function loginHandler(req: Request, res: Response): void {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({
      error: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
    });
    return;
  }

  const envCreds = getEnvCredentials();
  if (!envCreds && !claimedCredential) {
    res.status(409).json({
      error: 'Access credentials have not been set up yet.',
    });
    return;
  }

  const rawUsername = req.body?.username;
  const rawPassword = req.body?.password;

  if (
    typeof rawUsername !== 'string' ||
    typeof rawPassword !== 'string' ||
    rawUsername.trim().length === 0 ||
    rawUsername.length > 128 ||
    rawPassword.length === 0 ||
    rawPassword.length > 128
  ) {
    res.status(400).json({ error: 'Please provide a valid username and password.' });
    return;
  }

  const username = rawUsername.trim();
  let valid = false;

  if (envCreds) {
    const userOk = constantTimeStringMatch(username, envCreds.username);
    const passOk = constantTimeStringMatch(rawPassword, envCreds.password);
    valid = userOk && passOk;
  } else if (claimedCredential) {
    const userOk = constantTimeStringMatch(username, claimedCredential.username);
    const passOk = verifyPasswordScrypt(
      rawPassword,
      claimedCredential.salt,
      claimedCredential.passwordHash
    );
    valid = userOk && passOk;
  }

  if (!valid) {
    recordFailedAttempt(ip);
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  clearAttempts(ip);
  const resolvedUsername = envCreds ? envCreds.username : claimedCredential!.username;
  const token = signSessionToken(resolvedUsername);
  res.json({
    token,
    username: resolvedUsername,
    envConfigured: envCreds !== null,
  });
}

export function logoutHandler(req: Request, res: Response): void {
  const session = verifyBearerToken(req.headers.authorization);
  if (session) {
    revokedJtis.set(session.jti, session.exp);
  }
  res.json({ ok: true });
}

export function requireAppAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const session = verifyBearerToken(req.headers.authorization);
  if (!session) {
    res.status(401).json({ error: 'Authentication required to access Aurum Quant.' });
    return;
  }
  req.appUser = session.sub;
  next();
}
