import SchoolRecommendations from "@/components/dashboard/school-recommendations";

export default function RecommendedSchoolsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recommended Schools</h1>
        <p className="text-gray-600">Discover schools that match your academic and athletic profile</p>
      </div>
      
      <SchoolRecommendations />
    </div>
  );
}