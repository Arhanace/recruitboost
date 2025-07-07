import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
};

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-100 p-5 transition-all hover:shadow-lg">
      <div className="flex items-center">
        <div className={cn("p-3.5 rounded-xl", iconBgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
