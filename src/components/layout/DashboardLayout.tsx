import { useState, ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AppSidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center gap-4">
            {title && (
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="w-64 pl-9 bg-secondary/50 border-0 focus-visible:ring-1"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
