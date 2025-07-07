import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  MenuIcon, ChevronDownIcon, 
  UserIcon, SettingsIcon, LogOutIcon,
  ClockIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth-provider";

type TopNavProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export default function TopNav({ sidebarOpen, setSidebarOpen }: TopNavProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);
  
  // Close user menu when clicking outside
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (userMenuOpen) {
      setUserMenuOpen(false);
    }
  };
  
  // Close menu when location changes
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/splash";
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback if sign out fails
      window.location.href = "/splash";
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          className="md:hidden text-gray-500 hover:text-gray-700"
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        
        <div className="flex items-center space-x-4 ml-auto">
          <Link href="/activities">
            <div className="text-gray-500 hover:text-gray-700 flex items-center cursor-pointer">
              <ClockIcon className="h-5 w-5" />
              <span className="ml-1 text-sm hidden sm:inline">Activity History</span>
            </div>
          </Link>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              className="flex items-center text-sm text-gray-700 focus:outline-none" 
              onClick={toggleUserMenu}
            >
              <span className="mr-2 hidden sm:inline-block">
                {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : 'My Account'}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 divide-y divide-gray-100">
                {/* User Info Section */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : 'My Account'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.profile?.sport ? `${user.profile.sport} • ${user.profile.graduationYear || 'Athlete'}` : 'Complete your profile'}
                  </p>
                </div>
                
                {/* Menu Items */}
                <div className="py-1">
                  <Link href="/profile">
                    <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <UserIcon className="h-4 w-4 mr-3 text-gray-500" />
                      Your Profile
                    </div>
                  </Link>
                  <Link href="/settings">
                    <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <SettingsIcon className="h-4 w-4 mr-3 text-gray-500" />
                      Account Settings
                    </div>
                  </Link>
                </div>
                
                {/* Sign Out Section */}
                <div className="py-1">
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleSignOut}
                  >
                    <LogOutIcon className="h-4 w-4 mr-3 text-gray-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
