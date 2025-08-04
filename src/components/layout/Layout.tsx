import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { LogOut, Home, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'transactions' | 'customers' | 'reports';
  onViewChange: (view: 'dashboard' | 'transactions' | 'customers' | 'reports') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { signOut, user } = useAuth();

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'transactions', label: 'Transactions', icon: ShoppingCart },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">Mandi Finance</h1>
            <nav className="hidden md:flex space-x-1">
              {navItems.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={currentView === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange(key)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-card">
        <div className="flex overflow-x-auto px-4 py-2 space-x-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={currentView === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(key)}
              className="flex items-center space-x-2 whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};