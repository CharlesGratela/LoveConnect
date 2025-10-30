'use client';

import { Heart, User, MessageCircle, LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
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
          <div className="relative h-8 w-8 md:hidden">
            <Image src="/favicon.svg" alt="nXtDate" fill className="object-contain" priority />
          </div>
          <div className="relative h-12 w-auto hidden md:block" style={{ width: '128px' }}>
            <Image src="/logo.svg" alt="nXtDate" fill className="object-contain" priority />
          </div>
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/discover">
            <Button
              variant={isActive('/discover') ? 'default' : 'ghost'}
              className="transition-smooth"
            >
              <Heart className={`h-5 w-5 ${isActive('/discover') ? 'fill-current' : ''}`} />
              <span className="ml-2 hidden md:inline">Discover</span>
            </Button>
          </Link>

          <Link href="/matches">
            <Button
              variant={isActive('/matches') ? 'default' : 'ghost'}
              className="transition-smooth"
            >
              <MessageCircle className={`h-5 w-5 ${isActive('/matches') ? 'fill-current' : ''}`} />
              <span className="ml-2 hidden md:inline">Matches</span>
            </Button>
          </Link>

          <Link href="/profile">
            <Button
              variant={isActive('/profile') ? 'default' : 'ghost'}
              className="transition-smooth"
            >
              <User className={`h-5 w-5 ${isActive('/profile') ? 'fill-current' : ''}`} />
              <span className="ml-2 hidden md:inline">Profile</span>
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
            onClick={logout}
            className="transition-smooth hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-2 hidden md:inline">Logout</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
