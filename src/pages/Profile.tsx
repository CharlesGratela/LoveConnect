import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Pencil, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    bio: user?.bio || '',
  });

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      age: parseInt(formData.age),
      bio: formData.bio,
    });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <div className="container max-w-4xl py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Manage your dating profile</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Photo Card */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-48 h-48 rounded-full object-cover shadow-elevated"
              />
              <Button variant="outline">Change Photo</Button>
            </CardContent>
          </Card>

          {/* Profile Info Card */}
          <Card className="shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your personal details</CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-lg">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                {isEditing ? (
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    min="18"
                    max="100"
                  />
                ) : (
                  <p className="text-lg">{user.age}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground">{user.bio}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-muted-foreground">{user.email}</p>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name,
                        age: user.age.toString(),
                        bio: user.bio,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;
