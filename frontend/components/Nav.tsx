'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wallet, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, initTheme, Theme } from '@/lib/theme';

export function Nav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    initTheme();
    const stored = getStoredTheme();
    if (stored) setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span className="text-xl font-bold">brainyprep.ai Blockchain</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant={pathname === '/dashboard' ? 'default' : 'ghost'}>
              Dashboard
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant={pathname === '/transactions' ? 'default' : 'ghost'}>
              Transactions
            </Button>
          </Link>
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </nav>
  );
}

