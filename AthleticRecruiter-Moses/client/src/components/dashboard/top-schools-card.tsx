import { Coach } from "@shared/schema";
import { cn } from "@/lib/utils";

type SchoolStatus = "Contacted" | "Follow-up" | "Interested" | "Not Started" | "Not Available";

type SchoolStatusBadgeProps = {
  status: SchoolStatus;
};

function SchoolStatusBadge({ status }: SchoolStatusBadgeProps) {
  const statusStyles = {
    "Contacted": "bg-emerald-100 text-secondary",
    "Follow-up": "bg-amber-100 text-amber-800",
    "Interested": "bg-indigo-100 text-primary",
    "Not Started": "bg-gray-100 text-gray-800",
    "Not Available": "bg-red-100 text-red-800"
  };
  
  return (
    <span className={cn(
      "py-1 px-2 rounded text-xs",
      statusStyles[status] || statusStyles["Not Started"]
    )}>
      {status}
    </span>
  );
}

type SchoolInitialsProps = {
  school: string;
};

function SchoolInitials({ school }: SchoolInitialsProps) {
  const getInitials = (name: string) => {
    const words = name.split(' ');
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    } else {
      return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }
  };
  
  return (
    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-800">
      {getInitials(school)}
    </div>
  );
}

type SchoolItemProps = {
  coach: Coach;
};

function SchoolItem({ coach }: SchoolItemProps) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center">
        <SchoolInitials school={coach.school} />
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{coach.school}</p>
          <p className="text-xs text-gray-500">{coach.division || 'Unknown'} • {coach.sport}</p>
        </div>
      </div>
      <div className="flex items-center">
        <SchoolStatusBadge status={coach.status as SchoolStatus} />
      </div>
    </li>
  );
}

type TopSchoolsCardProps = {
  coaches: Coach[];
  isLoading: boolean;
};

export default function TopSchoolsCard({ coaches, isLoading }: TopSchoolsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Top Target Schools</h2>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {coaches.map((coach) => (
                <SchoolItem key={coach.id} coach={coach} />
              ))}
            </ul>
            <div className="mt-4 text-center">
              <button className="text-sm text-primary font-medium hover:text-indigo-700">
                View All Schools
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
