import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center gap-2">
            <img
              src="/assets/generated/logo-mark.dim_128x128.png"
              alt="AcadMind"
              className="h-7 w-7 rounded-md object-cover"
            />
            <span className="font-display font-bold text-foreground">AcadMind</span>
          </div>
          {/* Theme toggle — visible on mobile header */}
          <ThemeToggle />
        </header>

        {/* Desktop top-right theme toggle */}
        <div className="hidden lg:flex absolute top-3 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-3">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} AcadMind &mdash; Built with{' '}
            <span className="text-destructive">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'acadmind')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
