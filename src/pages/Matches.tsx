import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Match {
  id: string;
  user: {
    id: string;
    name: string;
    profilePhoto: string;
    age: number;
  };
  matchedAt: string;
}

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedMatches = JSON.parse(localStorage.getItem('matches') || '[]');
    setMatches(storedMatches);
  }, []);

  const handleUnmatch = (matchId: string, userName: string) => {
    const updatedMatches = matches.filter(m => m.id !== matchId);
    setMatches(updatedMatches);
    localStorage.setItem('matches', JSON.stringify(updatedMatches));
    toast.success(`Unmatched with ${userName}`);
  };

  const handleChat = (matchId: string) => {
    navigate(`/chat/${matchId}`);
  };

  if (matches.length === 0) {
    return (
      <>
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">
              Start swiping to find your perfect match!
            </p>
            <Button onClick={() => navigate('/discover')}>
              Start Discovering
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Your Matches</h1>
          <p className="text-muted-foreground">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, index) => (
            <Card
              key={match.id}
              className="overflow-hidden shadow-card hover:shadow-elevated transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative aspect-square">
                <img
                  src={match.user.profilePhoto}
                  alt={match.user.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-2xl font-bold">
                    {match.user.name}, {match.user.age}
                  </h3>
                  <p className="text-sm text-white/80">
                    Matched {new Date(match.matchedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleChat(match.user.id)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUnmatch(match.id, match.user.name)}
                    className="hover:text-destructive hover:border-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default Matches;
