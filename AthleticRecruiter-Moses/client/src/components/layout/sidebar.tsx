import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChartPieIcon, 
  UserIcon, 
  RectangleEllipsis, 
  FileTextIcon,
  IdCardIcon, 
  SettingsIcon,
  XIcon,
  ChevronDownIcon,
  School,
  ActivityIcon,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth-provider";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
};

const NavItem = ({ href, icon, children, active }: NavItemProps) => {
  const baseClasses = "flex items-center px-4 py-3 text-sm font-medium rounded-lg";
  const activeClasses = "text-primary bg-indigo-50";
  const inactiveClasses = "text-gray-700 hover:bg-gray-100";
  
  return (
    <Link href={href}>
      <div className={cn(baseClasses, active ? activeClasses : inactiveClasses, "mt-1")}>
        <span className="w-5 h-5 mr-3">{icon}</span>
        <span>{children}</span>
      </div>
    </Link>
  );
};

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <div 
      className={cn(
        "bg-white shadow-md w-full md:w-64 md:flex md:flex-col md:fixed md:inset-y-0 z-10 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="text-xl font-bold text-gray-800">RecruitBoost</span>
        </div>
        <button 
          className="md:hidden text-gray-500 hover:text-gray-700"
          onClick={() => setSidebarOpen(false)}
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="px-2 py-4 flex-grow">
        <div className="mb-6">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </div>
          <nav>
            <NavItem href="/dashboard" icon={<ChartPieIcon />} active={location === "/" || location === "/dashboard"}>
              Dashboard
            </NavItem>
            <NavItem href="/school-database" icon={<School />} active={location === "/school-database" || location === "/coaches" || location === "/coaches-new"}>
              School Database
            </NavItem>
            <NavItem href="/emails" icon={<RectangleEllipsis />} active={location === "/emails"}>
              Outreach
            </NavItem>
            <NavItem href="/tasks" icon={<ClipboardCheck />} active={location === "/tasks"}>
              My Tasks
            </NavItem>
            {/* Recommended Schools item removed as requested */}
            <NavItem href="/profile" icon={<IdCardIcon />} active={location === "/profile"}>
              My Profile
            </NavItem>
          </nav>
        </div>
        
        {/* Settings moved to dropdown menu */}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            <span>
              {user?.profile?.firstName 
                ? `${user.profile.firstName.charAt(0)}${user.profile.lastName ? user.profile.lastName.charAt(0) : ''}`
                : user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.profile?.firstName 
                ? `${user.profile.firstName} ${user.profile.lastName || ''}`
                : 'My Account'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.profile?.sport 
                ? `${user.profile.sport} • ${user.profile.graduationYear || 'Athlete'}`
                : 'Complete your profile'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
