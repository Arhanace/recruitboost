import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coach, insertCoachSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { 
  UserPlusIcon, 
  SearchIcon, 
  FilterIcon,
  EditIcon,
  TrashIcon,
  MailIcon,
  PlusIcon,
  Star,
  Trophy,
  SlidersHorizontal,
  School,
  ChevronLeft,
  ChevronRight,
  Edit,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  CheckCircle
} from "lucide-react";
import { SchoolWithLogo } from "@/components/ui/school-logo";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema
const coachFormSchema = insertCoachSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  school: z.string().min(1, "School is required"),
  sport: z.string().min(1, "Sport is required"),
});

type CoachFormValues = z.infer<typeof coachFormSchema>;

export default function Coaches() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  // Filters for All Coaches section
  // Use athlete's sport for filtering coaches by default
  const [sportFilter, setSportFilter] = useState<string>("");
  const [divisionFilter, setDivisionFilter] = useState<string>("");
  const [conferenceFilter, setConferenceFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Show only favorited coaches
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  
  // For viewing coach details
  const [selectedCoachForView, setSelectedCoachForView] = useState<Coach | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Email selection for multiple coaches
  const [selectedCoachIds, setSelectedCoachIds] = useState<Set<number>>(new Set());
  
  // Pagination for both sections
  const [savedCurrentPage, setSavedCurrentPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const coachesPerPage = 10;
  const savedCoachesPerPage = 5;
  
  const { toast } = useToast();
  
  // Get the user profile for default filters
  const { data: userProfile } = useQuery<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    sport?: string;
    role?: string;
  }>({
    queryKey: ['/api/user/profile'],
  });
  
  // Set initial sport filter based on user profile
  useEffect(() => {
    if (userProfile?.sport && !sportFilter) {
      setSportFilter(userProfile.sport);
    }
  }, [userProfile]);
  
  // Get saved coaches
  const { data: savedCoachesData = [] } = useQuery<Coach[]>({
    queryKey: ['/api/coaches/saved'],
  });
  
  // Get all coaches with filters
  const { 
    data: allCoachesData = [], 
    isLoading, 
    refetch 
  } = useQuery<Coach[]>({
    queryKey: ['/api/coaches', sportFilter, divisionFilter, conferenceFilter, searchQuery, favoritesOnly],
    queryFn: async () => {
      let url = '/api/coaches?';
      
      // Add filters to the URL if they are set
      if (sportFilter && sportFilter !== 'all_sports') url += `sport=${encodeURIComponent(sportFilter)}&`;
      if (divisionFilter && divisionFilter !== 'all_divisions') url += `division=${encodeURIComponent(divisionFilter)}&`;
      if (conferenceFilter && conferenceFilter !== 'all_conferences') url += `conference=${encodeURIComponent(conferenceFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (favoritesOnly) url += `favorite=true&`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch coaches');
      }
      return response.json();
    },
  });
  
  // Get list of all available divisions for filters
  const { data: divisionOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/coaches/divisions'],
  });
  
  // Get list of all available conferences for filters
  const { data: conferenceOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/coaches/conferences'],
  });

  // Format names to be properly capitalized
  const formatName = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Filter saved coaches based on search query
  const filteredSavedCoaches = savedCoachesData.filter(coach => {
    const fullName = `${coach.firstName} ${coach.lastName}`.toLowerCase();
    const school = coach.school.toLowerCase();
    
    if (!searchQuery) return true;
    
    return fullName.includes(searchQuery.toLowerCase()) || 
           school.includes(searchQuery.toLowerCase());
  });
  
  // Toggle favorite status for a coach
  const handleToggleFavorite = async (coachId: number, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'unsave' : 'save';
      const response = await apiRequest('POST', `/api/coaches/${coachId}/${action}`, {});
      
      if (response.ok) {
        // Refetch coaches data
        refetch();
        
        // Also refetch saved coaches
        queryClient.invalidateQueries({ queryKey: ['/api/coaches/saved'] });
        
        toast({
          title: currentStatus ? 'Coach removed from saved' : 'Coach saved',
          description: currentStatus 
            ? 'The coach has been removed from your saved list.'
            : 'The coach has been added to your saved list.',
        });
        
        // Update the selected coach view if it's open
        if (selectedCoachForView && selectedCoachForView.id === coachId) {
          setSelectedCoachForView({
            ...selectedCoachForView,
            favorite: !currentStatus
          });
        }
      } else {
        throw new Error('Failed to update coach favorite status');
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast({
        title: 'Error',
        description: 'There was a problem updating the coach status.',
        variant: 'destructive',
      });
    }
  };
  
  // Delete a coach (admin only)
  const deleteCoach = async (id: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/coaches/${id}`, {});
      
      if (response.ok) {
        // Refetch coaches data
        refetch();
        
        // Also refetch saved coaches in case the deleted coach was saved
        queryClient.invalidateQueries({ queryKey: ['/api/coaches/saved'] });
        
        toast({
          title: 'Coach deleted',
          description: 'The coach has been permanently deleted.',
        });
      } else {
        throw new Error('Failed to delete coach');
      }
    } catch (error) {
      console.error('Error deleting coach:', error);
      toast({
        title: 'Error',
        description: 'There was a problem deleting the coach.',
        variant: 'destructive',
      });
    }
  };
  
  // For pagination
  const indexOfLastSavedCoach = savedCurrentPage * savedCoachesPerPage;
  const indexOfFirstSavedCoach = indexOfLastSavedCoach - savedCoachesPerPage;
  const currentSavedCoaches = filteredSavedCoaches.slice(indexOfFirstSavedCoach, indexOfLastSavedCoach);
  const savedTotalPages = Math.ceil(filteredSavedCoaches.length / savedCoachesPerPage);
  
  // Variables used in UI for saved coaches pagination display
  const savedIndexOfFirstCoach = indexOfFirstSavedCoach;
  const savedIndexOfLastCoach = indexOfLastSavedCoach;
  
  const indexOfLastCoach = currentPage * coachesPerPage;
  const indexOfFirstCoach = indexOfLastCoach - coachesPerPage;
  const currentCoaches = allCoachesData.slice(indexOfFirstCoach, indexOfLastCoach);
  const totalPages = Math.ceil(allCoachesData.length / coachesPerPage);
  
  // Form setup for adding/editing coaches
  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      school: "",
      sport: "",
      division: "",
      conference: "",
      position: "",
      city: "",
      state: "",
      notes: "",
      status: "Not Contacted",
    },
  });
  
  // Handle selected coaches for email
  const handleCoachSelection = (coachId: number, isSelected: boolean) => {
    const newSelection = new Set(selectedCoachIds);
    
    if (isSelected) {
      newSelection.add(coachId);
    } else {
      newSelection.delete(coachId);
    }
    
    setSelectedCoachIds(newSelection);
  };
  
  // Toggle selection for all displayed coaches
  const toggleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const newSelection = new Set(selectedCoachIds);
      currentCoaches.forEach(coach => newSelection.add(coach.id));
      setSelectedCoachIds(newSelection);
    } else {
      // Only deselect currently visible coaches
      const newSelection = new Set(selectedCoachIds);
      currentCoaches.forEach(coach => newSelection.delete(coach.id));
      setSelectedCoachIds(newSelection);
    }
  };
  
  // Email selected coaches
  const emailSelectedCoaches = () => {
    const coachIdsParam = Array.from(selectedCoachIds).join(',');
    console.log("Emailing multiple coaches with IDs:", coachIdsParam);
    console.log("Navigating to:", `/emails?coachIds=${coachIdsParam}`);
    window.location.href = `/emails?coachIds=${coachIdsParam}`;
  };
  
  // Reset the form when opening the add dialog
  useEffect(() => {
    if (isAddDialogOpen) {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        school: "",
        sport: "",
        division: "",
        conference: "",
        position: "",
        city: "",
        state: "",
        notes: "",
        status: "Not Contacted",
      });
    }
  }, [isAddDialogOpen, form]);
  
  // Fill the form when opening the edit dialog
  useEffect(() => {
    if (isEditDialogOpen && selectedCoach) {
      form.reset({
        firstName: selectedCoach.firstName,
        lastName: selectedCoach.lastName,
        email: selectedCoach.email,
        phone: selectedCoach.phone || "",
        school: selectedCoach.school,
        sport: selectedCoach.sport,
        division: selectedCoach.division || "",
        conference: selectedCoach.conference || "",
        position: selectedCoach.position || "",
        city: selectedCoach.city || "",
        state: selectedCoach.state || "",
        notes: selectedCoach.notes || "",
        status: selectedCoach.status || "Not Contacted",
      });
    }
  }, [isEditDialogOpen, selectedCoach, form]);
  
  // Handle form submission for adding a coach
  const onAddSubmit = async (data: CoachFormValues) => {
    try {
      const response = await apiRequest('POST', '/api/coaches', data);
      
      if (response.ok) {
        setIsAddDialogOpen(false);
        
        // Refetch coaches data
        refetch();
        
        toast({
          title: 'Coach added',
          description: 'The new coach has been added successfully.',
        });
      } else {
        throw new Error('Failed to add coach');
      }
    } catch (error) {
      console.error('Error adding coach:', error);
      toast({
        title: 'Error',
        description: 'There was a problem adding the coach.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle form submission for editing a coach
  const onEditSubmit = async (data: CoachFormValues) => {
    if (!selectedCoach) return;
    
    try {
      const response = await apiRequest('PATCH', `/api/coaches/${selectedCoach.id}`, data);
      
      if (response.ok) {
        setIsEditDialogOpen(false);
        
        // Refetch coaches data
        refetch();
        
        // Also refetch saved coaches in case the edited coach was saved
        queryClient.invalidateQueries({ queryKey: ['/api/coaches/saved'] });
        
        toast({
          title: 'Coach updated',
          description: 'The coach has been updated successfully.',
        });
      } else {
        throw new Error('Failed to update coach');
      }
    } catch (error) {
      console.error('Error updating coach:', error);
      toast({
        title: 'Error',
        description: 'There was a problem updating the coach.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Find Coaches</h1>
        {userProfile?.role === 'admin' && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Coach
          </Button>
        )}
      </div>
      
      {/* Saved Coaches Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Star className="h-5 w-5 mr-2 fill-amber-500 text-amber-500" />
            Saved Coaches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSavedCoaches.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
              No saved coaches yet. Star a coach to add them to this list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSavedCoaches?.map((coach: Coach) => (
                    <TableRow 
                      key={coach.id} 
                      className="cursor-pointer"
                      onClick={() => {
                        console.log("Setting selectedCoachForView from saved coaches:", coach);
                        setSelectedCoachForView(coach);
                        console.log("Opening view dialog for saved coach:", coach.id, coach.firstName, coach.lastName);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {formatName(coach.firstName)} {formatName(coach.lastName)}
                      </TableCell>
                      <TableCell>
                        <SchoolWithLogo school={coach.school} />
                      </TableCell>
                      <TableCell>{coach.sport}</TableCell>
                      <TableCell>{coach.division}</TableCell>
                      <TableCell>{coach.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(coach.id, coach.favorite || false);
                            }}
                            className="text-amber-500"
                          >
                            <Star className="h-4 w-4 fill-amber-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => {
                              e.stopPropagation();
                              console.log("Email button clicked for coach:", coach.id, `${coach.firstName} ${coach.lastName}`);
                              console.log("Navigating to:", `/emails?coachId=${coach.id}`);
                              window.location.href = `/emails?coachId=${coach.id}`;
                            }}>
                            <MailIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination for saved coaches */}
              {filteredSavedCoaches && filteredSavedCoaches.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {savedIndexOfFirstCoach + 1} to {Math.min(savedIndexOfLastCoach, filteredSavedCoaches.length)} of {filteredSavedCoaches.length} saved coaches
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSavedCurrentPage(savedCurrentPage - 1)}
                      disabled={savedCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSavedCurrentPage(savedCurrentPage + 1)}
                      disabled={savedCurrentPage === savedTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* All Coaches Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">All Coaches</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search coaches by name or school..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-1 gap-2 md:justify-end">
              <div className="w-1/3">
                <div>
                  {/* Show dropdown for admins, fixed display for regular users */}
                  {userProfile?.role === 'admin' ? (
                    <Select value={sportFilter} onValueChange={setSportFilter}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-400" />
                          <SelectValue placeholder="Sport" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_sports">All Sports</SelectItem>
                        <SelectItem value="Field Hockey">Field Hockey</SelectItem>
                        <SelectItem value="Mens Ice Hockey">Men's Ice Hockey</SelectItem>
                        <SelectItem value="Mens Lacrosse">Men's Lacrosse</SelectItem>
                        <SelectItem value="Womens Golf">Women's Golf</SelectItem>
                        <SelectItem value="Womens Lacrosse">Women's Lacrosse</SelectItem>
                        <SelectItem value="Womens Soccer">Women's Soccer</SelectItem>
                        <SelectItem value="Womens Tennis">Women's Tennis</SelectItem>
                        <SelectItem value="Womens Volleyball">Women's Volleyball</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center border rounded-md px-3 py-2 bg-gray-50">
                      <Trophy className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{sportFilter || userProfile?.sport || "Loading..."}</span>
                      <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                        Fixed
                      </span>
                    </div>
                  )}
                </div>
              </div>
          
              <div className="w-1/3">
                <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Division" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_divisions">All Divisions</SelectItem>
                    {divisionOptions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-1/3">
                <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Conference" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_conferences">All Conferences</SelectItem>
                    {conferenceOptions.map((conference) => (
                      <SelectItem key={conference} value={conference}>
                        {conference}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Controls for multi-select */}
          {selectedCoachIds.size > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex justify-between items-center mb-4">
              <div className="text-sm text-amber-800">
                <span className="font-medium">{selectedCoachIds.size}</span> coaches selected
              </div>
              <Button 
                onClick={emailSelectedCoaches}
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Email Selected Coaches
              </Button>
            </div>
          )}
          
          {/* Display the list of all coaches, grouped by school */}
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {allCoachesData?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                  No coaches found. Adjust your filters to see more coaches.
                </div>
              ) : (
                (() => {
                  // Group coaches by school
                  const schoolsMap: Record<string, Coach[]> = {};
                  
                  currentCoaches?.forEach((coach: Coach) => {
                    if (!schoolsMap[coach.school]) {
                      schoolsMap[coach.school] = [];
                    }
                    schoolsMap[coach.school].push(coach);
                  });
                  
                  // Convert to array of schools with coaches
                  return Object.entries(schoolsMap).map(([schoolName, schoolCoaches]) => {
                    // Get state and region from the first coach (should be the same for all coaches at this school)
                    const state = schoolCoaches[0]?.state || '';
                    const region = schoolCoaches[0]?.region || '';
                    const division = schoolCoaches[0]?.division || '';
                    const conference = schoolCoaches[0]?.conference || '';
                    
                    return (
                      <Card key={schoolName} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <SchoolWithLogo school={schoolName} />
                                <span>{schoolName}</span>
                              </CardTitle>
                              <div className="text-sm text-gray-500 mt-1 flex items-center flex-wrap gap-x-2">
                                {division && <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" /> {division}</span>}
                                {conference && <span> • {conference}</span>}
                                {state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {state}</span>}
                                {region && <span> • {region} Region</span>}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {schoolCoaches.length} {schoolCoaches.length === 1 ? 'coach' : 'coaches'}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40px]">
                                  <Checkbox 
                                    checked={schoolCoaches.every(coach => selectedCoachIds.has(coach.id))}
                                    onCheckedChange={(checked) => {
                                      schoolCoaches.forEach(coach => 
                                        handleCoachSelection(coach.id, Boolean(checked))
                                      );
                                    }}
                                  />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Sport</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {schoolCoaches.map((coach: Coach) => (
                                <TableRow
                                  key={coach.id}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    console.log("Setting selectedCoachForView:", coach);
                                    setSelectedCoachForView(coach);
                                    console.log("Opening view dialog for coach:", coach.id, coach.firstName, coach.lastName);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox 
                                      checked={selectedCoachIds.has(coach.id)}
                                      onCheckedChange={(checked) => handleCoachSelection(coach.id, Boolean(checked))}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatName(coach.firstName)} {formatName(coach.lastName)}
                                  </TableCell>
                                  <TableCell>{coach.position || "—"}</TableCell>
                                  <TableCell>{coach.sport}</TableCell>
                                  <TableCell>{coach.email}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFavorite(coach.id, coach.favorite || false);
                                        }}
                                        className={coach.favorite ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}
                                        title={coach.favorite ? "Remove from saved" : "Add to saved"}
                                      >
                                        <Star className={`h-4 w-4 ${coach.favorite ? "fill-amber-500" : "fill-none"}`} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log("Email button clicked for coach (all coaches section):", coach.id, `${coach.firstName} ${coach.lastName}`);
                                          console.log("Navigating to:", `/emails?coachId=${coach.id}`);
                                          window.location.href = `/emails?coachId=${coach.id}`;
                                        }}
                                        title="Send email"
                                      >
                                        <MailIcon className="h-4 w-4" />
                                      </Button>
                                      {userProfile?.role === 'admin' && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedCoach(coach);
                                              setIsEditDialogOpen(true);
                                            }}
                                            title="Edit coach"
                                          >
                                            <EditIcon className="h-4 w-4" />
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Delete coach"
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  This action cannot be undone. This will permanently delete the coach
                                                  and all associated data.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCoach(coach.id);
                                                  }}
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  });
                })()
              )}
            </div>
          )}
          
          {/* Pagination for all coaches */}
          {allCoachesData.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstCoach + 1} to {Math.min(indexOfLastCoach, allCoachesData.length)} of {allCoachesData.length} coaches
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add Coach Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Coach</DialogTitle>
            <DialogDescription>
              Add a new coach to the database. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <FormControl>
                        <Input placeholder="School name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Field Hockey">Field Hockey</SelectItem>
                          <SelectItem value="Mens Ice Hockey">Men's Ice Hockey</SelectItem>
                          <SelectItem value="Mens Lacrosse">Men's Lacrosse</SelectItem>
                          <SelectItem value="Womens Golf">Women's Golf</SelectItem>
                          <SelectItem value="Womens Lacrosse">Women's Lacrosse</SelectItem>
                          <SelectItem value="Womens Soccer">Women's Soccer</SelectItem>
                          <SelectItem value="Womens Tennis">Women's Tennis</SelectItem>
                          <SelectItem value="Womens Volleyball">Women's Volleyball</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Division I">Division I</SelectItem>
                          <SelectItem value="Division II">Division II</SelectItem>
                          <SelectItem value="Division III">Division III</SelectItem>
                          <SelectItem value="NAIA">NAIA</SelectItem>
                          <SelectItem value="Junior College">Junior College</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="conference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conference</FormLabel>
                      <FormControl>
                        <Input placeholder="Conference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Interested">Interested</SelectItem>
                          <SelectItem value="Need Info">Need Info</SelectItem>
                          <SelectItem value="Not Available">Not Available</SelectItem>
                          <SelectItem value="Meeting Scheduled">Meeting Scheduled</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Visit Scheduled">Visit Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this coach"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Add Coach</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Coach Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Coach</DialogTitle>
            <DialogDescription>
              Update coach information. Edit the details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <FormControl>
                        <Input placeholder="School name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Field Hockey">Field Hockey</SelectItem>
                          <SelectItem value="Mens Ice Hockey">Men's Ice Hockey</SelectItem>
                          <SelectItem value="Mens Lacrosse">Men's Lacrosse</SelectItem>
                          <SelectItem value="Womens Golf">Women's Golf</SelectItem>
                          <SelectItem value="Womens Lacrosse">Women's Lacrosse</SelectItem>
                          <SelectItem value="Womens Soccer">Women's Soccer</SelectItem>
                          <SelectItem value="Womens Tennis">Women's Tennis</SelectItem>
                          <SelectItem value="Womens Volleyball">Women's Volleyball</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Division I">Division I</SelectItem>
                          <SelectItem value="Division II">Division II</SelectItem>
                          <SelectItem value="Division III">Division III</SelectItem>
                          <SelectItem value="NAIA">NAIA</SelectItem>
                          <SelectItem value="Junior College">Junior College</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="conference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conference</FormLabel>
                      <FormControl>
                        <Input placeholder="Conference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Position" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Interested">Interested</SelectItem>
                          <SelectItem value="Need Info">Need Info</SelectItem>
                          <SelectItem value="Not Available">Not Available</SelectItem>
                          <SelectItem value="Meeting Scheduled">Meeting Scheduled</SelectItem>
                          <SelectItem value="Follow-up">Follow-up</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Visit Scheduled">Visit Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this coach"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Update Coach</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Coach View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedCoachForView?.firstName ? formatName(selectedCoachForView.firstName) : ''} {selectedCoachForView?.lastName ? formatName(selectedCoachForView.lastName) : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedCoachForView?.position && `${selectedCoachForView.position} • `}
              {selectedCoachForView?.school}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
              <div className="mt-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedCoachForView?.email}</span>
                </div>
                {selectedCoachForView?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedCoachForView.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">School Information</h3>
              <div className="mt-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{selectedCoachForView?.sport}</span>
                </div>
                {selectedCoachForView?.division && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedCoachForView.division}</span>
                  </div>
                )}
                {selectedCoachForView?.conference && (
                  <div className="flex items-center space-x-2">
                    <School className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedCoachForView.conference}</span>
                  </div>
                )}
                {(selectedCoachForView?.city || selectedCoachForView?.state || selectedCoachForView?.region) && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {selectedCoachForView.city}{selectedCoachForView.city && selectedCoachForView.state && ', '}{selectedCoachForView.state}
                      {(selectedCoachForView.city || selectedCoachForView.state) && selectedCoachForView.region && ' • '}
                      {selectedCoachForView.region && `${selectedCoachForView.region} Region`}
                    </span>
                  </div>
                )}
                {selectedCoachForView?.status && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline" className="font-normal">
                      {selectedCoachForView.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {selectedCoachForView?.notes && (
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-2 text-sm">{selectedCoachForView.notes}</p>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (selectedCoachForView) {
                    handleToggleFavorite(
                      selectedCoachForView.id, 
                      selectedCoachForView.favorite || false
                    );
                  }
                }}
                className={selectedCoachForView?.favorite ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}
              >
                <Star className={`h-4 w-4 mr-1.5 ${selectedCoachForView?.favorite ? "fill-amber-500" : "fill-none"}`} />
                {selectedCoachForView?.favorite ? "Remove from Saved" : "Add to Saved"}
              </Button>
            </div>
            
            <div className="space-x-2">
              {userProfile?.role === 'admin' && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    if (selectedCoachForView) {
                      setSelectedCoach(selectedCoachForView);
                      setIsEditDialogOpen(true);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit Coach
                </Button>
              )}
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedCoachForView) {
                  console.log("Email button clicked for coach (coach view):", selectedCoachForView.id, `${selectedCoachForView.firstName} ${selectedCoachForView.lastName}`);
                  console.log("Complete selected coach object:", selectedCoachForView);
                  console.log("Navigating to:", `/emails?coachId=${selectedCoachForView.id}`);
                  
                  // Force navigation to the emails page with coach ID parameter
                  window.location.href = `/emails?coachId=${selectedCoachForView.id}`;
                  
                  // As a test, try changing the browser's location directly
                  // window.location.assign(`/emails?coachId=${selectedCoachForView.id}`);
                }
              }}>
                <Mail className="h-4 w-4 mr-1.5" />
                Send Email
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}