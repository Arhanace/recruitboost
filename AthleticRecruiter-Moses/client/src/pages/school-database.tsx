import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Coach } from "@shared/schema";

// Define an interface for the paginated response
interface PaginatedCoachResponse {
  coaches: Coach[];
  total: number;
}
import { useAuth } from "@/hooks/use-auth-provider";
import { stateNameMapping } from "@/lib/state-utils";
import { SchoolWithLogo, SchoolLogo } from "@/components/ui/school-logo";
import {
  Search,
  Filter,
  Bookmark,
  Building,
  Database,
  MapPin,
  Globe,
  UserCheck,
  Award,
  LibraryBig,
  Mail,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  BookmarkCheck,
  Check,
  Layout,
  LayoutGrid,
  List,
  Info,
  ChevronLeft,
  ChevronUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

// Helper function to group coaches by school
function groupCoachesBySchool(coaches: Coach[]) {
  const schoolMap = new Map<string, Coach[]>();
  
  coaches.forEach(coach => {
    if (!coach.school) return;
    
    if (!schoolMap.has(coach.school)) {
      schoolMap.set(coach.school, []);
    }
    
    schoolMap.get(coach.school)?.push(coach);
  });
  
  return Array.from(schoolMap.entries()).map(([school, coaches]) => {
    // Get state and region from first coach (they should all be the same for a school)
    const firstCoach = coaches[0];
    return {
      school,
      state: firstCoach.state || 'Unknown',
      region: firstCoach.region || 'Unknown',
      division: firstCoach.division || 'Unknown',
      conference: firstCoach.conference || 'Unknown',
      coaches
    };
  });
}

export default function SchoolDatabasePage() {
  // Get user profile to access their sport
  const { user } = useAuth();
  const userSport = user?.profile?.sport || "";
  
  // View state (list or school grouping)
  const [viewMode, setViewMode] = useState<'list' | 'school'>('school');
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  
  // Filter states - sport is always set to user's sport and can't be changed
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  
  // Fetch coaches with filters
  const { data: coachesResponse = { coaches: [], total: 0 }, isLoading } = useQuery<PaginatedCoachResponse>({
    queryKey: ["/api/coaches", userSport, selectedDivision, selectedConference, selectedRegion, selectedState, currentPage, itemsPerPage],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      if (userSport) params.append('sport', userSport);
      if (selectedDivision && selectedDivision !== 'all') params.append('division', selectedDivision);
      if (selectedConference && selectedConference !== 'all') params.append('conference', selectedConference);
      if (selectedRegion && selectedRegion !== 'all') params.append('region', selectedRegion);
      if (selectedState && selectedState !== 'all') params.append('state', selectedState);
      
      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      console.log(`Fetching coaches with sport: ${userSport}, page: ${currentPage}, limit: ${itemsPerPage}`);
      
      const url = `/api/coaches?${params.toString()}`;
      console.log("Fetching URL:", url);
       const response = await apiRequest("GET", url);
      if (!response.ok) throw new Error('Failed to fetch coaches');
      const data = await response.json();
      console.log(`Received ${data.coaches.length} coaches from server (total: ${data.total})`);
      return data;
    }
  });

  console.log("Coaches response:", coachesResponse)
  
  // Extract coaches array from the response
  const coaches = coachesResponse.coaches;
  
  // Fetch divisions, conferences for filters
  const { data: divisions = [] } = useQuery<string[]>({
    queryKey: ["/api/coaches/divisions"],
  });
  
  const { data: conferences = [] } = useQuery<string[]>({
    queryKey: ["/api/coaches/conferences"],
  });
  
  // Fetch regions from the backend
  const { data: regions = [] } = useQuery<string[]>({
    queryKey: ["/api/coaches/regions"],
  });
  
  // Fetch states from the backend
  const { data: states = [] } = useQuery<string[]>({
    queryKey: ["/api/coaches/states"],
  });
  
  // Filter coaches - always filter by user's sport (users can't change this)
  const filteredCoaches = coaches.filter(coach => {
    // Search filter
    const searchFields = [
      coach.firstName,
      coach.lastName,
      coach.school,
      coach.position,
      coach.state,
      coach.region,
      coach.email,
      coach.conference
    ].filter(Boolean).join(" ").toLowerCase();
    
    const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());
    
    // Handle different gender-specific sports
    let matchesSport = !userSport; // If no user sport, all sports match
    
    if (userSport) {
      if (userSport.toLowerCase() === "basketball") {
        // Generic "Basketball" should match both men's and women's basketball
        matchesSport = coach.sport?.toLowerCase().includes("basketball") || false;
      } else if (userSport.toLowerCase() === "mens basketball") {
        // Mens Basketball should only match men's coaches
        matchesSport = coach.sport?.toLowerCase() === "mens basketball";
      } else if (userSport.toLowerCase() === "womens basketball") {
        // Womens Basketball should only match women's coaches
        matchesSport = coach.sport?.toLowerCase() === "womens basketball";  
      } else {
        // For other sports, use exact match for gender specificity
        matchesSport = coach.sport === userSport;
      }
    }
    
    // Debug logging
    console.log(`Coach: ${coach.firstName} ${coach.lastName}, Sport: ${coach.sport}, UserSport: ${userSport}, Matches: ${matchesSport}`);
    
    const matchesDivision = !selectedDivision || selectedDivision === 'all' || coach.division === selectedDivision;
    const matchesConference = !selectedConference || selectedConference === 'all' || coach.conference === selectedConference;
    const matchesRegion = !selectedRegion || selectedRegion === 'all' || coach.region === selectedRegion;
    const matchesState = !selectedState || selectedState === 'all' || coach.state === selectedState;
    
    return matchesSearch && matchesSport && matchesDivision && 
           matchesConference && matchesRegion && matchesState;
  });
  
  // Group coaches by school
  const schoolGroups = groupCoachesBySchool(filteredCoaches);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDivision, selectedConference, selectedRegion, selectedState]);
  
  // Since pagination is now handled server-side, we don't need to paginate manually
  // for individual coaches. For schools, we'll still need to group and paginate locally.
  const paginateSchools = (schools: ReturnType<typeof groupCoachesBySchool>) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return schools.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Paginated data - filteredCoaches is already paginated from the server
  const paginatedCoaches = filteredCoaches;
  const paginatedSchools = paginateSchools(schoolGroups);
  
  // Total pages
  const totalCoachPages = Math.ceil(coachesResponse.total / itemsPerPage);
  const totalSchoolPages = Math.ceil(schoolGroups.length / itemsPerPage);
  
  // Debug logs
  console.log("Total coaches:", coachesResponse.total);
  console.log("totalCoachPages:", totalCoachPages);
  console.log("Current page:", currentPage);
  
  // Track active filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Check if any filters are applied and track which ones
  useEffect(() => {
    const filters = [];
    
    if (selectedDivision && selectedDivision !== "all") {
      filters.push(`Division: ${selectedDivision}`);
    }
    
    if (selectedConference && selectedConference !== "all") {
      filters.push(`Conference: ${selectedConference}`);
    }
    
    if (selectedRegion && selectedRegion !== "all") {
      filters.push(`Region: ${selectedRegion}`);
    }
    
    if (selectedState && selectedState !== "all") {
      filters.push(`State: ${selectedState}`);
    }
    
    setActiveFilters(filters);
    setIsFilterApplied(filters.length > 0);
  }, [selectedDivision, selectedConference, selectedRegion, selectedState]);
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedDivision("all");
    setSelectedConference("all");
    setSelectedRegion("all");
    setSelectedState("all");
    setSearchTerm("");
  };
  
  // Query to get saved coaches for the current user
  const { data: savedCoaches = [] } = useQuery<Coach[]>({
    queryKey: ["/api/saved-coaches"],
  });
  
  // Set of saved coach IDs for quick lookup
  const savedCoachIds = useMemo(() => {
    return new Set(savedCoaches.map(coach => coach.id));
  }, [savedCoaches]);
  
  // Mutation to toggle favorite status for a coach
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: number, favorite: boolean }) => {
      const response = await apiRequest("PATCH", `/api/coaches/${id}/favorite`, { favorite });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/saved-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update saved status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Favorite a coach
  const favoriteCoach = (coachId: number, isSaved: boolean = false) => {
    const willSave = !isSaved;
    
    toggleFavoriteMutation.mutate(
      { id: coachId, favorite: willSave },
      {
        onSuccess: () => {
          toast({
            title: willSave ? "Coach saved" : "Coach removed",
            description: willSave 
              ? "Coach has been added to your saved coaches" 
              : "Coach has been removed from your saved coaches",
          });
        }
      }
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">School Database</h1>
          <p className="text-gray-600">Find and connect with college coaches</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode('list')} 
            className={viewMode === 'list' ? 'bg-gray-100' : ''}>
            <List className="h-4 w-4 mr-1" />
            List View
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode('school')} 
            className={viewMode === 'school' ? 'bg-gray-100' : ''}>
            <Building className="h-4 w-4 mr-1" />
            School View
          </Button>
        </div>
      </div>
      
      {/* Sport Filter Indicator */}
      {userSport && (
        <div className="mb-4 flex items-center bg-blue-50 border border-blue-200 rounded-md p-2 text-sm text-blue-700">
          <Info className="h-4 w-4 mr-2 text-blue-500" />
          <span>
            <strong>Showing {userSport} coaches only.</strong> The database is filtered to show coaches in your sport.
          </span>
        </div>
      )}
      
      {/* Search & Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by coach name, school, state, region..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Reset to page 1 when searching
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {isFilterApplied && (
                  <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                    {activeFilters.length > 1 ? `${activeFilters.length} Active` : activeFilters[0]}
                  </Badge>
                )}
              </Button>
              
              {isFilterApplied && (
                <Button variant="ghost" size="icon" onClick={resetFilters}
                  className="text-gray-500 hover:text-red-500">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Display active filters when there's more than one */}
      {activeFilters.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs py-1">
              {filter}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-2/3 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-4 w-1/3 bg-gray-200 rounded-md"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded-md"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="text-center py-16">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters to find more coaches</p>
          <Button variant="outline" onClick={resetFilters}>
            Reset All Filters
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {paginatedCoaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 md:p-5 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {coach.firstName} {coach.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                        {coach.position && <span>{coach.position}</span>}
                        {coach.position && coach.sport && <span className="text-gray-300">•</span>}
                        {coach.sport && <span>{coach.sport}</span>}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`rounded-full h-8 w-8 ${savedCoachIds.has(coach.id) ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
                      onClick={() => favoriteCoach(coach.id, savedCoachIds.has(coach.id))}
                    >
                      {savedCoachIds.has(coach.id) ? (
                        <BookmarkCheck className="h-4 w-4 fill-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{coach.school}</span>
                    </div>
                    
                    {coach.division && (
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">{coach.division}</span>
                      </div>
                    )}
                    
                    {coach.conference && (
                      <div className="flex items-center">
                        <LibraryBig className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">{coach.conference}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">
                        {coach.state ? (stateNameMapping[coach.state] || coach.state) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end p-4 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100">
                  <div className="flex gap-2">
                    <Link href={`/emails?coachId=${coach.id}`} onClick={() => console.log("Email button clicked for coach:", coach.id, `${coach.firstName} ${coach.lastName}`)}>
                      <Button 
                        size="sm" 
                        className="h-9 rounded-md shadow-sm"
                      >
                        <Mail className="h-4 w-4 mr-1.5" />
                        Email
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-9 rounded-md shadow-sm border-gray-200">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => favoriteCoach(coach.id, savedCoachIds.has(coach.id))} 
                          className="cursor-pointer"
                        >
                          {savedCoachIds.has(coach.id) ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 mr-2 fill-primary text-primary" />
                              Remove Coach
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-4 w-4 mr-2" />
                              Save Coach
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Mark as Contacted
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                          <Globe className="h-4 w-4 mr-2" />
                          View School
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Pagination Controls for List View */}
          {totalCoachPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="font-semibold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, coachesResponse.total)}</span> of <span className="font-semibold text-gray-700">{coachesResponse.total}</span> coaches
              </div>
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 shadow-sm border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalCoachPages) }, (_, i) => {
                  // Display pages around the current page
                  let pageToShow = i + 1;
                  if (totalCoachPages > 5) {
                    if (currentPage > 3) {
                      pageToShow = currentPage - 3 + i;
                    }
                    if (currentPage > totalCoachPages - 2) {
                      pageToShow = totalCoachPages - 4 + i;
                    }
                  }
                  if (pageToShow <= totalCoachPages) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageToShow)}
                        className={`h-8 w-8 p-0 ${currentPage === pageToShow ? "shadow-sm" : "shadow-sm border-gray-200"}`}
                      >
                        {pageToShow}
                      </Button>
                    );
                  }
                  return null;
                })}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalCoachPages))}
                  disabled={currentPage === totalCoachPages}
                  className="h-8 w-8 p-0 shadow-sm border-gray-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedSchools.map((group) => (
            <Accordion type="single" collapsible key={group.school}>
              <AccordionItem value={group.school} className="border-0">
                <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-3 bg-gradient-to-b from-white to-gray-50/80">
                    <AccordionTrigger className="hover:no-underline flex items-center justify-between py-0 w-full">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <SchoolLogo school={group.school} size="lg" className="mr-3" />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 text-left">
                              {group.school}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-0.5 text-gray-400" />
                                <span className="font-medium">
                                  {group.state ? (stateNameMapping[group.state] || group.state) : 'Unknown'}
                                </span>
                              </div>
                              
                              {group.conference && (
                                <div className="flex items-center">
                                  <LibraryBig className="h-3.5 w-3.5 mr-0.5 text-gray-400 ml-2" />
                                  <span>{group.conference}</span>
                                </div>
                              )}
                              
                              {group.division && (
                                <div className="flex items-center">
                                  <Award className="h-3.5 w-3.5 mr-0.5 text-gray-400 ml-2" />
                                  <span className="text-sm font-medium text-gray-600">
                                    {group.division}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm font-medium ml-4">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                          {group.coaches.length} coaches
                        </Badge>
                        {/* AccordionTrigger already includes ChevronDown */}
                      </div>
                    </AccordionTrigger>
                  </CardHeader>
                  
                  <AccordionContent>
                    <CardContent className="py-4 px-4 bg-gray-50/50">
                      <div className="grid gap-3">
                        {group.coaches.map((coach) => (
                          <div 
                            key={coach.id} 
                            className="p-3 flex items-center justify-between bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center flex-1">
                              <div className="flex-shrink-0 mr-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-primary font-medium">
                                  {coach.firstName?.[0]}{coach.lastName?.[0]}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {coach.firstName} {coach.lastName}
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-0.5">
                                  {coach.position && (
                                    <span className="mr-2 font-medium">{coach.position}</span>
                                  )}
                                  {coach.position && coach.sport && (
                                    <span className="text-gray-300 mr-2">•</span>
                                  )}
                                  {coach.sport && (
                                    <span>{coach.sport}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Link href={`/emails?coachId=${coach.id}`} onClick={() => console.log("Email button clicked for coach:", coach.id, `${coach.firstName} ${coach.lastName}`)}>
                                <Button 
                                  size="sm" 
                                  className="h-8 rounded-md shadow-sm bg-primary/90 hover:bg-primary"
                                >
                                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                                  Email
                                </Button>
                              </Link>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className={`h-8 w-8 border rounded-md shadow-sm ${
                                  savedCoachIds.has(coach.id) 
                                    ? 'text-amber-500 border-amber-200 bg-amber-50' 
                                    : 'text-gray-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50'
                                }`}
                                onClick={() => favoriteCoach(coach.id, savedCoachIds.has(coach.id))}
                              >
                                {savedCoachIds.has(coach.id) ? (
                                  <BookmarkCheck className="h-3.5 w-3.5 fill-amber-500" />
                                ) : (
                                  <Bookmark className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          ))}
          
          {/* Pagination Controls for School View */}
          {totalSchoolPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="font-semibold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, schoolGroups.length)}</span> of <span className="font-semibold text-gray-700">{schoolGroups.length}</span> schools
              </div>
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 shadow-sm border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalSchoolPages) }, (_, i) => {
                  // Display pages around the current page
                  let pageToShow = i + 1;
                  if (totalSchoolPages > 5) {
                    if (currentPage > 3) {
                      pageToShow = currentPage - 3 + i;
                    }
                    if (currentPage > totalSchoolPages - 2) {
                      pageToShow = totalSchoolPages - 4 + i;
                    }
                  }
                  if (pageToShow <= totalSchoolPages) {
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageToShow)}
                        className={`h-8 w-8 p-0 ${currentPage === pageToShow ? "shadow-sm" : "shadow-sm border-gray-200"}`}
                      >
                        {pageToShow}
                      </Button>
                    );
                  }
                  return null;
                })}
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalSchoolPages))}
                  disabled={currentPage === totalSchoolPages}
                  className="h-8 w-8 p-0 shadow-sm border-gray-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Filter Dialog */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Coaches</DialogTitle>
            <DialogDescription>
              Refine your search by selecting specific criteria
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Sport indicator - information only */}
            {userSport && (
              <div className="rounded-lg border p-3 shadow-sm mb-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Sport-specific results</div>
                    <div className="text-xs text-muted-foreground">
                      Results are filtered to show only {userSport} coaches. This cannot be changed.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="division">Division</Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map((division) => (
                    <SelectItem key={division} value={division}>{division}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="conference">Conference</Label>
              <Select value={selectedConference} onValueChange={setSelectedConference}>
                <SelectTrigger>
                  <SelectValue placeholder="All Conferences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conferences</SelectItem>
                  {conferences.map((conference) => (
                    <SelectItem key={conference} value={conference}>{conference}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="region">Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={() => {
              // Apply filters and close the dialog
              setFiltersOpen(false);
              // The filters are already applied via the useQuery hook
              toast({
                title: "Filters applied",
                description: "Your filters have been applied to the results"
              });
            }}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}