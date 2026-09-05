import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify, errors as joseErrors, type JWTPayload } from 'jose';
import { db } from '../db/index.js';
import type { NewRevokedToken, NewUser, UserRow } from '../db/index.js';
import type { User } from '../types/index.js';

const BCRYPT_ROUNDS = 12;

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
}

export async function signRefreshToken(userId: string, jti?: string): Promise<string> {
  const payload: Record<string, unknown> = {};
  if (jti) payload.jti = jti;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

export type TokenVerificationResult =
  | { valid: true; payload: JwtPayload }
  | { valid: false; reason: 'expired' | 'invalid_signature' | 'malformed' | 'unknown' };

export async function verifyTokenDetailed(token: string): Promise<TokenVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return { valid: true, payload: payload as unknown as JwtPayload };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      return { valid: false, reason: 'expired' };
    }
    if (err instanceof joseErrors.JWSSignatureVerificationFailed) {
      return { valid: false, reason: 'invalid_signature' };
    }
    if (err instanceof joseErrors.JWTInvalid || err instanceof joseErrors.JWSInvalid) {
      return { valid: false, reason: 'malformed' };
    }
    return { valid: false, reason: 'unknown' };
  }
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  const result = await verifyTokenDetailed(token);
  return result.valid ? result.payload : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email.toLowerCase())
    .executeTakeFirst();

  if (!row) return null;
  return dbUserToUser(row);
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();

  if (!row) return null;
  return dbUserToUser(row);
}

export async function createUser(
  email: string,
  password: string,
  role: User['role'] = 'viewer',
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const values: NewUser = {
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role,
  };

  const row = await db
    .insertInto('users')
    .values(values)
    .returningAll()
    .executeTakeFirst();

  if (!row) throw new Error('Failed to create user');
  return dbUserToUser(row);
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  const payload = await verifyToken(token);
  if (!payload) return false;

  // Extract JTI and expiry from the token (may not be present on old tokens)
  const parsed = await jwtVerify(token, getJwtSecret());
  const jti = (parsed.payload as JWTPayload & { jti?: string }).jti;
  const exp = parsed.payload.exp;

  if (jti && exp) {
    const values: NewRevokedToken = {
      user_id: payload.sub,
      jti,
      expires_at: new Date(exp * 1000),
    };
    await db.insertInto('revoked_tokens').values(values).executeTakeFirst();
  }

  return true;
}

export async function isRefreshTokenRevoked(jti: string): Promise<boolean> {
  const row = await db
    .selectFrom('revoked_tokens')
    .selectAll()
    .where('jti', '=', jti)
    .executeTakeFirst();
  return !!row;
}

function dbUserToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
