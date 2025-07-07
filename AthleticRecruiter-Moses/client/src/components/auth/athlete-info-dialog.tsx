import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ChevronLeft, AlertTriangle, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth-provider";

// Gender options
const genderOptions = ["Male", "Female", "Non-Binary"];

// Hardcoded sports list by gender
const sportsListByGender: Record<string, string[]> = {
  Male: [
    "Baseball",
    "Football",
    "Mens Basketball",
    "Mens Golf",
    "Mens Ice Hockey",
    "Mens Lacrosse",
    "Mens Soccer",
    "Mens Tennis",
  ],
  Female: [
    "Beach Volleyball",
    "Field Hockey",
    "Softball",
    "Womens Basketball",
    "Womens Golf",
    "Womens Ice Hockey",
    "Womens Lacrosse",
    "Womens Soccer",
    "Womens Tennis",
    "Womens Volleyball",
  ],
  "Non-Binary": [
    "Baseball",
    "Beach Volleyball",
    "Field Hockey",
    "Football",
    "Mens Basketball",
    "Mens Golf",
    "Mens Ice Hockey",
    "Mens Lacrosse",
    "Mens Soccer",
    "Mens Tennis",
    "Softball",
    "Womens Basketball",
    "Womens Golf",
    "Womens Ice Hockey",
    "Womens Lacrosse",
    "Womens Soccer",
    "Womens Tennis",
    "Womens Volleyball",
  ],
};

// Combine all sports for when no gender is selected
const allSportsList = [
  "Baseball",
  "Beach Volleyball",
  "Field Hockey",
  "Football",
  "Mens Basketball",
  "Mens Golf",
  "Mens Ice Hockey",
  "Mens Lacrosse",
  "Mens Soccer",
  "Mens Tennis",
  "Softball",
  "Womens Basketball",
  "Womens Golf",
  "Womens Ice Hockey",
  "Womens Lacrosse",
  "Womens Soccer",
  "Womens Tennis",
  "Womens Volleyball",
];

// Position options for sports
const sportPositions: Record<string, string[]> = {
  Baseball: [
    "Pitcher",
    "Catcher",
    "First Base",
    "Second Base",
    "Third Base",
    "Shortstop",
    "Left Field",
    "Center Field",
    "Right Field",
    "Designated Hitter",
  ],
  "Beach Volleyball": ["Blocker", "Defender"],
  "Field Hockey": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  Football: [
    "Quarterback",
    "Running Back",
    "Wide Receiver",
    "Tight End",
    "Offensive Lineman",
    "Defensive Lineman",
    "Linebacker",
    "Cornerback",
    "Safety",
    "Kicker",
    "Punter",
    "Long Snapper",
  ],
  "Mens Basketball": [
    "Point Guard",
    "Shooting Guard",
    "Small Forward",
    "Power Forward",
    "Center",
  ],
  "Mens Golf": ["Golfer"],
  "Mens Ice Hockey": [
    "Goaltender",
    "Defenseman",
    "Center",
    "Left Wing",
    "Right Wing",
  ],
  "Mens Lacrosse": [
    "Attackman",
    "Midfielder",
    "Defenseman",
    "Goalie",
    "Faceoff Specialist",
    "Long Stick Midfielder",
  ],
  "Mens Soccer": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  "Mens Tennis": ["Singles Player", "Doubles Player"],
  Softball: [
    "Pitcher",
    "Catcher",
    "First Base",
    "Second Base",
    "Third Base",
    "Shortstop",
    "Left Field",
    "Center Field",
    "Right Field",
    "Designated Player",
  ],
  "Womens Basketball": [
    "Point Guard",
    "Shooting Guard",
    "Small Forward",
    "Power Forward",
    "Center",
  ],
  "Womens Golf": ["Golfer"],
  "Womens Ice Hockey": [
    "Goaltender",
    "Defenseman",
    "Center",
    "Left Wing",
    "Right Wing",
  ],
  "Womens Lacrosse": ["Attack", "Midfield", "Defense", "Goalie"],
  "Womens Soccer": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  "Womens Tennis": ["Singles Player", "Doubles Player"],
  "Womens Volleyball": [
    "Outside Hitter",
    "Opposite Hitter",
    "Setter",
    "Middle Blocker",
    "Libero",
    "Defensive Specialist",
  ],
  Volleyball: [
    "Outside Hitter",
    "Opposite Hitter",
    "Setter",
    "Middle Blocker",
    "Libero",
    "Defensive Specialist",
  ],
};

// Division options
const divisionOptions = ["D1", "D2", "D3", "NAIA", "JUCO"];

// School size options
const schoolSizeOptions = [
  "Small (under 5,000 students)",
  "Medium (5,000-15,000 students)",
  "Large (over 15,000 students)",
];

// Region options
const regionOptions = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Southwest",
  "West Coast",
  "Northwest",
  "No Preference",
];

// Common majors
const commonMajors = [
  "Business",
  "Engineering",
  "Computer Science",
  "Biology",
  "Psychology",
  "Communications",
  "Education",
  "Health Sciences",
  "Political Science",
  "Mathematics",
  "English",
  "History",
  "Chemistry",
  "Economics",
  "Art",
  "Physical Therapy",
  "Kinesiology",
  "Sports Management",
  "Undecided",
];

// Schema for the form
const athleteInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().optional(),
  sport: z.string().min(1, "Sport is required"),
  graduationYear: z.coerce
    .number()
    .min(2023, "Graduation year must be 2023 or later")
    .max(2030, "Graduation year must be 2030 or earlier"),
  position: z.string().optional(),
  height: z.string().optional(),
  gpa: z.string().optional(),
  testScores: z.string().optional(),
  academicHonors: z.string().optional(),
  keyStats: z.string().optional(),
  highlights: z.string().optional(),
  location: z.string().optional(),
  schoolSize: z.string().optional(),
  intendedMajor: z.string().optional(),
  programLevel: z.string().optional(),
});

type AthleteInfoFormValues = z.infer<typeof athleteInfoSchema>;

export function AthleteInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [filteredSports, setFilteredSports] = useState<string[]>(allSportsList);
  const [isNewUser, setIsNewUser] = useState(false);

  // Fetch user profile data
  const { data: userProfile, isLoading: loadingProfile } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    // enabled: !isNewUser, // Only fetch for existing users
  });

  const maxSteps = 5;

  const form = useForm<AthleteInfoFormValues>({
    resolver: zodResolver(athleteInfoSchema),
    defaultValues: {
      firstName: userProfile?.firstName || "",
      lastName: userProfile?.lastName || "",
      gender: userProfile?.gender || "",
      sport: userProfile?.sport || "",
      graduationYear:
        userProfile?.graduationYear || new Date().getFullYear() + 1,
      position: userProfile?.position || "",
      height: userProfile?.height || "",
      gpa: userProfile?.gpa || "",
      testScores: userProfile?.testScores || "",
      academicHonors: userProfile?.academicHonors || "",
      keyStats: userProfile?.keyStats || "",
      highlights: userProfile?.highlights || "",
      location: userProfile?.location || "",
      schoolSize: userProfile?.schoolSize || "",
      intendedMajor: userProfile?.intendedMajor || "",
      programLevel: userProfile?.programLevel || "",
    },
  });

  useEffect(() => {
    if (loadingProfile) return;
    if (!userProfile) return;

    if (!userProfile.gender) {
      // reset firstName and lastName for new users
      form.reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      });
      setIsNewUser(true);
    } else {
      form.reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        gender: userProfile.gender,
        sport: userProfile.sport,
        graduationYear: userProfile.graduationYear,
        position: userProfile.position,
        height: userProfile.height,
        gpa: userProfile.gpa,
        testScores: userProfile.testScores,
        academicHonors: userProfile.academicHonors,
        keyStats: userProfile.keyStats,
        highlights: userProfile.highlights,
        location: userProfile.location,
        schoolSize: userProfile.schoolSize,
        intendedMajor: userProfile.intendedMajor,
        programLevel: userProfile.programLevel,
      });
      setIsNewUser(false);
    }
  }, [userProfile, loadingProfile]);

  // Fetch available sports from API
  const { data: availableSports = [] } = useQuery<string[]>({
    queryKey: ["/api/sports"],
  });

  // Watch sport field to update positions dropdown
  const watchedSport = form.watch("sport");

  // Fetch position options when sport changes
  const { data: fetchedPositions = [] } = useQuery<string[]>({
    queryKey: ["/api/positions", watchedSport],
    queryFn: async () => {
      if (!watchedSport) return [];
      const response = await fetch(
        `/api/positions/${encodeURIComponent(watchedSport)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch positions");
      }
      return response.json();
    },
    enabled: !!watchedSport, // Only run query when sport is selected
  });

  // Update position options when sport changes
  useEffect(() => {
    if (watchedSport) {
      setSelectedSport(watchedSport);

      // Always use our hardcoded positions first
      if (sportPositions[watchedSport as keyof typeof sportPositions]) {
        setPositionOptions(
          sportPositions[watchedSport as keyof typeof sportPositions],
        );
      } else if (fetchedPositions.length > 0) {
        // Fallback to API positions if we don't have a hardcoded list
        setPositionOptions(fetchedPositions);
      } else {
        // If neither is available, use empty array
        setPositionOptions([]);
      }
    }
  }, [watchedSport, fetchedPositions]);

  const onSubmit = async (values: AthleteInfoFormValues) => {
    if (step < maxSteps) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    try {

      // Clean up values to remove any undefined or null values that might cause issues
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(
          ([_, v]) => v !== undefined && v !== null && v !== "",
        ),
      );
      
      // Use the apiRequest function which properly handles auth tokens
      const response = await apiRequest(
        "PATCH",
        "/api/user/profile",
        cleanedValues,
      );

      let responseData;
      try {
        const text = await response.text();
        console.log("Raw response:", text);
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        responseData = { message: "Could not parse server response" };
      }

      console.log("Profile update response data:", responseData);

      if (!response.ok) {
        console.error("Profile update failed:", response.status, responseData);
        throw new Error(
          `Failed to update profile: ${responseData.message || response.statusText}`,
        );
      }

      toast({
        title: "Profile updated",
        description: "Your athlete information has been saved.",
      });

      // Close the dialog after successful update
      onOpenChange(false);

      // For new users, ensure they get redirected to dashboard after profile is completed
      if (isNewUser) {
        // Use a small delay to ensure the UI updates properly
        console.log("New user detected, redirecting to dashboard");
        setTimeout(() => {
          setLocation("/dashboard");
        }, 300);
         onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description:
          "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch gender to filter sports
  const watchedGender = form.watch("gender");

  // Update sports list when gender changes
  useEffect(() => {
    if (watchedGender && sportsListByGender[watchedGender]) {
      setFilteredSports(sportsListByGender[watchedGender]);

      // If current sport selection is not valid for the selected gender, reset it
      const currentSport = form.getValues("sport");
      if (
        currentSport &&
        !sportsListByGender[watchedGender].includes(currentSport)
      ) {
        form.setValue("sport", "");
      }
    } else {
      setFilteredSports(allSportsList);
    }
  }, [watchedGender, form]);

  const nextStep = () => {
    if (step === 1) {
      // Validate first name, last name, and sport fields before proceeding
      const firstNameValue = form.getValues("firstName");
      const lastNameValue = form.getValues("lastName");
      const sportValue = form.getValues("sport");

      let hasError = false;

      if (!firstNameValue) {
        form.setError("firstName", { message: "First name is required" });
        hasError = true;
      }

      if (!lastNameValue) {
        form.setError("lastName", { message: "Last name is required" });
        hasError = true;
      }

      if (!sportValue) {
        form.setError("sport", { message: "Please select your sport" });
        hasError = true;
      }

      if (hasError) {
        return;
      }
    }
    setStep(Math.min(step + 1, maxSteps));
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  // Generate step title and description
  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Tell us about yourself",
          description:
            "This will help us show you relevant sports and coaches.",
        };
      case 2:
        return {
          title: "Tell us about your position and physical attributes",
          description:
            "This information helps coaches understand your role on the team.",
        };
      case 3:
        return {
          title: "What are your academic achievements?",
          description:
            "Coaches look for athletes who excel both on the field and in the classroom.",
        };
      case 4:
        return {
          title: "What level of college athletics are you targeting?",
          description:
            "We'll help you connect with programs that match your athletic goals.",
        };
      case 5:
        return {
          title: "What are you looking for in a college experience?",
          description:
            "Your preferences will help us recommend programs that fit your needs.",
        };
      default:
        return {
          title: "Tell us about yourself",
          description: "Complete your profile to get started.",
        };
    }
  };

  const stepContent = getStepContent();

  const handleOpenChange = async (newOpen: boolean) => {
    // If trying to close the dialog
    if (!newOpen && isNewUser) {
      // Check if first name, last name and sport are filled
      const firstNameValue = form.getValues("firstName");
      const lastNameValue = form.getValues("lastName");
      const sportValue = form.getValues("sport");

      if (!firstNameValue || !lastNameValue || !sportValue) {
        // Don't allow dialog to close if required fields are not filled
        toast({
          title: "Required fields missing",
          description:
            "Please complete your profile with at least your name and sport before continuing.",
          variant: "destructive",
        });
        return;
      } else {
        // If at least firstName, lastName and sport are filled, save those values
        try {
          console.log("Saving minimal profile data when closing dialog");

          // Only get the values we know are filled
          const minimalData: Record<string, string> = {
            firstName: firstNameValue,
            lastName: lastNameValue,
            sport: sportValue,
          };

          // Add gender if available
          const genderValue = form.getValues("gender");
          if (genderValue) {
            minimalData.gender = genderValue;
          }

          // Add graduation year if available
          const gradYear = form.getValues("graduationYear");
          if (gradYear) {
            minimalData.graduationYear = String(gradYear);
          }

          // Save these minimal fields
          const response = await apiRequest(
            "PATCH",
            "/api/user/profile",
            minimalData,
          );

          if (!response.ok) {
            console.error(
              "Error saving minimal profile:",
              await response.text(),
            );
            toast({
              title: "Warning",
              description:
                "There was an issue saving your profile. You can try again later.",
              variant: "destructive",
            });
          } else {
            console.log("Minimal profile data saved successfully");
            toast({
              title: "Profile Started",
              description:
                "Your basic information has been saved. You can complete your full profile anytime.",
              variant: "default",
            });
          }
        } catch (error) {
          console.error("Error saving minimal profile:", error);
          toast({
            title: "Connection Issue",
            description:
              "Could not save your profile. Please check your internet connection.",
            variant: "destructive",
          });
        }
      }
    }

    // Allow dialog to close if checks pass
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewUser
              ? `Step ${step} of ${maxSteps}: ${stepContent.title}`
              : "Update Your Athlete Profile"}
          </DialogTitle>
          <DialogDescription>
            {isNewUser
              ? stepContent.description
              : "Update your athlete information to keep your profile current."}
          </DialogDescription>
        </DialogHeader>
        {loadingProfile ? (
          <div className="flex justify-center items-center h-24">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Gender & Sport Selection - Step 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Your Name</CardTitle>
                      <CardDescription>
                        Please enter your first and last name
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="First Name" {...field} />
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
                                <Input placeholder="Last Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        How do you identify?
                      </CardTitle>
                      <CardDescription>
                        This helps us show the most relevant sports options
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Select your primary sport
                      </CardTitle>
                      <CardDescription>
                        You'll be matched with coaches in this sport
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="sport"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={
                                !watchedGender ||
                                (userProfile?.sport && !isNewUser)
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={
                                      watchedGender
                                        ? "Which sport do you play?"
                                        : "Select gender first"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredSports.map((sport: string) => (
                                  <SelectItem key={sport} value={sport}>
                                    {sport}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            {isNewUser && (
                              <p className="text-amber-600 text-sm mt-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Important: You cannot change your sport after
                                initial selection.
                              </p>
                            )}
                            {userProfile?.sport && !isNewUser && (
                              <p className="text-amber-600 text-sm mt-2 flex items-center">
                                <Lock className="w-4 h-4 mr-1" />
                                Sport selection cannot be changed. Please
                                contact support if you need to switch sports.
                              </p>
                            )}
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>When do you graduate high school?</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Position & Physical Info - Step 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        What position do you play?
                      </CardTitle>
                      <CardDescription>
                        This helps coaches understand your role on the team
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            {positionOptions.length > 1 ? (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your primary position" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {positionOptions.map((position) => (
                                    <SelectItem key={position} value={position}>
                                      {position}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <FormControl>
                                <Input
                                  placeholder="Enter your position (e.g., Point Guard, Striker)"
                                  {...field}
                                />
                              </FormControl>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What's your height?</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 5'10 or 178 cm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keyStats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          What are your key stats or achievements?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Examples: 15 PPG in basketball, 3:55 mile time in track, 0.350 batting average in baseball..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Academic Info - Step 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Academic Information
                      </CardTitle>
                      <CardDescription>
                        Coaches value players who excel in the classroom too
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="gpa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What's your current GPA?</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 3.8" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="testScores"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Have you taken the SAT or ACT? What were your
                              scores?
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 1350 SAT or 29 ACT"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <FormField
                    control={form.control}
                    name="academicHonors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any academic awards or honors?</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Honor Roll, National Merit Scholar, AP Scholar"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intendedMajor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          What do you plan to study in college?
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a major (or Undecided)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {commonMajors.map((major) => (
                              <SelectItem key={major} value={major}>
                                {major}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Athletic Goals - Step 4 */}
              {step === 4 && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Athletic Goals</CardTitle>
                      <CardDescription>
                        What level are you aiming to compete at?
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="programLevel"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Which division level are you targeting?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {divisionOptions.map((division) => (
                                  <SelectItem key={division} value={division}>
                                    {division}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <FormField
                    control={form.control}
                    name="highlights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          What are your career highlights or awards?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Examples: Team captain, All-Conference selection, Tournament MVP..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* College Preferences - Step 5 */}
              {step === 5 && (
                <div className="space-y-6">
                  <Card className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        College Preferences
                      </CardTitle>
                      <CardDescription>
                        What are you looking for in your ideal school?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              What regions are you interested in?
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a region preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regionOptions.map((region) => (
                                  <SelectItem key={region} value={region}>
                                    {region}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="schoolSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              What size school would you prefer?
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a school size" />
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                {!isNewUser && step === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                )}
                {step < maxSteps ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto"
                  >
                    {isSubmitting ? "Saving..." : "Complete Profile"}
                  </Button>
                )}
              </div>

              {isNewUser && (
                <div className="pt-4 flex justify-center">
                  <div className="flex space-x-2">
                    {Array.from({ length: maxSteps }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${step === index + 1 ? "bg-primary" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
