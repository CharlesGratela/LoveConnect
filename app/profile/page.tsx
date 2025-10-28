'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import NotificationStatus from '@/components/NotificationStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, Upload, X } from 'lucide-react';
const INTEREST_OPTIONS = [
  'Travel', 'Music', 'Movies', 'Sports', 'Reading', 'Cooking',
  'Fitness', 'Art', 'Gaming', 'Photography', 'Dancing', 'Hiking',
  'Technology', 'Fashion', 'Food', 'Pets', 'Yoga', 'Coffee'
];
export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    genderPreference: '',
    bio: '',
    profilePhoto: '',
    interests: [] as string[],
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (user) {
      setFormData({
        name: user.name,
        age: user.age.toString(),
        gender: user.gender || '',
        genderPreference: user.genderPreference || 'both',
        bio: user.bio,
        profilePhoto: user.profilePhoto,
        interests: user.interests || [],
      });
    }
  }, [user, isAuthenticated, authLoading, router]);
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
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female' | 'other',
        genderPreference: formData.genderPreference as 'male' | 'female' | 'both',
        bio: formData.bio,
        profilePhoto: formData.profilePhoto,
        interests: formData.interests,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </>
    );
  }
  if (!user) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }
  return (
    <>
      <Header />
      <div className="container max-w-2xl py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        
        {/* Notification Status */}
        <div className="mb-6 animate-slide-up">
          <NotificationStatus />
        </div>
        
        <Card className="shadow-elevated animate-slide-up">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'}
                      alt={formData.name || 'Profile'}
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
                          id="photo-upload-profile"
                          disabled={uploading}
                        />
                        <label htmlFor="photo-upload-profile" className="flex-1">
                          <Button 
                            type="button" 
                            variant="default"
                            className="w-full"
                            disabled={uploading}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('photo-upload-profile')?.click();
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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
                  required
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
                  required
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
                  required
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
                  placeholder="Tell others about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                  className="resize-none"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Interests</Label>
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
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 gradient-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="flex-1"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Member since: <span className="font-medium text-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
