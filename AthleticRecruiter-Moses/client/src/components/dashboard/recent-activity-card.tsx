import { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { 
  RectangleEllipsis, 
  ReplyIcon, 
  UserPlusIcon,
  ClipboardCheckIcon,
  Mail
} from "lucide-react";

type ActivityIconProps = {
  type: string;
};

function ActivityIcon({ type }: ActivityIconProps) {
  switch (type) {
    case "email_sent":
      return (
        <span className="bg-indigo-100 text-primary p-2 rounded-full">
          <RectangleEllipsis className="h-4 w-4" />
        </span>
      );
    case "email_received":
      return (
        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
          <ReplyIcon className="h-4 w-4" />
        </span>
      );
    case "database_update":
    case "coach_added":
      return (
        <span className="bg-amber-100 text-amber-600 p-2 rounded-full">
          <UserPlusIcon className="h-4 w-4" />
        </span>
      );
    case "task_created":
      return (
        <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <ClipboardCheckIcon className="h-4 w-4" />
        </span>
      );
    case "task_completed":
      return (
        <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <ClipboardCheckIcon className="h-4 w-4" />
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-600 p-2 rounded-full">
          <Mail className="h-4 w-4" />
        </span>
      );
  }
}

type ActivityItemProps = {
  activity: Activity;
};

function ActivityItem({ activity }: ActivityItemProps) {
  const formattedTime = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
  
  return (
    <li className="py-3 flex items-start">
      <ActivityIcon type={activity.type} />
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
        {activity.coachId && activity.metaData && (
          <p className="text-xs text-gray-500">
            {activity.metaData.school && activity.metaData.sport ? 
              `${activity.metaData.school}, ${activity.metaData.sport}` : 
              (activity.metaData.school || activity.metaData.sport || '')}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">{formattedTime}</p>
      </div>
    </li>
  );
}

type RecentActivityCardProps = {
  activities: Activity[];
  isLoading: boolean;
};

export default function RecentActivityCard({ activities, isLoading }: RecentActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="flex items-start">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
            <div className="mt-4 text-center">
              <Link href="/activities" className="text-sm text-primary font-medium hover:text-indigo-700">
                View All Activity
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
