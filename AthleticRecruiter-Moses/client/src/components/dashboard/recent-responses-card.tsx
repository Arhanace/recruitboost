import { Email, Coach } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type ResponseStatusBadgeProps = {
  status: string;
};

function ResponseStatusBadge({ status }: ResponseStatusBadgeProps) {
  const statusMap: Record<string, { className: string, label: string }> = {
    'replied': { className: 'bg-green-100 text-green-800', label: 'Interested' },
    'not_interested': { className: 'bg-gray-100 text-gray-800', label: 'Not Available' },
    'need_info': { className: 'bg-yellow-100 text-yellow-800', label: 'Need Info' },
    'interested': { className: 'bg-green-100 text-green-800', label: 'Interested' },
  };
  
  const statusConfig = statusMap[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  
  return (
    <span className={cn(
      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
      statusConfig.className
    )}>
      {statusConfig.label}
    </span>
  );
}

type EmailResponseProps = {
  email: Email;
  coach: Coach;
};

function EmailResponse({ email, coach }: EmailResponseProps) {
  return (
    <tr>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-900">
            {coach ? `${coach.firstName || ''} ${coach.lastName || ''}` : "Unknown Coach"}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">{coach?.school || 'Unknown School'}</div>
        <div className="text-xs text-gray-500">{coach?.sport || 'Unknown Sport'}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {email?.sentAt ? format(new Date(email.sentAt), "MMM d, yyyy") : 'Unknown Date'}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <ResponseStatusBadge status={email?.status || 'unknown'} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-primary hover:text-indigo-700">View</button>
      </td>
    </tr>
  );
}

type ResponseData = {
  email: Email;
  coach: Coach;
};

type RecentResponsesCardProps = {
  responses: ResponseData[];
  isLoading: boolean;
};

export default function RecentResponsesCard({ responses, isLoading }: RecentResponsesCardProps) {
  return (
    <div className="bg-white rounded-lg shadow lg:col-span-2">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Recent Responses</h2>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((response) => (
                  <EmailResponse 
                    key={response.email.id} 
                    email={response.email} 
                    coach={response.coach} 
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link href="/emails?mailbox=responses">
            <button className="text-sm text-primary font-medium hover:text-indigo-700">
              View All Responses
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
