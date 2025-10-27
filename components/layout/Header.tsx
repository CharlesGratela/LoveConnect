'use client';

import { Heart, User, MessageCircle, LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { setTheme, theme } = useTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/discover" className="flex items-center gap-2 transition-smooth hover:scale-105">
          <img src="/logo.svg" alt="nXtDate" className="h-12" />
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/discover">
            <Button
              variant={isActive('/discover') ? 'default' : 'ghost'}
              size="icon"
              className="transition-smooth"
            >
              <Heart className={isActive('/discover') ? 'fill-current' : ''} />
            </Button>
          </Link>

          <Link href="/matches">
            <Button
              variant={isActive('/matches') ? 'default' : 'ghost'}
              size="icon"
              className="transition-smooth"
            >
              <MessageCircle className={isActive('/matches') ? 'fill-current' : ''} />
            </Button>
          </Link>

          <Link href="/profile">
            <Button
              variant={isActive('/profile') ? 'default' : 'ghost'}
              size="icon"
              className="transition-smooth"
            >
              <User className={isActive('/profile') ? 'fill-current' : ''} />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="transition-smooth">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <User className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
