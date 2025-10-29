'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Heart, Upload, X, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCurrentLocation } from '@/lib/geolocation';

const INTEREST_OPTIONS = [
  'Travel', 'Music', 'Movies', 'Sports', 'Reading', 'Cooking',
  'Fitness', 'Art', 'Gaming', 'Photography', 'Dancing', 'Hiking',
  'Technology', 'Fashion', 'Food', 'Pets', 'Yoga', 'Coffee'
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: '',
    genderPreference: 'both',
    bio: '',
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
    interests: [] as string[],
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { login, register } = useAuth();
  const router = useRouter();

  const handlePhotoUrlChange = () => {
    if (photoUrl.trim()) {
      setFormData({ ...formData, profilePhoto: photoUrl });
      setPhotoUrl('');
      toast.success('Photo URL updated!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, profilePhoto: base64String });
      setUploading(false);
      toast.success('Photo uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to upload photo');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        try {
          await login(formData.email, formData.password);
          toast.success('Welcome back!');
          router.push('/discover');
        } catch (error: any) {
          // Check if error is due to unverified email
          if (error.message?.includes('verify your email') || error.status === 403) {
            toast.error('Please verify your email before logging in', {
              description: 'Check your inbox for the verification link',
              action: {
                label: 'Resend Email',
                onClick: async () => {
                  try {
                    const response = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: formData.email }),
                    });
                    if (response.ok) {
                      toast.success('Verification email sent!');
                    } else {
                      toast.error('Failed to resend email');
                    }
                  } catch (err) {
                    toast.error('Failed to resend email');
                  }
                },
              },
            });
          } else {
            toast.error('Invalid credentials');
          }
          setLoading(false);
          return;
        }
      } else {
        if (!formData.name || !formData.age || !formData.bio) {
          toast.error('Please fill in all fields');
          setLoading(false);
          return;
        }
        if (formData.interests.length === 0) {
          toast.error('Please select at least one interest');
          setLoading(false);
          return;
        }
        if (!formData.gender) {
          toast.error('Please select your gender');
          setLoading(false);
          return;
        }

        // Get user location
        let location;
        try {
          const coords = await getCurrentLocation();
          location = {
            type: 'Point',
            coordinates: [coords.longitude, coords.latitude],
          };
          toast.success('Location captured!');
        } catch (error) {
          console.log('Location not available:', error);
          // Continue without location
        }

        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender as 'male' | 'female' | 'other',
          genderPreference: formData.genderPreference as 'male' | 'female' | 'both',
          bio: formData.bio,
          profilePhoto: formData.profilePhoto,
          interests: formData.interests,
          location,
        });
        toast.success('Account created successfully!', {
          description: 'Please check your email to verify your account',
        });
        setIsLogin(true); // Switch to login form
      }
    } catch (error: any) {
      toast.error(isLogin ? 'Invalid credentials' : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Link href="/" className="cursor-pointer transition-smooth hover:scale-105">
              <Image src="/logo.svg" alt="nXtDate" width={80} height={80} className="h-20" priority />
            </Link>
          </div>
          <p className="text-muted-foreground mt-2">Find your perfect match</p>
        </div>

        <Card className="shadow-elevated animate-slide-up">
          <CardHeader>
            <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin
                ? 'Enter your credentials to continue'
                : 'Fill in your details to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Your age"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required={!isLogin}
                      min="18"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      required={!isLogin}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genderPreference">Interested in</Label>
                    <select
                      id="genderPreference"
                      value={formData.genderPreference}
                      onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                      required={!isLogin}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="male">Men</option>
                      <option value="female">Women</option>
                      <option value="both">Everyone</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      required={!isLogin}
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Profile Photo</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Image
                          src={formData.profilePhoto}
                          alt="Profile"
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full object-cover border-2 border-border"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-3">Option 1: Upload from computer</p>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="photo-upload"
                              disabled={uploading}
                            />
                            <label htmlFor="photo-upload" className="flex-1">
                              <Button 
                                type="button" 
                                variant="default"
                                className="w-full"
                                disabled={uploading}
                                onClick={(e) => {
                                  e.preventDefault();
                                  document.getElementById('photo-upload')?.click();
                                }}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? 'Uploading...' : 'Choose File'}
                              </Button>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Option 2: Enter image URL</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/photo.jpg"
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handlePhotoUrlChange}
                            disabled={!photoUrl.trim()}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Interests (Select at least 1)</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                      {INTEREST_OPTIONS.map((interest) => (
                        <Badge
                          key={interest}
                          variant={formData.interests.includes(interest) ? "default" : "outline"}
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                          {formData.interests.includes(interest) && (
                            <X className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {formData.interests.length} interest{formData.interests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
