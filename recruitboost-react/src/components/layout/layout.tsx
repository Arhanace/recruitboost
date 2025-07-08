import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Search, 
  Mail, 
  CheckSquare, 
  User, 
  Settings, 
  Trophy,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Find Coaches", href: "/coaches", icon: Search },
  { name: "Email Center", href: "/emails", icon: Mail },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <Sidebar currentPath={location} onNavigate={setLocation} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-lg">
        <Sidebar currentPath={location} onNavigate={setLocation} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation for mobile */}
        <div className="sticky top-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-800">RecruitBoost</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ 
  currentPath, 
  onNavigate, 
  onClose 
}: { 
  currentPath: string; 
  onNavigate: (path: string) => void;
  onClose?: () => void;
}) {
  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-800">RecruitBoost</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* User info */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Avatar className="ring-2 ring-blue-100">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {mockUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{mockUser.name}</p>
            <p className="text-xs text-gray-500 truncate">{mockUser.sport} • Class of {mockUser.graduationYear}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <button
              key={item.name}
              onClick={() => {
                onNavigate(item.href);
                onClose?.();
              }}
              className={cn(
                "w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors",
                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
              )} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
        <p className="text-xs text-gray-500 text-center mt-3">
          © 2025 RecruitBoost
        </p>
      </div>
    </div>
  );
}