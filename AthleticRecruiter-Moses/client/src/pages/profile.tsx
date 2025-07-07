import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useEffect, useState } from "react";
import { 
  UserIcon,
  SaveIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  BookmarkIcon,
  LinkIcon,
  RefreshCwIcon,
  PlusIcon,
  TrashIcon
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const years = [2024, 2025, 2026, 2027, 2028];
const sports = ["Field Hockey", "Mens Ice Hockey", "Mens Lacrosse", "Womens Golf", "Womens Lacrosse", "Womens Soccer", "Womens Tennis", "Womens Volleyball"];
const genderOptions = ["Male", "Female", "Non-Binary"];
const schoolSizeOptions = ["Small", "Medium", "Large"];
const programLevelOptions = ["D1", "D2", "D3", "NAIA", "NJCAA"];

// Form schema for profile
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  gender: z.string().optional(),
  sport: z.string().min(1, "Sport is required"),
  graduationYear: z.coerce.number().int().min(2023).max(2030),
  // Athletic information
  position: z.string().optional(),
  height: z.string().optional(),
  keyStats: z.string().optional(),
  highlights: z.string().optional(),
  bio: z.string().optional(),
  // Academic stats
  gpa: z.string().optional(),
  testScores: z.string().optional(),
  academicHonors: z.string().optional(),
  intendedMajor: z.string().optional(),
  // School preferences
  location: z.string().optional(),
  schoolSize: z.string().optional(),
  programLevel: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
// Extended profile type that includes the stats field
type ExtendedProfileFormData = ProfileFormValues & {
  stats?: Record<string, string>;
};

// Define the Stats type for updating stats
interface StatsData {
  stats: Record<string, string>;
}

export default function Profile() {
  const { toast } = useToast();
  const [testScores, setTestScores] = useState<{type: string, score: string}[]>([
    { type: "ACT", score: "" },
    { type: "SAT", score: "" }
  ]);

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  // Fix for potential null stats
  const handleNullStats = (statsObj: Record<string, string> | null | undefined): Record<string, string> => {
    return statsObj || {};
  };
  
  // Parse test scores from string format to structured format
  const parseTestScores = (scoresStr: string) => {
    const scores: {type: string, score: string}[] = [
      { type: "ACT", score: "" },
      { type: "SAT", score: "" }
    ];
    
    if (!scoresStr) return scores;
    
    // Parse formats like "ACT: 28, SAT: 1350"
    const actMatch = scoresStr.match(/ACT:\s*(\d+)/i);
    const satMatch = scoresStr.match(/SAT:\s*(\d+)/i);
    
    if (actMatch && actMatch[1]) {
      scores[0].score = actMatch[1];
    }
    
    if (satMatch && satMatch[1]) {
      scores[1].score = satMatch[1];
    }
    
    return scores;
  };
  
  // Format test scores from structured format to string format
  const formatTestScores = (scores: {type: string, score: string}[]): string => {
    const formattedScores = scores
      .filter(score => score.score)
      .map(score => `${score.type}: ${score.score}`)
      .join(", ");
    return formattedScores;
  };
  
  // Handle test score changes
  const handleTestScoreChange = (index: number, score: string) => {
    const updatedScores = [...testScores];
    updatedScores[index].score = score;
    setTestScores(updatedScores);
    
    // Update the form field value
    profileForm.setValue("testScores", formatTestScores(updatedScores));
  };

  // Setup profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      gender: "",
      sport: "",
      graduationYear: 2024,
      position: "",
      height: "",
      keyStats: "",
      highlights: "",
      bio: "",
      gpa: "",
      testScores: "",
      academicHonors: "",
      intendedMajor: "",
      location: "",
      schoolSize: "",
      programLevel: "",
    }
  });

  // Setup stats form - now a string instead of individual fields
  const [statsTextArea, setStatsTextArea] = useState<string>("");

  // Convert stats object to string (for display in textarea)
  const statsObjectToString = (statsObj: Record<string, string> | null | undefined): string => {
    const validStatsObj = handleNullStats(statsObj);
    if (Object.keys(validStatsObj).length === 0) return "";
    
    return Object.entries(validStatsObj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  // Convert stats string to object (for saving to database)
  const statsStringToObject = (statsStr: string): Record<string, string> => {
    if (!statsStr.trim()) return {};
    
    const statsObj: Record<string, string> = {};
    
    statsStr.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Try to split by colon first
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();
        if (key && value) statsObj[key] = value;
      } else {
        // If no colon found, use the entire line as the key and leave value empty
        statsObj[trimmedLine] = "";
      }
    });
    
    return statsObj;
  };

  // Update forms when user data is loaded
  useEffect(() => {
    if (user) {
      // Update profile form
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        gender: user.gender || "",
        sport: user.sport || "",
        graduationYear: user.graduationYear || 2024,
        position: user.position || "",
        height: user.height || "",
        keyStats: user.keyStats || "",
        highlights: user.highlights || "",
        bio: user.bio || "",
        gpa: user.gpa || "",
        testScores: user.testScores || "",
        academicHonors: user.academicHonors || "",
        intendedMajor: user.intendedMajor || "",
        location: user.location || "",
        schoolSize: user.schoolSize || "",
        programLevel: user.programLevel || "",
      });
      
      // Parse and set test scores
      setTestScores(parseTestScores(user.testScores || ""));
      
      // Convert stats object to string for the textarea
      setStatsTextArea(statsObjectToString(user.stats));
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ExtendedProfileFormData) => {
      const response = await apiRequest("PUT", "/api/user", data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Log to analytics if we had them
      console.log("Profile updated:", updatedUser);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update stats mutation
  const updateStatsMutation = useMutation({
    mutationFn: async (data: { stats: Record<string, string> }) => {
      const response = await apiRequest("PUT", "/api/user", data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Stats Updated",
        description: "Your athletic stats have been successfully updated.",
      });
      
      // Log to analytics if we had them
      console.log("Stats updated:", updatedUser);
    },
    onError: (error) => {
      console.error("Error updating stats:", error);
      toast({
        title: "Error",
        description: "Failed to update stats. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    // Convert stats text area to object and include it in the submission
    const statsObj = statsStringToObject(statsTextArea);
    
    // Create a clean update object, removing problematic fields
    const updateData = {
      ...data,
      stats: statsObj
    };
    
    // Remove createdAt if present to avoid date conversion issues
    if ('createdAt' in updateData) {
      delete (updateData as any).createdAt;
    }
    
    console.log("Submitting profile update:", updateData);
    updateProfileMutation.mutate(updateData);
  };

  // Handle stats text area change
  const handleStatsTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStatsTextArea(e.target.value);
  };
  
  // Save stats from text area to database
  const saveStats = () => {
    const statsObj = statsStringToObject(statsTextArea);
    updateStatsMutation.mutate({
      stats: statsObj
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Manage your athlete profile information</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Athlete Profile</CardTitle>
              <CardDescription>
                Update your profile information for college coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderOptions.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="sport"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sport</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input 
                                value={field.value} 
                                readOnly 
                                disabled
                                className="bg-gray-100 text-gray-700"
                              />
                            </FormControl>
                            <div className="text-xs inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 font-medium shadow-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                              Locked
                            </div>
                          </div>
                          <FormDescription className="text-xs text-gray-500">
                            Sport selection can only be changed by an administrator
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="graduationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Year</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select graduation year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell coaches about yourself, your journey, and goals..."
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly describe your athletic journey and goals
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Academic Information */}
                  <h3 className="text-lg font-medium pt-4">Academic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="gpa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPA</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3.8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="testScores"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Scores (ACT/SAT)</FormLabel>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">ACT</label>
                                <Select 
                                  value={testScores[0].score || ""}
                                  onValueChange={(value) => handleTestScoreChange(0, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ACT score" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="N/A">Not Available</SelectItem>
                                    {Array.from({length: 17}, (_, i) => (
                                      <SelectItem key={i+20} value={(i+20).toString()}>
                                        {i+20}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">SAT</label>
                                <Select 
                                  value={testScores[1].score || ""}
                                  onValueChange={(value) => handleTestScoreChange(1, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select SAT score" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="N/A">Not Available</SelectItem>
                                    {Array.from({length: 16}, (_, i) => (
                                      <SelectItem key={i} value={(i*50+1000).toString()}>
                                        {i*50+1000}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <input type="hidden" {...field} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="intendedMajor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intended Major</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Business Administration, Computer Science, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          This helps coaches understand your academic interests
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="academicHonors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Honors & Achievements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List your academic honors, achievements, and extracurricular activities..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Examples: Honor Roll, National Honor Society, Academic Awards, Leadership Roles
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                  
                  {/* School Preferences */}
                  <h3 className="text-lg font-medium pt-4">School Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Locations</FormLabel>
                          <FormControl>
                            <Input placeholder="West Coast, Northeast, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="schoolSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Size</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select preferred school size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schoolSizeOptions.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Preferred size of the schools you're interested in
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="programLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preferred program level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programLevelOptions.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Athletic division level you're targeting
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />

                  {/* Athletic Information */}
                  <h3 className="text-lg font-medium pt-4">Athletic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Second sport field is hidden since it's a duplicate - users can't change their sport */}
                    
                    <FormField
                      control={profileForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Point Guard, Forward, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={profileForm.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input placeholder="6'2&quot;, 5'10&quot;, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="highlights"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Highlight Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtu.be/your-video-id" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to your highlight reel on YouTube, Hudl, or other platforms
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Athletic Statistics</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <FormLabel htmlFor="athletic-stats">Enter your key athletic statistics</FormLabel>
                        <Textarea 
                          id="athletic-stats"
                          placeholder="Enter your stats in the format: 'Stat Name: Value' (one per line)
Examples:
Vertical Jump: 28 inches
40-yard dash: 4.8 seconds
Bench Press: 225 lbs"
                          className="min-h-[150px] font-mono text-sm"
                          value={statsTextArea}
                          onChange={handleStatsTextAreaChange}
                        />
                        <FormDescription>
                          Enter each stat on a new line in the format "Stat Name: Value"
                        </FormDescription>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Profile...
                        </div>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}