import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  MapPin, 
  Users, 
  Award, 
  BookOpen, 
  Star, 
  Plus, 
  Info
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SchoolMatchScoreProps = {
  score: number;
};

function SchoolMatchScore({ score }: SchoolMatchScoreProps) {
  // Determine the color based on match score
  const getScoreColor = () => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 75) return "bg-green-50 text-green-700";
    if (score >= 60) return "bg-yellow-50 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex items-center">
      <div className={`text-sm font-medium rounded-full px-2 py-1 ${getScoreColor()}`}>
        {score}% Match
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1 text-gray-400 hover:text-gray-500">
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">
              Match score is calculated based on your academic profile, athletic stats, and school preferences.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

type SchoolCardProps = {
  school: {
    name: string;
    location: string;
    division: string;
    size: string;
    conference: string;
    academicRating: number;
    athleticRating: number;
    matchScore: number;
    majors: string[];
    image?: string;
  };
};

function SchoolCard({ school }: SchoolCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 relative">
        {school.image ? (
          <img 
            src={school.image} 
            alt={school.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <SchoolMatchScore score={school.matchScore} />
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{school.name}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
          {school.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Badge variant="outline">{school.division}</Badge>
              <Badge variant="outline">{school.conference}</Badge>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-3.5 w-3.5 mr-1" />
              {school.size}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1.5 text-primary/70" />
              <span>Athletic: {school.athleticRating}/10</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1.5 text-primary/70" />
              <span>Academic: {school.academicRating}/10</span>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Popular Majors:</p>
            <div className="flex flex-wrap gap-1">
              {school.majors.slice(0, 3).map((major, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {major}
                </Badge>
              ))}
              {school.majors.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{school.majors.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 pt-1">
            <Button className="flex-1">Add to Targets</Button>
            <Button variant="outline" className="flex-1">View Details</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SchoolRecommendations() {
  // In a real app, these would be fetched based on user's profile and preferences
  const recommendedSchools = [
    {
      name: "University of California, Los Angeles",
      location: "Los Angeles, CA",
      division: "NCAA D1",
      conference: "Pac-12",
      size: "Large",
      academicRating: 9,
      athleticRating: 10,
      matchScore: 92,
      majors: ["Business", "Economics", "Computer Science", "Kinesiology", "Psychology"]
    },
    {
      name: "Stanford University",
      location: "Stanford, CA",
      division: "NCAA D1",
      conference: "Pac-12",
      size: "Medium",
      academicRating: 10,
      athleticRating: 9,
      matchScore: 87,
      majors: ["Engineering", "Computer Science", "Biology", "Economics", "Psychology"]
    },
    {
      name: "Duke University",
      location: "Durham, NC",
      division: "NCAA D1",
      conference: "ACC",
      size: "Medium",
      academicRating: 10,
      athleticRating: 9,
      matchScore: 83,
      majors: ["Public Policy", "Economics", "Biology", "Computer Science", "Psychology"]
    },
    {
      name: "University of Michigan",
      location: "Ann Arbor, MI",
      division: "NCAA D1",
      conference: "Big Ten",
      size: "Large",
      academicRating: 9,
      athleticRating: 9,
      matchScore: 79,
      majors: ["Business", "Economics", "Engineering", "Communications", "Psychology"]
    },
    {
      name: "Vanderbilt University",
      location: "Nashville, TN",
      division: "NCAA D1",
      conference: "SEC",
      size: "Medium",
      academicRating: 9,
      athleticRating: 8,
      matchScore: 76,
      majors: ["Economics", "Human & Organizational Development", "Engineering", "Biology"]
    },
    {
      name: "Boston College",
      location: "Chestnut Hill, MA",
      division: "NCAA D1",
      conference: "ACC",
      size: "Medium",
      academicRating: 8,
      athleticRating: 8,
      matchScore: 71,
      majors: ["Finance", "Communications", "Economics", "Psychology", "Marketing"]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recommended Schools</CardTitle>
            <CardDescription>
              Based on your profile and preferences
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            Explore More
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="best-match">
          <TabsList className="mb-4">
            <TabsTrigger value="best-match">Best Match</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="athletic">Athletic</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>
          
          <TabsContent value="best-match" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedSchools.map((school, index) => (
                <SchoolCard key={index} school={school} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="academic">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedSchools
                .sort((a, b) => b.academicRating - a.academicRating)
                .map((school, index) => (
                  <SchoolCard key={index} school={school} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="athletic">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedSchools
                .sort((a, b) => b.athleticRating - a.athleticRating)
                .map((school, index) => (
                  <SchoolCard key={index} school={school} />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="location">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedSchools
                .sort((a, b) => a.location.localeCompare(b.location))
                .map((school, index) => (
                  <SchoolCard key={index} school={school} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}