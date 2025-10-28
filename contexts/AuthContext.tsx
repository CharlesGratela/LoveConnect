'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      console.log('[Auth] Checking authentication status...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important: include cookies
        cache: 'no-store',
      });
      
      console.log('[Auth] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Auth] User authenticated:', data.user?.email);
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
            console.log('[Auth] Restoring user from localStorage');
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
          console.log('[Auth] Restoring user from localStorage after error');
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
    console.log('[Auth] Attempting login for:', email);
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
    console.log('[Auth] Login successful:', data.user?.email);
    setUser(data.user);
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-user', JSON.stringify(data.user));
    }
  };

  const register = async (data: Omit<User, 'id'> & { password: string }) => {
    console.log('[Auth] Attempting registration for:', data.email);
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
    console.log('[Auth] Registration successful:', result.user?.email);
    setUser(result.user);
    
    // Store user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-user', JSON.stringify(result.user));
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logging out...');
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-user');
      }
      
      console.log('[Auth] Logout successful');
      router.push('/');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      console.log('[Auth] Updating profile...');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Auth] Profile updated successfully');
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
