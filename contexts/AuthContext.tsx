'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToPushNotifications, requestNotificationPermission } from '@/lib/notifications';

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
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(() => {
    checkAuth();
    
    // Periodic auth check every 5 minutes to maintain session
    const interval = setInterval(() => {
      checkAuth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important: include cookies
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Store user in localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(data.user));
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[Auth] Authentication failed:', response.status, errorData);
        
        // Try to restore from localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('auth-user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[Auth] Auth check error:', error);
      
      // Try to restore from localStorage on error
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('auth-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-user', JSON.stringify(data.user));
    }

    // Request notification permission and subscribe to push notifications
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
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Auth] Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    setUser(result.user);
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-user', JSON.stringify(result.user));
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      
      // Clear localStorage
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
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.user);
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(result.user));
        }
      } else {
        const error = await response.json();
        console.error('[Auth] Profile update failed:', error);
      }
    } catch (error) {
      console.error('[Auth] Profile update error:', error);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
