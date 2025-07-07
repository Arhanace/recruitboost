import { School } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchoolLogoProps {
  school: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SchoolLogo({ school, size = "md", className }: SchoolLogoProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: "h-6 w-6",
      icon: "h-3 w-3"
    },
    md: {
      container: "h-8 w-8",
      icon: "h-4 w-4"
    },
    lg: {
      container: "h-10 w-10",
      icon: "h-5 w-5"
    }
  };

  // Generate a consistent color based on school name (simple hash function)
  const schoolNameHash = school.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = schoolNameHash % 360; // 0-359 degrees

  return (
    <div 
      className={cn(
        "flex-shrink-0 rounded-full flex items-center justify-center mr-2",
        sizeConfig[size].container,
        className
      )}
      style={{ backgroundColor: `hsla(${hue}, 85%, 90%, 0.6)`, border: `1px solid hsla(${hue}, 85%, 50%, 0.5)` }}
    >
      <School 
        className={`${sizeConfig[size].icon}`} 
        style={{ color: `hsla(${hue}, 85%, 40%, 1)` }}
      />
    </div>
  );
}

export function SchoolWithLogo({ school, size = "md", className }: SchoolLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <SchoolLogo school={school} size={size} />
      <span>{school}</span>
    </div>
  );
}