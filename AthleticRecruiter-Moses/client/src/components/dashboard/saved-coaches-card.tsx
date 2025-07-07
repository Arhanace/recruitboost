import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BookmarkCheck, Bookmark, ChevronLeft, ChevronRight, Search, Filter, Mail as MailIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SchoolWithLogo } from "@/components/ui/school-logo";
import { Coach } from "@shared/schema";

type SavedCoachesCardProps = {
  isLoading: boolean;
};

export default function SavedCoachesCard({ isLoading }: SavedCoachesCardProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const coachesPerPage = 5; // Show 5 coaches per page on the dashboard
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get saved coaches
  const { data: savedCoaches = [] } = useQuery({
    queryKey: ["/api/saved-coaches"],
  });
  
  // No longer need sport options as we're not filtering by sport

  // Handle favoriting a coach
  const handleToggleFavorite = async (coachId: number, currentFavorite: boolean) => {
    try {
      // Update in database
      await apiRequest("PATCH", `/api/coaches/${coachId}/favorite`, { favorite: !currentFavorite });
      
      // Refresh coaches data
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-coaches"] });
      
      toast({
        title: "Removed from Saved Coaches",
        description: "Coach has been removed from your saved coaches." 
      });
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast({
        title: "Error",
        description: "Failed to update coach status.",
        variant: "destructive",
      });
    }
  };

  // Filter coaches based on search only (no sport filter)
  const filteredCoaches = (savedCoaches || []).filter((coach: Coach) => {
    // Skip any undefined or null coaches
    if (!coach) return false;
    
    // Only filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const firstName = coach.firstName?.toLowerCase() || '';
      const lastName = coach.lastName?.toLowerCase() || '';
      const school = coach.school?.toLowerCase() || '';
      const email = coach.email?.toLowerCase() || '';
      const sport = coach.sport?.toLowerCase() || '';
      
      return firstName.includes(query) ||
        lastName.includes(query) ||
        school.includes(query) ||
        email.includes(query) ||
        sport.includes(query);
    }
    
    // Return all coaches if no search
    return true;
  });

  // Pagination calculations
  const indexOfLastCoach = currentPage * coachesPerPage;
  const indexOfFirstCoach = indexOfLastCoach - coachesPerPage;
  const totalPages = Math.ceil(filteredCoaches.length / coachesPerPage) || 1;
  const currentCoaches = filteredCoaches.slice(indexOfFirstCoach, indexOfLastCoach);
  
  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">
          My Saved Coaches
        </CardTitle>
        <CardDescription>
          View and manage your saved coaches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-full mb-3"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ) : (
          <>
            {savedCoaches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="flex justify-center mb-2">
                  <Bookmark className="h-12 w-12 text-gray-300" />
                </div>
                <p className="mb-2">You haven't saved any coaches yet.</p>
                <p>Find coaches and add them to your list by clicking the bookmark icon.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex flex-col gap-4 mb-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search coaches by name, school, sport..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Coaches Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Sport</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCoaches.map((coach: Coach) => (
                      <TableRow key={coach.id}>
                        <TableCell className="font-medium">
                          {coach.firstName} {coach.lastName}
                        </TableCell>
                        <TableCell>
                          <SchoolWithLogo school={coach.school} size="sm" />
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700">{coach.position || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span>{coach.sport}</span>
                            <div className="flex gap-1">
                              <Link href={`/emails?coachId=${coach.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Email this coach"
                                  className="text-primary/80 hover:text-primary"
                                >
                                  <MailIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleToggleFavorite(coach.id, coach.favorite || false)}
                                className="text-amber-500"
                                title="Remove from saved coaches"
                              >
                                <BookmarkCheck className="h-4 w-4 fill-amber-500" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {filteredCoaches.length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Showing {indexOfFirstCoach + 1} to {Math.min(indexOfLastCoach, filteredCoaches.length)} of {filteredCoaches.length} coaches
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}