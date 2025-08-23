import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary shadow-elegant">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Hierarchy Management</h1>
              <p className="text-xs text-muted-foreground">System Dashboard</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}