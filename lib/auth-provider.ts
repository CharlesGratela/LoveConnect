export type AuthProvider = 'legacy' | 'supabase';

export function getAuthProvider(): AuthProvider {
  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

  if (provider === 'supabase') {
    return 'supabase';
  }

  return 'legacy';
}

export function isSupabaseAuthEnabled() {
  return getAuthProvider() === 'supabase';
}
