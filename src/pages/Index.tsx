import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, MessageCircle, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/discover');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-primary shadow-elevated animate-pulse-glow">
              <Heart className="h-14 w-14 text-primary-foreground fill-current" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Find Your Perfect Match
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Connect with people who share your interests and values. 
            Your love story starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 gradient-primary hover:scale-105 transition-smooth shadow-elevated"
              onClick={() => navigate('/auth')}
            >
              Get Started
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 hover:scale-105 transition-smooth"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 animate-fade-in">
            Why Choose LoveConnect?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl glass shadow-card hover:shadow-elevated transition-smooth animate-slide-up">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
                  <Heart className="h-8 w-8 text-primary-foreground fill-current" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart Matching</h3>
              <p className="text-muted-foreground">
                Our algorithm finds compatible matches based on your interests and preferences
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl glass shadow-card hover:shadow-elevated transition-smooth animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <MessageCircle className="h-8 w-8 text-secondary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Real Connections</h3>
              <p className="text-muted-foreground">
                Chat with your matches and build meaningful relationships
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl glass shadow-card hover:shadow-elevated transition-smooth animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Shield className="h-8 w-8 text-accent-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Your privacy and security are our top priorities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2025 LoveConnect. Made with ❤️ for finding love.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
