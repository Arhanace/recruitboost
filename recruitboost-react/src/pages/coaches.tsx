import { useState, useMemo } from "react";
import { Search, Filter, Heart, Mail, Phone, Globe, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  mockCoaches, 
  divisions, 
  conferences, 
  positions, 
  sports 
} from "@/lib/mock-data";
import { Coach } from "@/types";

export default function Coaches() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedConference, setSelectedConference] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [savedCoaches, setSavedCoaches] = useState<Set<string>>(
    new Set(mockCoaches.filter(coach => coach.isSaved).map(coach => coach.id))
  );

  // Filter coaches based on search criteria
  const filteredCoaches = useMemo(() => {
    return mockCoaches.filter(coach => {
      const matchesSearch = searchTerm === "" || 
        coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDivision = selectedDivision === "" || coach.division === selectedDivision;
      const matchesConference = selectedConference === "" || coach.conference === selectedConference;
      const matchesPosition = selectedPosition === "" || coach.position === selectedPosition;
      const matchesSport = selectedSport === "" || coach.sport === selectedSport;
      const matchesSaved = !showSavedOnly || savedCoaches.has(coach.id);

      return matchesSearch && matchesDivision && matchesConference && 
             matchesPosition && matchesSport && matchesSaved;
    });
  }, [searchTerm, selectedDivision, selectedConference, selectedPosition, selectedSport, showSavedOnly, savedCoaches]);

  const handleSaveCoach = (coachId: string) => {
    const newSavedCoaches = new Set(savedCoaches);
    if (newSavedCoaches.has(coachId)) {
      newSavedCoaches.delete(coachId);
      toast({
        title: "Coach removed",
        description: "Coach removed from your saved list"
      });
    } else {
      newSavedCoaches.add(coachId);
      toast({
        title: "Coach saved",
        description: "Coach added to your saved list"
      });
    }
    setSavedCoaches(newSavedCoaches);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDivision("");
    setSelectedConference("");
    setSelectedPosition("");
    setSelectedSport("");
    setShowSavedOnly(false);
  };

  const hasFilters = searchTerm || selectedDivision || selectedConference || 
                   selectedPosition || selectedSport || showSavedOnly;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Coaches</h1>
        <p className="text-gray-600">
          Search our database of college coaches and discover your perfect recruiting targets
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Use the filters below to find coaches that match your recruiting criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by coach name, school, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Division</label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Divisions</SelectItem>
                  {divisions.map(division => (
                    <SelectItem key={division} value={division}>{division}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Conference</label>
              <Select value={selectedConference} onValueChange={setSelectedConference}>
                <SelectTrigger>
                  <SelectValue placeholder="All Conferences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Conferences</SelectItem>
                  {conferences.map(conference => (
                    <SelectItem key={conference} value={conference}>{conference}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Position</label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Positions</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position} value={position}>{position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Sport</label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sports</SelectItem>
                  {sports.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSavedOnly}
                  onChange={(e) => setShowSavedOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show saved coaches only
              </label>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {filteredCoaches.length} coaches found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoaches.map((coach) => (
          <Card key={coach.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{coach.name}</CardTitle>
                  <CardDescription className="font-medium text-primary">
                    {coach.school}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveCoach(coach.id)}
                  className={savedCoaches.has(coach.id) ? "text-red-500" : "text-gray-400"}
                >
                  <Heart className={`h-4 w-4 ${savedCoaches.has(coach.id) ? "fill-current" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GraduationCap className="h-4 w-4" />
                <span>{coach.position}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {coach.division}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {coach.conference}
                </Badge>
              </div>

              {coach.lastContactedAt && (
                <div className="text-xs text-green-600 font-medium">
                  Last contacted: {new Date(coach.lastContactedAt).toLocaleDateString()}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCoach(coach)}
                  className="flex-1"
                >
                  View Profile
                </Button>
                <Button size="sm" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCoaches.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or clearing some filters
            </p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </CardContent>
        </Card>
      )}

      {/* Coach Profile Modal */}
      {selectedCoach && (
        <Dialog open={!!selectedCoach} onOpenChange={() => setSelectedCoach(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCoach.name}</h2>
                  <p className="text-lg text-primary font-medium">{selectedCoach.school}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveCoach(selectedCoach.id)}
                  className={savedCoaches.has(selectedCoach.id) ? "text-red-500" : "text-gray-400"}
                >
                  <Heart className={`h-5 w-5 ${savedCoaches.has(selectedCoach.id) ? "fill-current" : ""}`} />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-sm">{selectedCoach.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sport</label>
                  <p className="text-sm">{selectedCoach.sport}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Division</label>
                  <p className="text-sm">{selectedCoach.division}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Conference</label>
                  <p className="text-sm">{selectedCoach.conference}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-medium">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${selectedCoach.email}`} className="text-primary hover:underline">
                      {selectedCoach.email}
                    </a>
                  </div>
                  {selectedCoach.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedCoach.phone}</span>
                    </div>
                  )}
                  {selectedCoach.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a href={selectedCoach.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Program Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact History */}
              {selectedCoach.lastContactedAt && (
                <div>
                  <h3 className="font-medium mb-2">Contact History</h3>
                  <p className="text-sm text-gray-600">
                    Last contacted: {new Date(selectedCoach.lastContactedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedCoach.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedCoach.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="flex-1">
                  Add Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}