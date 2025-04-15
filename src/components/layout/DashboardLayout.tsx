
import { useState, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Clipboard, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  Settings, 
  User, 
  BarChart, 
  MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of ScriptSense"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out",
        variant: "destructive"
      });
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Examinations', href: '/examinations', icon: FileText },
    { name: 'Grading', href: '/grading', icon: Clipboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
  ];

  const adminNavItems = [
    { name: 'Teachers', href: '/teachers', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:transform-none lg:relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-scriptsense-primary text-white p-2 rounded">
                <FileText size={20} />
              </div>
              <span className="text-xl font-bold text-scriptsense-primary">scriptSense</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.href 
                      ? "bg-scriptsense-primary text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
            
            {isAdmin && (
              <>
                <Separator className="my-4" />
                <div className="pt-2 space-y-1">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Admin
                  </p>
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                        location.pathname === item.href 
                          ? "bg-scriptsense-primary text-white" 
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-gray-200 rounded-full p-2">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">InsightEd</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

// Add a default export that references the named export
export default DashboardLayout;
