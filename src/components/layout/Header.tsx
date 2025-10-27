import { Heart, User, MessageCircle, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/discover" className="flex items-center gap-2 transition-smooth hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
            <Heart className="h-6 w-6 text-primary-foreground fill-current" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LoveConnect
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/discover">
            <Button
              variant={isActive('/discover') ? 'default' : 'ghost'}
              size="icon"
              className="transition-smooth"
            >
              <Heart className={isActive('/discover') ? 'fill-current' : ''} />
            </Button>
          </Link>

          <Link to="/matches">
            <Button
              variant={isActive('/matches') ? 'default' : 'ghost'}
              size="icon"
              className="transition-smooth"
            >
              <MessageCircle className={isActive('/matches') ? 'fill-current' : ''} />
            </Button>
          </Link>

          <Link to="/profile">
            <Button
              variant={isActive('/profile') ? 'default' : 'ghost'}
              size="icon"
              className="transition-smooth"
            >
              <User className={isActive('/profile') ? 'fill-current' : ''} />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="transition-smooth hover:text-destructive"
          >
            <LogOut />
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
