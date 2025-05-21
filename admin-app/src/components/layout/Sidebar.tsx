import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Schools',
    icon: Building2,
    href: '/schools',
  },
  {
    title: 'Admins',
    icon: Users,
    href: '/admins',
  },
  {
    title: 'Teachers',
    icon: GraduationCap,
    href: '/teachers',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                  location.pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'transparent'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
