import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value;
}

export async function getUserFromToken(): Promise<TokenPayload | null> {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  console.log('[Auth] Cookie set:', { 
    isProduction, 
    secure: isProduction, 
    sameSite: isProduction ? 'none' : 'lax' 
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  console.log('[Auth] Cookie removed');
}
