'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { subscribeToPushNotifications, requestNotificationPermission } from '@/lib/notifications';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { getAuthProvider, type AuthProvider as AuthProviderType } from '@/lib/auth-provider';

interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  genderPreference: 'male' | 'female' | 'both';
  bio: string;
  profilePhoto: string;
  interests?: string[];
  location?: {
    type: string;
    coordinates: number[];
  };
  memberSince?: string;
  isProfileComplete?: boolean;
  profileCompleteness?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  authProvider: AuthProviderType;
}

interface SupabaseProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  age: number | null;
  gender: User['gender'] | null;
  gender_preference: User['genderPreference'] | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  latitude: number | null;
  longitude: number | null;
  member_since?: string | null;
  is_profile_complete?: boolean | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getDefaultProfilePhoto() {
  return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';
}

function mapSupabaseUserToAppUser(
  authUser: SupabaseUser,
  profile?: SupabaseProfileRow | null
): User {
  const metadata = authUser.user_metadata || {};
  const latitude = profile?.latitude ?? metadata.latitude;
  const longitude = profile?.longitude ?? metadata.longitude;

  return {
    id: authUser.id,
    email: profile?.email || authUser.email || '',
    name: profile?.name || metadata.name || '',
    age: profile?.age ?? Number(metadata.age || 18),
    gender: (profile?.gender || metadata.gender || 'other') as User['gender'],
    genderPreference: (
      profile?.gender_preference ||
      metadata.genderPreference ||
      'both'
    ) as User['genderPreference'],
    bio: profile?.bio || metadata.bio || '',
    profilePhoto: profile?.avatar_url || metadata.profilePhoto || getDefaultProfilePhoto(),
    interests: profile?.interests || metadata.interests || [],
    location:
      typeof latitude === 'number' && typeof longitude === 'number'
        ? {
            type: 'Point',
            coordinates: [longitude, latitude],
          }
        : undefined,
    memberSince: profile?.member_since || undefined,
    isProfileComplete: profile?.is_profile_complete ?? undefined,
    profileCompleteness: calculateProfileCompleteness({
      name: profile?.name || metadata.name || '',
      age: profile?.age ?? Number(metadata.age || 0),
      gender: (profile?.gender || metadata.gender || undefined) as User['gender'] | undefined,
      genderPreference: (
        profile?.gender_preference ||
        metadata.genderPreference ||
        undefined
      ) as User['genderPreference'] | undefined,
      bio: profile?.bio || metadata.bio || '',
      profilePhoto: profile?.avatar_url || metadata.profilePhoto || '',
      interests: profile?.interests || metadata.interests || [],
      location:
        typeof latitude === 'number' && typeof longitude === 'number'
          ? {
              type: 'Point',
              coordinates: [longitude, latitude],
            }
          : undefined,
    }),
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const authProvider = useMemo(() => getAuthProvider(), []);

  useEffect(() => {
    if (authProvider === 'supabase') {
      const supabase = createSupabaseClient();
      let mounted = true;

      const syncSupabaseUser = async () => {
        try {
          const {
            data: { user: authUser },
            error,
          } = await supabase.auth.getUser();

          if (error) {
            throw error;
          }

          if (!authUser) {
            if (mounted) {
              setUser(null);
            }
            return;
          }

          const profile = await ensureSupabaseProfile(supabase, authUser);

          if (mounted) {
            setUser(mapSupabaseUserToAppUser(authUser, profile));
          }

          if (authUser.id && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              subscribeToPushNotifications(authUser.id).catch((err) =>
                console.error('[Auth] Error subscribing to push:', err)
              );
            }
          }
        } catch (error) {
          console.error('[Auth] Supabase auth check error:', error);
          if (mounted) {
            setUser(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      void syncSupabaseUser();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        void syncSupabaseUser();
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    void checkLegacyAuth();

    const interval = setInterval(() => {
      void checkLegacyAuth();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authProvider]);

  const checkLegacyAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(data.user));
        }

        if (data.user?.id && typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            subscribeToPushNotifications(data.user.id).catch((err) =>
              console.error('[Auth] Error subscribing to push:', err)
            );
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('auth-user');
          setUser(storedUser ? JSON.parse(storedUser) : null);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[Auth] Legacy auth check error:', error);

      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('auth-user');
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (authProvider === 'supabase') {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const profile = await ensureSupabaseProfile(supabase, data.user);
        setUser(mapSupabaseUserToAppUser(data.user, profile));
      }

      try {
        const permission = await requestNotificationPermission();
        if (permission === 'granted' && data.user?.id) {
          await subscribeToPushNotifications(data.user.id);
        }
      } catch (error) {
        console.error('[Auth] Error setting up push notifications:', error);
      }

      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-user', JSON.stringify(data.user));
    }

    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted' && data.user?.id) {
        await subscribeToPushNotifications(data.user.id);
      }
    } catch (error) {
      console.error('[Auth] Error setting up push notifications:', error);
    }
  };

  const register = async (data: Omit<User, 'id'> & { password: string }) => {
    if (authProvider === 'supabase') {
      const supabase = createSupabaseClient();
      const latitude = data.location?.coordinates?.[1];
      const longitude = data.location?.coordinates?.[0];

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
          data: {
            name: data.name,
            age: String(data.age),
            gender: data.gender,
            genderPreference: data.genderPreference,
            bio: data.bio,
            profilePhoto: data.profilePhoto,
            interests: data.interests || [],
            latitude,
            longitude,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (signUpData.user && signUpData.session) {
        const profile = await ensureSupabaseProfile(supabase, signUpData.user, data);
        setUser(mapSupabaseUserToAppUser(signUpData.user, profile));
      } else {
        setUser(null);
      }

      return;
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    setUser(result.user);

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-user', JSON.stringify(result.user));
    }
  };

  const logout = async () => {
    try {
      if (authProvider === 'supabase') {
        const supabase = createSupabaseClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        setUser(null);
        router.push('/');
        return;
      }

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-user');
      }

      router.push('/');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (authProvider === 'supabase') {
        const supabase = createSupabaseClient();
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!authUser) {
          throw new Error('No authenticated user found');
        }

        const latitude = data.location?.coordinates?.[1];
        const longitude = data.location?.coordinates?.[0];

        const updates = {
          id: authUser.id,
          email: data.email ?? user?.email ?? authUser.email ?? null,
          name: data.name ?? user?.name ?? null,
          age: data.age ?? user?.age ?? null,
          gender: data.gender ?? user?.gender ?? null,
          gender_preference: data.genderPreference ?? user?.genderPreference ?? 'both',
          bio: data.bio ?? user?.bio ?? null,
          avatar_url: data.profilePhoto ?? user?.profilePhoto ?? getDefaultProfilePhoto(),
          interests: data.interests ?? user?.interests ?? [],
          latitude:
            typeof latitude === 'number'
              ? latitude
              : user?.location?.coordinates?.[1] ?? null,
          longitude:
            typeof longitude === 'number'
              ? longitude
              : user?.location?.coordinates?.[0] ?? null,
          is_profile_complete: isProfileComplete({
            ...user,
            ...data,
          }),
        };

        const { data: profile, error } = await supabase
          .from('profiles')
          .upsert(updates)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const nextUser = mapSupabaseUserToAppUser(authUser, profile as SupabaseProfileRow);
        setUser(nextUser);
        return;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.user);

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(result.user));
        }
      } else {
        const error = await response.json();
        console.error('[Auth] Profile update failed:', error);
      }
    } catch (error) {
      console.error('[Auth] Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        loading,
        authProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function isProfileComplete(user: Partial<User> | null | undefined) {
  return calculateProfileCompleteness(user) >= 100;
}

function calculateProfileCompleteness(user: Partial<User> | null | undefined) {
  if (!user) {
    return 0;
  }

  const checks = [
    Boolean(user.name),
    Boolean(user.age),
    Boolean(user.bio),
    Boolean(user.gender),
    Boolean(user.genderPreference),
    Boolean(user.profilePhoto),
    Boolean(user.interests && user.interests.length > 0),
    Boolean(user.location?.coordinates?.length === 2),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function ensureSupabaseProfile(
  supabase: SupabaseClient,
  authUser: SupabaseUser,
  fallbackData?: Partial<User>
) {
  const { data: existingProfile, error } = await supabase
    .from('profiles')
    .select(
      'id, email, name, age, gender, gender_preference, bio, avatar_url, interests, latitude, longitude, member_since, is_profile_complete'
    )
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (existingProfile) {
    return existingProfile as SupabaseProfileRow;
  }

  const metadata = authUser.user_metadata || {};
  const latitude =
    fallbackData?.location?.coordinates?.[1] ??
    (typeof metadata.latitude === 'number' ? metadata.latitude : null);
  const longitude =
    fallbackData?.location?.coordinates?.[0] ??
    (typeof metadata.longitude === 'number' ? metadata.longitude : null);

  const payload = {
    id: authUser.id,
    email: authUser.email ?? fallbackData?.email ?? null,
    name: fallbackData?.name ?? metadata.name ?? null,
    age: fallbackData?.age ?? (Number(metadata.age || 0) || null),
    gender: fallbackData?.gender ?? metadata.gender ?? null,
    gender_preference:
      fallbackData?.genderPreference ?? metadata.genderPreference ?? 'both',
    bio: fallbackData?.bio ?? metadata.bio ?? null,
    avatar_url:
      fallbackData?.profilePhoto ?? metadata.profilePhoto ?? getDefaultProfilePhoto(),
    interests: fallbackData?.interests ?? metadata.interests ?? [],
    latitude,
    longitude,
    is_profile_complete: isProfileComplete({
      email: authUser.email ?? fallbackData?.email ?? '',
      name: fallbackData?.name ?? metadata.name ?? '',
      age: fallbackData?.age ?? Number(metadata.age || 0),
      gender: (fallbackData?.gender ?? metadata.gender ?? 'other') as User['gender'],
      genderPreference: (
        fallbackData?.genderPreference ??
        metadata.genderPreference ??
        'both'
      ) as User['genderPreference'],
      bio: fallbackData?.bio ?? metadata.bio ?? '',
      profilePhoto:
        fallbackData?.profilePhoto ?? metadata.profilePhoto ?? getDefaultProfilePhoto(),
      interests: fallbackData?.interests ?? metadata.interests ?? [],
      location:
        typeof latitude === 'number' && typeof longitude === 'number'
          ? {
              type: 'Point',
              coordinates: [longitude, latitude],
            }
          : undefined,
    }),
  };

  const { data: insertedProfile, error: upsertError } = await supabase
    .from('profiles')
    .upsert(payload)
    .select(
      'id, email, name, age, gender, gender_preference, bio, avatar_url, interests, latitude, longitude, member_since, is_profile_complete'
    )
    .single();

  if (upsertError) {
    throw upsertError;
  }

  return insertedProfile as SupabaseProfileRow;
}
