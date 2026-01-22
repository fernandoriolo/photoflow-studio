import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Camera,
  LayoutDashboard,
  Users,
  Kanban,
  Calendar,
  FileText,
  Images,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/database';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, roles: ['admin', 'atendente'] },
  { title: 'Pipeline', url: '/pipeline', icon: Kanban, roles: ['admin', 'atendente'] },
  { title: 'Agenda', url: '/agenda', icon: Calendar, roles: ['admin', 'atendente'] },
  { title: 'Clientes', url: '/clientes', icon: Users, roles: ['admin', 'atendente'] },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText, roles: ['admin', 'atendente'] },
  { title: 'Finanças', url: '/financas', icon: Wallet, roles: ['admin'] },
];

const deliveryNavItems: NavItem[] = [
  { title: 'Galerias', url: '/galerias', icon: Images, roles: ['admin', 'atendente', 'cliente'] },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const filterByRole = (items: NavItem[]) => {
    if (!profile) return [];
    return items.filter((item) => item.roles.includes(profile.role));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrador',
      atendente: 'Atendente',
      cliente: 'Cliente',
    };
    return labels[role];
  };

  const visibleMainItems = filterByRole(mainNavItems);
  const visibleDeliveryItems = filterByRole(deliveryNavItems);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Camera className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">PhotoFlow</span>
              <span className="text-xs text-sidebar-foreground/60">Studio</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {visibleMainItems.length > 0 && (
          <div className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                CRM
              </p>
            )}
            <ul className="space-y-1">
              {visibleMainItems.map((item) => (
                <li key={item.url}>
                  <Link
                    to={item.url}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive(item.url)
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {visibleDeliveryItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Entrega
              </p>
            )}
            <ul className="space-y-1">
              {visibleDeliveryItems.map((item) => (
                <li key={item.url}>
                  <Link
                    to={item.url}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive(item.url)
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
              {getInitials(profile?.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{profile?.name || 'Usuário'}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {profile?.role && getRoleLabel(profile.role)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  onClick={handleLogout}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        {collapsed && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
