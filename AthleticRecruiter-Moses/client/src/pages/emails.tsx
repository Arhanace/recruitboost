import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { createEmailBody, formatDate } from "@/lib/utils";
import { Coach, EmailTemplate } from "@shared/schema";
import {
  SendIcon,
  CheckCircleIcon,
  SearchIcon,
  FilterIcon,
  Sparkles,
  AlertCircle,
  UserRound,
  User,
  InfoIcon,
  PenSquare,
  Calendar as CalendarIcon,
  Clock,
  Save,
  Trash2,
  PlusCircle,
  Mail,
  MailOpen,
  MailCheck,
  MailX,
  HelpCircle,
  Clock3,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  PencilLine,
  AtSign,
  MailQuestion,
} from "lucide-react";
import { SchoolWithLogo } from "@/components/ui/school-logo";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import GmailPrompt from "@/components/auth/gmail-prompt";
import { ReceivedEmails } from "@/components/emails/received";

// Define form schemas
const emailFormSchema = z.object({
  coachIds: z.string(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required"),
  isDraft: z.boolean().default(false),
  followUpDays: z.number().optional(),
  enableFollowUp: z.boolean().optional(),
});

const aiGeneratorSchema = z.object({
  tone: z.enum(["professional", "friendly", "persuasive", "enthusiastic"]),
  coachDetails: z.string().optional(),
});

// Outreach page component
export default function Outreach() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  const [selectedCoaches, setSelectedCoaches] = useState<number[]>([]);
  const [previewCoach, setPreviewCoach] = useState<Coach | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all-sports");
  const [statusFilter, setStatusFilter] = useState("all-statuses");
  const [divisionFilter, setDivisionFilter] = useState("all-divisions");
  const [stateFilter, setStateFilter] = useState("all-states");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showGmailPrompt, setShowGmailPrompt] = useState(false);

  // IMPORTANT: Explicitly typed and initialized for email viewing/editing
  // Define the complete Email type for better type safety
  interface EmailType {
    id: number;
    userId: number;
    coachId: number;
    subject: string;
    body: string;
    sentAt?: string;
    status: string;
    templateId?: number | null;
    createdAt?: string;
    followUpDays?: number;
    isFollowUp?: boolean;
  }

  const [selectedEmail, setSelectedEmail] = useState<EmailType | null>(null);
  const [isViewEmailOpen, setIsViewEmailOpen] = useState(false);

  console.log("Selected Email:", selectedEmail);

  // Pagination state
  const EMAILS_PER_PAGE = 10;
  const [allEmailsPage, setAllEmailsPage] = useState(1);
  const [draftsPage, setDraftsPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  // Remove select all functionality
  // const [selectAll, setSelectAll] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [savedCoachesSearchQuery, setSavedCoachesSearchQuery] = useState("");
  const [multipleEmails, setMultipleEmails] = useState<{
    [key: number]: { subject: string; body: string };
  }>({});
  const [currentCoachPreviewIndex, setCurrentCoachPreviewIndex] = useState(0);
  const [generatingMultipleEmails, setGeneratingMultipleEmails] =
    useState(false);
  const [showSavedCoaches, setShowSavedCoaches] = useState(true);
  const [isViewingGeneratedEmails, setIsViewingGeneratedEmails] =
    useState(false);

  // Get the current location from Wouter
  const [currentPath] = useLocation();

  // Check URL parameters for coach ID to automatically open the email compose form
  const checkUrlParams = (coachesData: Coach[]) => {
    // Only run this if coaches data is available and it's an array
    if (coachesData && Array.isArray(coachesData) && coachesData.length > 0) {
      // Get URL parameters from window.location instead of Wouter
      const searchStr = window.location.search;
      console.log("Current URL search string:", searchStr);

      const params = new URLSearchParams(searchStr);
      const coachId = params.get("coachId");
      const coachIds = params.get("coachIds");

      console.log(
        "URL Params (Wouter) - coachId:",
        coachId,
        "coachIds:",
        coachIds,
      );
      console.log("Full search string:", searchStr);
      console.log("Available coaches count:", coachesData.length);

      // Handle single coach ID
      if (coachId) {
        const coachIdNumber = parseInt(coachId, 10);
        console.log("Looking for coach with ID:", coachIdNumber);
        const coach = coachesData.find((c: any) => c.id === coachIdNumber);

        console.log(
          "Found coach:",
          coach ? `${coach.firstName} ${coach.lastName}` : "Not found",
        );

        if (coach) {
          console.log("Setting selected coach and opening compose modal");
          // Set the coach as selected
          setSelectedCoaches([coachIdNumber]);
          setPreviewCoach(coach);

          // Set active tab to compose
          setActiveTab("compose");

          // Open the compose modal
          setIsComposeOpen(true);
        } else {
          console.log("Coach not found in available coaches data");
        }
      }
      // Handle multiple coach IDs
      else if (coachIds) {
        console.log("Handling multiple coach IDs:", coachIds);
        const coachIdArray = coachIds.split(",").map((id) => parseInt(id, 10));
        console.log("Parsed coach ID array:", coachIdArray);

        if (coachIdArray.length > 0) {
          console.log("Setting selected coaches:", coachIdArray);
          // Set the coaches as selected
          setSelectedCoaches(coachIdArray);

          // Set preview coach to the first coach in the list
          const firstCoach = coachesData.find(
            (c: Coach) => c.id === coachIdArray[0],
          );
          console.log(
            "First coach from selection:",
            firstCoach
              ? `${firstCoach.firstName} ${firstCoach.lastName}`
              : "Not found",
          );

          if (firstCoach) {
            setPreviewCoach(firstCoach);
          } else {
            console.log("First coach not found in available coaches data");
          }

          // Set active tab to compose
          setActiveTab("compose");

          // Open the compose modal
          setIsComposeOpen(true);
        } else {
          console.log("No valid coach IDs found in the comma-separated list");
        }
      }
    }
  };

  // Form setup
  const form = useForm({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      coachIds: "",
      subject: "",
      body: "",
      isDraft: false,
      followUpDays: 3,
      enableFollowUp: false,
    },
  });

  const aiForm = useForm({
    resolver: zodResolver(aiGeneratorSchema),
    defaultValues: {
      tone: "professional",
    },
  });

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/email-templates"],
    enabled: isComposeOpen,
  });

  // Fetch coaches
  const { data: coachesData, isLoading: coachesLoading } = useQuery({
    queryKey: ["/api/coaches"],
  });
  const coaches = coachesData?.coaches || [];

  // Check URL params when coaches data is loaded
  useEffect(() => {
    if (coaches && Array.isArray(coaches)) {
      checkUrlParams(coaches);
    }
  }, [coaches]);

  // Fetch saved coaches
  const { data: savedCoaches = [], isLoading: savedCoachesLoading } = useQuery({
    queryKey: ["/api/coaches/saved"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("favorite", "true");

      const url = `/api/coaches${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch saved coaches");
      return response.json();
    },
    enabled: isComposeOpen,
  });

  // Fetch user profile for personalization
  const { data: userProfile, isLoading: userProfileLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  // Fetch emails
  const { data: emails, isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/emails"],
  });

  const fetchEmails = async () => {
    try {
      // 🚀 Import any new Gmail replies
      const importRes = await apiRequest(
        "POST",
        "/api/emails/import-gmail-responses",
      );
      if (importRes.ok) {
        const importResult = await importRes.json();
        queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
        console.log("Imported Gmail replies:", importResult);
      } else {
        console.warn("Failed to import Gmail replies:", await importRes.text());
      }
    } catch (error) {
      console.error("Error importing Gmail replies:", error);
    }
  };

  useEffect(() => {
    if (!userProfileLoading && userProfile) {
      if (!userProfile?.gmailRefreshToken) {
        setShowGmailPrompt(true);
      } else {
        fetchEmails();
      }
    }
  }, [userProfileLoading, userProfile]);

  // Pagination helpers
  const getPaginatedEmails = (
    emailsArray: any[] = [],
    page: number,
    perPage = EMAILS_PER_PAGE,
  ) => {
    if (!emailsArray || !emailsArray.length) return [];
    const startIndex = (page - 1) * perPage;
    return emailsArray.slice(startIndex, startIndex + perPage);
  };

  const getTotalPages = (totalItems: number, perPage = EMAILS_PER_PAGE) => {
    return Math.ceil(totalItems / perPage);
  };

  // Generate unique filter options
  // const uniqueSports = coaches
  //   ? [...new Set(coaches.map((coach) => coach.sport).filter(Boolean))]
  //   : [];

  // const uniqueStatuses = coaches
  //   ? [...new Set(coaches.map((coach) => coach.status).filter(Boolean))]
  //   : [];

  // const uniqueDivisions = coaches
  //   ? [...new Set(coaches.map((coach) => coach.division).filter(Boolean))]
  //   : [];

  // const uniqueStates = coaches
  //   ? [...new Set(coaches.map((coach) => coach.state).filter(Boolean))]
  //   : [];

  // Filter coaches based on search, filters, and user's sport
  const filteredCoaches =
    coaches && Array.isArray(coaches)
      ? coaches.filter((coach) => {
          // Apply search filter
          const matchesSearch =
            !searchQuery ||
            coach.firstName
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            coach.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.school?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coach.email?.toLowerCase().includes(searchQuery.toLowerCase());

          // Apply sport filter from dropdown
          const matchesSelectedSport =
            sportFilter === "all-sports" || coach.sport === sportFilter;

          // Apply user's sport filter - only show coaches matching the user's sport
          const userSport = userProfile?.sport;
          const matchesUserSport = !userSport || coach.sport === userSport;

          // Apply status filter
          const matchesStatus =
            statusFilter === "all-statuses" || coach.status === statusFilter;

          // Apply division filter
          const matchesDivision =
            divisionFilter === "all-divisions" ||
            coach.division === divisionFilter;

          // Apply state filter
          const matchesState =
            stateFilter === "all-states" || coach.state === stateFilter;

          return (
            matchesSearch &&
            matchesSelectedSport &&
            matchesUserSport &&
            matchesStatus &&
            matchesDivision &&
            matchesState
          );
        })
      : [];

  // Filter saved coaches based on search and user's sport
  const filteredSavedCoaches = savedCoaches
    ? savedCoaches.filter((coach) => {
        // Apply search filter
        const matchesSearch =
          !savedCoachesSearchQuery ||
          coach.firstName
            ?.toLowerCase()
            .includes(savedCoachesSearchQuery.toLowerCase()) ||
          coach.lastName
            ?.toLowerCase()
            .includes(savedCoachesSearchQuery.toLowerCase()) ||
          coach.school
            ?.toLowerCase()
            .includes(savedCoachesSearchQuery.toLowerCase()) ||
          coach.email
            ?.toLowerCase()
            .includes(savedCoachesSearchQuery.toLowerCase());

        // Apply user's sport filter
        const userSport = userProfile?.sport;
        const matchesUserSport = !userSport || coach.sport === userSport;

        return matchesSearch && matchesUserSport;
      })
    : [];

  // Create task mutation for follow-ups
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Follow-up Task Created",
        description:
          "A task has been added to remind you to follow up with this coach.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create follow-up task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create email mutation
  const createEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      // Normalize coachIds array
      const coachIds = Array.isArray(data.coachIds)
        ? data.coachIds
        : [data.coachIds].filter(Boolean);

      if (coachIds.length === 0) {
        throw new Error("No coach selected for this email");
      }

      // If it's a draft, hit the draft endpoint once per coach
      if (data.isDraft) {
        const drafts = [];
        for (const coachId of coachIds) {
          const payload = {
            coachId,
            subject: data.subject,
            body: data.body,
            templateId: data.templateId,
            isFollowUp: data.isFollowUp,
            followUpDays: data.followUpDays,
          };
          const res = await apiRequest("POST", "/api/emails/draft", payload);
          if (!res.ok) {
            throw new Error(`Failed to save draft for coach ${coachId}`);
          }
          drafts.push(await res.json());
        }
        return { drafts, isDraft: true };
      }

      // Otherwise, send it
      const results = [];
      for (const coachId of coachIds) {
        const payload = {
          coachId,
          subject: data.subject,
          body: data.body,
          templateId: data.templateId,
          isFollowUp: data.isFollowUp,
          followUpDays: data.followUpDays,
        };
        const res = await apiRequest("POST", "/api/emails/send", payload);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to send to ${coachId}: ${text}`);
        }
        const json = await res.json();
        results.push(json);

        // Schedule follow-up task if needed
        if (data.followUpDays) {
          const coach = coaches.find((c) => c.id === coachId);
          if (coach) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + data.followUpDays);
            createTaskMutation.mutate({
              coachId,
              title: `Follow up with ${coach.firstName} ${coach.lastName}`,
              dueDate: dueDate.toISOString(),
              type: "email-follow-up",
              metaData: {
                emailId: json.id,
              },
            });
          }
        }
      }

      return { results, isDraft: false };
    },

    onSuccess: ({ isDraft }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });

      if (isDraft) {
        toast({
          title: "Draft saved",
          description: "Your email has been stored as a draft.",
        });
        // keep modal open, let user continue editing…
      } else {
        toast({
          title: "Email sent",
          description: "Your message has been delivered.",
        });
        setIsComposeOpen(false);
        form.reset();
        setPreviewCoach(null);
      }
    },

    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Could not complete email operation",
        variant: "destructive",
      });
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const response = await apiRequest("DELETE", `/api/emails/${emailId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      setSelectedEmails([]);
      toast({
        title: "Success!",
        description: "Email deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // AI Email generation mutation
  const generateEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/generate-email", data);
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("subject", data.subject);
      form.setValue("body", data.body);
      setAiGenerating(false);
      toast({
        title: "Email Generated",
        description: "Your personalized email has been created.",
      });
    },
    onError: (error) => {
      setAiGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSportFilter("all-sports");
    setStatusFilter("all-statuses");
    setDivisionFilter("all-divisions");
    setStateFilter("all-states");
  };

  // Handle selection of individual coach
  const handleCoachCheckbox = (coachId: number, checked: boolean) => {
    if (checked) {
      // Limit selection to 5 coaches maximum
      if (selectedCoaches.length >= 5) {
        toast({
          title: "Selection limit reached",
          description: "You can only select up to 5 coaches at once.",
          variant: "destructive",
        });
        return;
      }
      setSelectedCoaches((prev) => [...prev, coachId]);
    } else {
      setSelectedCoaches((prev) => prev.filter((id) => id !== coachId));
    }
  };

  // Select coach for preview
  const handleSelectPreviewCoach = (coach: Coach) => {
    setPreviewCoach(coach);

    // Personalize email for preview
    const subject = form.getValues().subject;
    const body = form.getValues().body;

    const personalizedSubject = subject
      .replace(/{{coach_name}}/g, `${coach.firstName} ${coach.lastName}`)
      .replace(/{{school}}/g, coach.school || "");

    const personalizedBody = body
      .replace(/{{coach_name}}/g, `${coach.firstName} ${coach.lastName}`)
      .replace(/{{school}}/g, coach.school || "")
      .replace(/{{sport}}/g, coach.sport || "");

    form.setValue("subject", personalizedSubject);
    form.setValue("body", personalizedBody);
  };

  // Handle AI form submission for a single email
  const handleGenerateAI = async (data: any) => {
    setAiGenerating(true);

    // Create a detailed student profile for AI generation
    const athleteInfo = userProfile
      ? {
          name: `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim(),
          sport: userProfile.sport || data.sport || "",
          position: userProfile.position || "",
          graduationYear: userProfile.graduationYear || "",
          height: userProfile.height || "",
          keyStats: userProfile.keyStats || "",
          highlights: userProfile.highlights || "",
          gpa: userProfile.gpa || "",
          testScores: userProfile.testScores || "",
          academicHonors: userProfile.academicHonors || "",
          intendedMajor: userProfile.intendedMajor || "",
          bio: userProfile.bio || "",
        }
      : {};

    // Add coach specifics if we have a preview coach selected
    const coachInfo = previewCoach
      ? {
          name: `${previewCoach.firstName} ${previewCoach.lastName}`,
          school: previewCoach.school,
          sport: previewCoach.sport,
          division: previewCoach.division || "",
          conference: previewCoach.conference || "",
          position: previewCoach.position || "",
        }
      : {};

    // Add user profile data for personalization
    const generationData = {
      ...data,
      userProfile: athleteInfo,
      coachInfo,
      coachId:
        previewCoach?.id ||
        (selectedCoaches.length === 1 ? selectedCoaches[0] : undefined),
    };

    generateEmailMutation.mutate(generationData);
  };

  // Generate personalized emails for multiple coaches
  const handleGenerateMultipleEmails = async (data: any) => {
    // For All Coaches tab
    let selectedCoachesData = [];

    if (previewCoach) {
      // If we have a preview coach, just use that one
      selectedCoachesData = [previewCoach];
    } else {
      // Get coaches data from selected coaches IDs
      const availableCoaches =
        activeTab === "saved" ? filteredSavedCoaches : filteredCoaches;

      selectedCoachesData = selectedCoaches
        .map((id) => availableCoaches.find((coach) => coach.id === id))
        .filter(Boolean);
    }

    if (selectedCoachesData.length === 0) {
      toast({
        title: "No coaches selected",
        description: "Please select at least one coach to generate emails.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingMultipleEmails(true);

    // Create a copy of our existing emails object
    const newEmails = { ...multipleEmails };

    // Create a detailed student profile for AI generation
    const athleteInfo = userProfile
      ? {
          name: `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim(),
          sport: userProfile.sport || "",
          position: userProfile.position || "",
          graduationYear: userProfile.graduationYear || "",
          height: userProfile.height || "",
          keyStats: userProfile.keyStats || "",
          highlights: userProfile.highlights || "",
          gpa: userProfile.gpa || "",
          testScores: userProfile.testScores || "",
          academicHonors: userProfile.academicHonors || "",
          intendedMajor: userProfile.intendedMajor || "",
          bio: userProfile.bio || "",
        }
      : {};

    // Generate emails for each coach
    try {
      // Initialize array to store all promises
      const promises = [];

      for (const coach of selectedCoachesData) {
        const coachInfo = {
          name: `${coach.firstName} ${coach.lastName}`,
          school: coach.school,
          sport: coach.sport,
          division: coach.division || "",
          conference: coach.conference || "",
          position: coach.position || "",
        };

        const generationData = {
          ...data,
          userProfile: athleteInfo,
          coachInfo,
          coachId: coach.id,
        };

        // Store promise
        promises.push(
          apiRequest("POST", "/api/ai/generate-email", generationData)
            .then((res) => res.json())
            .then((result) => {
              // Store the result in our multipleEmails object
              newEmails[coach.id] = {
                subject: result.subject,
                body: result.body,
              };
            }),
        );
      }

      // Wait for all promises to complete
      await Promise.all(promises);

      // Update multiple emails state
      setMultipleEmails(newEmails);

      // Set current preview index to first coach
      if (selectedCoachesData.length > 0) {
        setCurrentCoachPreviewIndex(0);

        // Get ID of first coach
        const firstCoach = selectedCoachesData[0];

        // Set as preview coach
        setPreviewCoach(firstCoach);

        // Set form values to first coach's email
        if (newEmails[firstCoach.id]) {
          form.setValue("subject", newEmails[firstCoach.id].subject);
          form.setValue("body", newEmails[firstCoach.id].body);
        }
      }

      setGeneratingMultipleEmails(false);

      toast({
        title: "Emails Generated",
        description: `Created ${selectedCoachesData.length} personalized emails.`,
      });
    } catch (error) {
      setGeneratingMultipleEmails(false);
      setPreviewCoach(null);
      setMultipleEmails({});
      setCurrentCoachPreviewIndex(0);

      toast({
        title: "Generation Failed",
        description: "Failed to generate all emails. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigate to previous coach in multiple emails
  const handlePreviousCoachEmail = () => {
    const currentCoaches = Object.keys(multipleEmails).map(Number);
    if (currentCoaches.length > 0) {
      const newIndex =
        currentCoachPreviewIndex > 0
          ? currentCoachPreviewIndex - 1
          : currentCoaches.length - 1;

      setCurrentCoachPreviewIndex(newIndex);

      // Find coach data and update preview
      const coachId = currentCoaches[newIndex];
      const coach = [
        ...(filteredCoaches || []),
        ...(filteredSavedCoaches || []),
      ].find((c) => c.id === coachId);
      if (coach) {
        setPreviewCoach(coach);

        // Set form values
        if (multipleEmails[coachId]) {
          form.setValue("subject", multipleEmails[coachId].subject);
          form.setValue("body", multipleEmails[coachId].body);
        }
      }
    }
  };

  // Navigate to next coach in multiple emails
  const handleNextCoachEmail = () => {
    const currentCoaches = Object.keys(multipleEmails).map(Number);
    if (currentCoaches.length > 0) {
      const newIndex = (currentCoachPreviewIndex + 1) % currentCoaches.length;
      setCurrentCoachPreviewIndex(newIndex);

      // Find coach data and update preview
      const coachId = currentCoaches[newIndex];
      const coach = [
        ...(filteredCoaches || []),
        ...(filteredSavedCoaches || []),
      ].find((c) => c.id === coachId);
      if (coach) {
        setPreviewCoach(coach);

        // Set form values
        if (multipleEmails[coachId]) {
          form.setValue("subject", multipleEmails[coachId].subject);
          form.setValue("body", multipleEmails[coachId].body);
        }
      }
    }
  };

  // Handle form submission
  const onSubmit = (data: any) => {
    // Get coach IDs from input value
    const coachIds =
      selectedCoaches.length > 0
        ? selectedCoaches
        : previewCoach
          ? [previewCoach.id]
          : [];

    if (coachIds.length === 0) {
      toast({
        title: "No coaches selected",
        description: "Please select at least one coach to send an email to.",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      coachIds,
      subject: data.subject,
      body: data.body,
      status: data.isDraft ? "draft" : "sent",
      followUpDays: data.enableFollowUp ? data.followUpDays : undefined,
    };

    createEmailMutation.mutate(formData);
  };

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <MailCheck className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
          >
            <Save className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case "opened":
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <Mail className="h-3 w-3 mr-1" />
            Opened
          </Badge>
        );
      case "replied":
        return (
          <Badge
            variant="default"
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Mail className="h-3 w-3 mr-1" />
            Replied
          </Badge>
        );
      case "bounced":
        return (
          <Badge variant="destructive">
            <MailX className="h-3 w-3 mr-1" />
            Bounced
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Mail className="h-3 w-3 mr-1" />
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  if (coachesLoading || emailsLoading || userProfileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Email Outreach</h1>
          <p className="text-gray-600">
            Manage your outreach emails to coaches
          </p>
        </div>
        <Button
          onClick={() => setIsComposeOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Mail className="h-4 w-4 mr-2" />
          Compose New Email
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              All
              {emails?.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-muted text-muted-foreground"
                >
                  {emails.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="relative">
              Sent
              {emails?.filter(
                (email) =>
                  email.status === "sent" && email.direction === "outgoing",
              ).length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-800"
                >
                  {
                    emails.filter(
                      (email) =>
                        email.status === "sent" &&
                        email.direction === "outgoing",
                    ).length
                  }
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="relative">
              Received
              {emails?.filter((email) => email.direction === "inbound").length >
                0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-purple-100 text-purple-800"
                >
                  {
                    emails.filter((email) => email.direction === "inbound")
                      .length
                  }
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="follow-ups" className="relative">
              Follow-ups
              {emails?.filter((email) => email.isFollowUp === true).length >
                0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-amber-100 text-amber-800"
                >
                  {emails.filter((email) => email.isFollowUp === true).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="relative">
              Drafts
              {emails?.filter((email) => email.status === "draft").length >
                0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-100 text-blue-800"
                >
                  {emails.filter((email) => email.status === "draft").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Top pagination control - aligned right */}
          <div className="flex items-center ml-auto">
            {emails &&
              (activeTab === "all"
                ? emails.length > EMAILS_PER_PAGE && (
                    <Pagination className="ml-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (allEmailsPage > 1)
                                setAllEmailsPage(allEmailsPage - 1);
                            }}
                            className={
                              allEmailsPage <= 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>

                        <span className="flex items-center mx-2 text-sm text-muted-foreground">
                          Page {allEmailsPage} of {getTotalPages(emails.length)}
                        </span>

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (allEmailsPage < getTotalPages(emails.length))
                                setAllEmailsPage(allEmailsPage + 1);
                            }}
                            className={
                              allEmailsPage >= getTotalPages(emails.length)
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )
                : activeTab === "drafts"
                  ? emails.filter((email) => email.status === "draft").length >
                      EMAILS_PER_PAGE && (
                      <Pagination className="ml-auto">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (draftsPage > 1)
                                  setDraftsPage(draftsPage - 1);
                              }}
                              className={
                                draftsPage <= 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>

                          <span className="flex items-center mx-2 text-sm text-muted-foreground">
                            Page {draftsPage} of{" "}
                            {getTotalPages(
                              emails.filter((email) => email.status === "draft")
                                .length,
                            )}
                          </span>

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                const totalDraftsPages = getTotalPages(
                                  emails.filter(
                                    (email) => email.status === "draft",
                                  ).length,
                                );
                                if (draftsPage < totalDraftsPages)
                                  setDraftsPage(draftsPage + 1);
                              }}
                              className={
                                draftsPage >=
                                getTotalPages(
                                  emails.filter(
                                    (email) => email.status === "draft",
                                  ).length,
                                )
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )
                  : activeTab === "received"
                    ? emails.filter((email) => email.direction === "inbound")
                        .length > EMAILS_PER_PAGE && (
                        <Pagination className="ml-auto">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (receivedPage > 1)
                                    setReceivedPage(receivedPage - 1);
                                }}
                                className={
                                  receivedPage <= 1
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>

                            <span className="flex items-center mx-2 text-sm text-muted-foreground">
                              Page {receivedPage} of{" "}
                              {getTotalPages(
                                emails.filter(
                                  (email) => email.direction === "inbound",
                                ).length,
                              )}
                            </span>

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const totalReceivedPages = getTotalPages(
                                    emails.filter(
                                      (email) => email.direction === "inbound",
                                    ).length,
                                  );
                                  if (receivedPage < totalReceivedPages)
                                    setReceivedPage(receivedPage + 1);
                                }}
                                className={
                                  receivedPage >=
                                  getTotalPages(
                                    emails.filter(
                                      (email) => email.direction === "inbound",
                                    ).length,
                                  )
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )
                    : null)}
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {/* Email list content */}
          {emails?.length === 0 ? (
            <div className="mt-16 text-center space-y-4">
              <div className="rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No emails yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Start reaching out to coaches by creating your first email. You
                can manage all your outreach from this central dashboard.
              </p>
              <Button
                onClick={() => setIsComposeOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white mt-4"
              >
                <Mail className="h-4 w-4 mr-2" />
                Compose New Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {emails &&
                getPaginatedEmails(emails, allEmailsPage).map((email: any) => (
                  <Card key={email.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="font-medium">
                            {email.subject || "No Subject"}{" "}
                            <span className="text-muted-foreground text-sm font-normal">
                              to{" "}
                              {coaches?.find((c) => c.id === email.coachId)
                                ? `${coaches.find((c) => c.id === email.coachId).firstName} ${coaches.find((c) => c.id === email.coachId).lastName}`
                                : "Unknown Coach"}
                            </span>
                          </h3>

                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {getStatusBadge(email.status)}

                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {formatDate(email.createdAt)}
                            </div>

                            {email.lastOpened && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Opened {formatDate(email.lastOpened)}
                              </div>
                            )}
                          </div>

                          <p className="mt-2 text-sm line-clamp-2">
                            {email.body || "No content"}
                          </p>
                          {email.direction === "outbound" && (
                            <div className="mt-2">
                              {email.hasResponded ? (
                                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  Responded
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs italic rounded">
                                  No response
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View email details
                              console.log(
                                "View button clicked from master All tab. Email:",
                                email,
                              );
                              setSelectedEmail(email as EmailType);
                              setIsViewEmailOpen(true);
                            }}
                          >
                            View
                          </Button>

                          {email.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Edit draft - open compose modal with draft data
                                console.log(
                                  "Edit button clicked from main All tab. Email:",
                                  email,
                                );
                                if (coaches) {
                                  const coach = coaches.find(
                                    (c) => c.id === email.coachId,
                                  );
                                  console.log(
                                    "Found coach for editing:",
                                    coach,
                                  );

                                  if (coach) {
                                    // Pre-fill the form with draft data
                                    form.reset({
                                      subject: email.subject,
                                      body: email.body,
                                      enableFollowUp: email.followUpDays
                                        ? true
                                        : false,
                                      followUpDays: email.followUpDays || 5,
                                    });

                                    // Set the coach as selected and preview coach
                                    setSelectedCoaches([coach.id]);
                                    setPreviewCoach(coach);

                                    // Open the compose modal
                                    setIsComposeOpen(true);
                                  } else {
                                    toast({
                                      title: "Error",
                                      description:
                                        "Could not find the coach associated with this email",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              Edit
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Email?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete this email and remove it
                                  from your record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteEmailMutation.mutate(email.id)
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* Pagination for All tab */}
              {emails && emails.length > EMAILS_PER_PAGE && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (allEmailsPage > 1)
                            setAllEmailsPage(allEmailsPage - 1);
                        }}
                        className={
                          allEmailsPage <= 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    <span className="flex items-center mx-2 text-sm text-muted-foreground">
                      Page {allEmailsPage} of {getTotalPages(emails.length)}
                    </span>

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (allEmailsPage < getTotalPages(emails.length))
                            setAllEmailsPage(allEmailsPage + 1);
                        }}
                        className={
                          allEmailsPage >= getTotalPages(emails.length)
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {/* Sent emails content */}
          {emails?.filter((email) => email.status === "sent").length === 0 ? (
            <div className="mt-16 text-center space-y-4">
              <div className="rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto">
                <SendIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No sent emails</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Emails you send will appear here
              </p>
              <Button className="mt-2" onClick={() => setIsComposeOpen(true)}>
                <PencilLine className="h-4 w-4 mr-2" />
                Compose New Email
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {emails
                ?.filter((email) => email.status === "sent")
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((email) => (
                  <Card
                    key={email.id}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-5">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold truncate pr-4">
                            {email.subject || "No subject"}
                            <span className="text-muted-foreground text-sm font-normal ml-2">
                              to{" "}
                              {coaches?.find((c) => c.id === email.coachId)
                                ? `${coaches.find((c) => c.id === email.coachId).firstName} ${coaches.find((c) => c.id === email.coachId).lastName}`
                                : "Unknown Coach"}
                            </span>
                          </h4>

                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {getStatusBadge(email.status)}

                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {formatDate(email.createdAt)}
                            </div>

                            {email.lastOpened && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Opened {formatDate(email.lastOpened)}
                              </div>
                            )}
                          </div>

                          <p className="mt-2 text-sm line-clamp-2">
                            {email.body || "No content"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // View email
                              console.log(
                                "View button clicked from Sent tab. Email:",
                                email,
                              );
                              setSelectedEmail(email as EmailType);
                              setIsViewEmailOpen(true);
                            }}
                          >
                            View
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Email
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this email?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => {
                                    console.log(
                                      "Delete button clicked from Sent tab. Email ID:",
                                      email.id,
                                    );
                                    deleteEmailMutation.mutate(email.id);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {/* Received emails content */}
          {!emails?.filter((email) => email.direction === "inbound").length ? (
            <div className="mt-16 text-center space-y-4">
              <div className="rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto">
                <HelpCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No received emails</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                When coaches respond to your outreach emails, their replies will
                appear here. Keep reaching out to increase your chances of
                responses.
              </p>
              <Button
                onClick={() => setIsComposeOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white mt-4"
              >
                <Mail className="h-4 w-4 mr-2" />
                Compose New Email
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {(emails as any[])
                ?.filter((email) => email.direction === "inbound")
                .sort(
                  (a, b) =>
                    new Date(b.receivedAt || b.sentAt).getTime() -
                    new Date(a.receivedAt || a.sentAt).getTime(),
                )
                .map((email) => {
                  const coach = coaches?.find((c) => c.id === email.coachId);
                  return (
                    <ReceivedEmails
                      key={email.id}
                      email={email}
                      coach={coach}
                      userProfile={userProfile}
                      filteredCoaches={filteredCoaches}
                      getStatusBadge={getStatusBadge}
                    />
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="follow-ups" className="space-y-4">
          {/* Follow-ups content */}
          {emails?.filter((email) => email.isFollowUp === true).length === 0 ? (
            <div className="mt-16 text-center space-y-4">
              <div className="rounded-full bg-amber-100 w-20 h-20 flex items-center justify-center mx-auto">
                <PlusCircle className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium">No follow-up emails yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Follow-up emails you send to coaches will appear here. Enable
                follow-ups when composing emails to coaches.
              </p>
              <Button className="mt-2" onClick={() => setIsComposeOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Compose New Email
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {emails &&
                emails
                  .filter((email) => email.isFollowUp === true)
                  .sort(
                    (a, b) =>
                      new Date(b.sentAt).getTime() -
                      new Date(a.sentAt).getTime(),
                  )
                  .map((email) => (
                    <Card
                      key={email.id}
                      className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-400"
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col space-y-4">
                          {/* Header with subject and actions */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <h4 className="text-lg font-semibold pr-3">
                                {email.subject || "No subject"}
                              </h4>
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800"
                              >
                                <PlusCircle className="h-3 w-3 mr-1" />
                                Follow-up
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmail(email as EmailType);
                                  setIsViewEmailOpen(true);
                                }}
                              >
                                View
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Follow-up Email
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      follow-up email? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-500 hover:bg-red-600"
                                      onClick={() => {
                                        deleteEmailMutation.mutate(email.id);
                                      }}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {/* Coach info */}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">
                              To:{" "}
                              {coaches?.find((c) => c.id === email.coachId)
                                ? `${coaches.find((c) => c.id === email.coachId).firstName} ${coaches.find((c) => c.id === email.coachId).lastName}`
                                : "Unknown Coach"}
                              {coaches?.find((c) => c.id === email.coachId)
                                ?.school && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  (
                                  {
                                    coaches.find((c) => c.id === email.coachId)
                                      .school
                                  }
                                  )
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Date sent */}
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Sent on {formatDate(email.sentAt)}
                            </span>
                          </div>

                          {/* Email preview */}
                          <div className="bg-gray-50 rounded-md py-3 px-4 border border-gray-100">
                            <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-line">
                              {email.body || "No content"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {/* Drafts content */}
          {emails?.filter((email) => email.status === "draft").length === 0 ? (
            <div className="mt-16 text-center space-y-4">
              <div className="rounded-full bg-muted w-20 h-20 flex items-center justify-center mx-auto">
                <PencilLine className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No draft emails</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Save emails as drafts to edit and send later
              </p>
              <Button className="mt-2" onClick={() => setIsComposeOpen(true)}>
                <PencilLine className="h-4 w-4 mr-2" />
                Create New Draft
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {emails &&
                getPaginatedEmails(
                  emails
                    .filter((email) => email.status === "draft")
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    ),
                  draftsPage,
                ).map((email) => (
                  <Card
                    key={email.id}
                    className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-400"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col space-y-4">
                        {/* Header with subject and actions */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <h4 className="text-lg font-semibold pr-3">
                              {email.subject || "No subject"}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "View button clicked from Drafts tab. Email:",
                                  email,
                                );
                                setSelectedEmail(email as EmailType);
                                setIsViewEmailOpen(true);
                              }}
                              className="bg-gray-50 hover:bg-gray-100"
                            >
                              <MailOpen className="h-3.5 w-3.5 mr-1.5" />
                              View
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log(
                                  "Edit button clicked from Drafts tab. Email:",
                                  email,
                                );
                                if (coaches) {
                                  const coach = coaches.find(
                                    (c) => c.id === email.coachId,
                                  );
                                  console.log(
                                    "Found coach for editing:",
                                    coach,
                                  );

                                  if (coach) {
                                    // Pre-fill the form with draft data
                                    form.reset({
                                      subject: email.subject,
                                      body: email.body,
                                      enableFollowUp: email.followUpDays
                                        ? true
                                        : false,
                                      followUpDays: email.followUpDays || 5,
                                    });

                                    // Set the coach as selected and preview coach
                                    setSelectedCoaches([coach.id]);
                                    setPreviewCoach(coach);

                                    // Open the compose modal
                                    setIsComposeOpen(true);
                                  } else {
                                    toast({
                                      title: "Error",
                                      description:
                                        "Could not find the coach associated with this email",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            >
                              <PencilLine className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Draft Email
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this draft
                                    email? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => {
                                      // Delete the email
                                      deleteEmailMutation.mutate(email.id);
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center text-gray-600">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                            {formatDate(email.createdAt)}
                          </div>

                          {coaches && (
                            <div className="flex items-center text-gray-600">
                              <UserRound className="h-3.5 w-3.5 mr-1.5" />
                              {(() => {
                                const coach = coaches.find(
                                  (c) => c.id === email.coachId,
                                );
                                return coach
                                  ? `${coach.firstName} ${coach.lastName}`
                                  : "Unknown Coach";
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Email body */}
                        <div className="bg-gray-50 rounded-md py-4 px-5 border border-gray-100">
                          <div className="border-l-2 border-blue-200 pl-4">
                            <p className="text-sm text-gray-700 line-clamp-6 whitespace-pre-line">
                              {email.body || "No content"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* Pagination for Drafts tab */}
              {emails &&
                emails.filter((email) => email.status === "draft").length >
                  EMAILS_PER_PAGE && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (draftsPage > 1) setDraftsPage(draftsPage - 1);
                          }}
                          className={
                            draftsPage <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      <span className="flex items-center mx-2 text-sm text-muted-foreground">
                        Page {draftsPage} of{" "}
                        {getTotalPages(
                          emails.filter((email) => email.status === "draft")
                            .length,
                        )}
                      </span>

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const totalDraftsPages = getTotalPages(
                              emails.filter((email) => email.status === "draft")
                                .length,
                            );
                            if (draftsPage < totalDraftsPages)
                              setDraftsPage(draftsPage + 1);
                          }}
                          className={
                            draftsPage >=
                            getTotalPages(
                              emails.filter((email) => email.status === "draft")
                                .length,
                            )
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Compose Email Dialog */}

      {/* Main Compose Dialog */}
      <Dialog
        open={isComposeOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Reset state when dialog is closed
            setSelectedCoaches([]);
            setPreviewCoach(null);
            setMultipleEmails({});
            form.reset({
              subject: "",
              body: "",
              enableFollowUp: false,
              followUpDays: 5,
            });
          }
          setIsComposeOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
          {/* New Cleaner Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-1.5 border-b">
            <h2 className="text-base font-semibold text-primary/90 flex items-center">
              <PenSquare className="h-3.5 w-3.5 mr-1.5" />
              New Message
            </h2>
          </div>

          <div className="p-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Coach Selection */}
            <div className="lg:col-span-1 space-y-2">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8 mb-1 shadow-sm">
                  <TabsTrigger value="all" className="shadow-none">
                    All Coaches
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="shadow-none">
                    Saved Coaches
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0 pt-0">
                  <div className="space-y-2 mt-3">
                    {userProfile?.sport && (
                      <div className="flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium mr-1.5">
                          FILTERED
                        </span>
                        <span className="text-xs text-blue-700 font-medium">
                          {userProfile.sport} Coaches Only
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Search coaches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-[260px] mt-2 rounded-md border">
                    <div className="space-y-1 p-1">
                      {filteredCoaches?.map((coach: Coach) => (
                        <div
                          key={coach.id}
                          className="flex items-start p-2.5 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-all"
                        >
                          <Checkbox
                            className="mt-1"
                            checked={selectedCoaches.includes(coach.id)}
                            onCheckedChange={(checked) =>
                              handleCoachCheckbox(coach.id, !!checked)
                            }
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900">
                              {coach.firstName} {coach.lastName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {coach.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="text-xs text-gray-700 font-medium">
                                {coach.school}
                              </div>
                            </div>
                          </div>
                          {/* Keep the Preview button for all coaches tab */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleSelectPreviewCoach(coach)}
                          >
                            Preview
                          </Button>
                        </div>
                      ))}

                      {filteredCoaches?.length === 0 && (
                        <div className="py-6 text-center text-gray-500 text-sm">
                          No coaches match your filters
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="mt-5">
                    <Button
                      type="button"
                      disabled={
                        generatingMultipleEmails ||
                        selectedCoaches.length === 0 ||
                        selectedCoaches.length > 5
                      }
                      onClick={() => {
                        // Create a list of selected coaches from the all coaches tab
                        const selectedAllCoaches = selectedCoaches
                          .map((id) =>
                            filteredCoaches.find((coach) => coach.id === id),
                          )
                          .filter(Boolean);

                        if (selectedAllCoaches.length === 0) {
                          toast({
                            title: "No coaches selected",
                            description:
                              "Please select at least one coach to generate emails.",
                            variant: "destructive",
                          });
                          return;
                        }

                        handleGenerateMultipleEmails(aiForm.getValues());
                      }}
                      className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary h-10 flex items-center justify-center"
                    >
                      {generatingMultipleEmails ? (
                        <>
                          <span className="animate-spin mr-2 flex-shrink-0">
                            ⟳
                          </span>
                          <span>Generating Emails...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>
                            Generate{" "}
                            {selectedCoaches.length > 0
                              ? `${selectedCoaches.length} `
                              : ""}
                            Personalized Emails
                          </span>
                        </>
                      )}
                    </Button>
                    {selectedCoaches.length > 5 && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        You can only generate emails for up to 5 coaches at
                        once.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="saved" className="mt-0 pt-0">
                  <div className="space-y-2 mt-3">
                    {userProfile?.sport && (
                      <div className="flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium mr-1.5">
                          FILTERED
                        </span>
                        <span className="text-xs text-blue-700 font-medium">
                          {userProfile.sport} Coaches Only
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Search saved coaches..."
                        value={savedCoachesSearchQuery}
                        onChange={(e) =>
                          setSavedCoachesSearchQuery(e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-[260px] mt-2 rounded-md border">
                    {savedCoachesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                      </div>
                    ) : (
                      <div className="space-y-1 p-1">
                        {filteredSavedCoaches?.map((coach: Coach) => (
                          <div
                            key={coach.id}
                            className="flex items-start p-2.5 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-all"
                          >
                            <Checkbox
                              className="mt-1"
                              checked={selectedCoaches.includes(coach.id)}
                              onCheckedChange={(checked) =>
                                handleCoachCheckbox(coach.id, !!checked)
                              }
                            />
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-900">
                                {coach.firstName} {coach.lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {coach.email}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="text-xs text-gray-700 font-medium">
                                  {coach.school}
                                </div>
                              </div>
                            </div>
                            {/* Removed preview button for saved coaches */}
                          </div>
                        ))}

                        {filteredSavedCoaches?.length === 0 && (
                          <div className="py-6 text-center text-gray-500 text-sm">
                            No saved coaches found
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="mt-5">
                    <Button
                      type="button"
                      disabled={
                        generatingMultipleEmails ||
                        selectedCoaches.length === 0 ||
                        selectedCoaches.length > 5
                      }
                      onClick={() =>
                        handleGenerateMultipleEmails(aiForm.getValues())
                      }
                      className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary h-10 flex items-center justify-center"
                    >
                      {generatingMultipleEmails ? (
                        <>
                          <span className="animate-spin mr-2 flex-shrink-0">
                            ⟳
                          </span>
                          <span>Generating Emails...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>
                            Generate{" "}
                            {selectedCoaches.length > 0
                              ? `${selectedCoaches.length} `
                              : ""}
                            Personalized Emails
                          </span>
                        </>
                      )}
                    </Button>
                    {selectedCoaches.length > 5 && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        You can only generate emails for up to 5 coaches at
                        once.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <input
                type="hidden"
                value={selectedCoaches.join(",")}
                onChange={(e) => form.setValue("coachIds", e.target.value)}
              />
            </div>

            {/* Right Column - Email Compose */}
            <div className="lg:col-span-2">
              <div className="space-y-5">
                {Object.keys(multipleEmails).length > 0 && (
                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousCoachEmail}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-xs font-medium mx-2 whitespace-nowrap">
                      Email {currentCoachPreviewIndex + 1} of{" "}
                      {Object.keys(multipleEmails).length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextCoachEmail}
                      className="h-8 px-3"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Modern, cleaner email form */}
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  {/* To field with pill design for recipients */}
                  <div className="border-b p-3">
                    <div className="flex items-center">
                      <AtSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium mr-2">
                        To:
                      </span>
                      <div className="flex-1">
                        {previewCoach ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {previewCoach.firstName} {previewCoach.lastName}
                            <span className="ml-1 text-gray-500">
                              &lt;{previewCoach.email}&gt;
                            </span>
                          </div>
                        ) : selectedCoaches.length > 0 ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {selectedCoaches.length} selected coaches
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No recipients selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subject field with clean separator */}
                  <div className="border-b p-3">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 font-medium mr-2">
                        Subject:
                      </span>
                      <Input
                        {...form.register("subject")}
                        placeholder="Write a compelling subject line"
                        className="border-none shadow-none focus-visible:ring-0 flex-1 p-0 h-6 text-sm"
                      />
                    </div>
                  </div>

                  {/* Message body with clean styling */}
                  <div className="p-3">
                    <Textarea
                      {...form.register("body")}
                      placeholder="Write your personalized message…"
                      className="border-none h-[230px] resize-none focus-visible:ring-0 p-0 text-sm"
                    />
                  </div>
                </div>

                {/* Modern follow-up section with card design */}
                <div className="mt-2.5">
                  <div
                    className={`rounded-lg border ${form.watch("enableFollowUp") ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"} overflow-hidden transition-colors duration-300 ease-in-out`}
                  >
                    <div className="p-3 flex items-center">
                      <div className="flex items-center flex-1">
                        <Clock3
                          className={`h-4 w-4 mr-2 ${form.watch("enableFollowUp") ? "text-blue-500" : "text-gray-400"}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Checkbox
                              id="enable-follow-up"
                              className={
                                form.watch("enableFollowUp")
                                  ? "text-blue-500 border-blue-400"
                                  : ""
                              }
                              checked={form.watch("enableFollowUp")}
                              onCheckedChange={(checked) => {
                                form.setValue("enableFollowUp", !!checked);
                                if (checked && !form.getValues().followUpDays) {
                                  form.setValue("followUpDays", 3);
                                }
                              }}
                            />
                            <Label
                              htmlFor="enable-follow-up"
                              className={`ml-2 text-sm font-medium ${form.watch("enableFollowUp") ? "text-blue-700" : "text-gray-700"}`}
                            >
                              Schedule automatic follow-up
                            </Label>
                          </div>

                          {form.watch("enableFollowUp") && (
                            <p className="text-xs text-blue-600 ml-6 mt-1">
                              A follow-up email will be sent if no response is
                              received
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Always render the days selector but change style based on state */}
                      <div
                        className={`flex items-center transition-opacity duration-200 ${form.watch("enableFollowUp") ? "opacity-100" : "opacity-40"}`}
                      >
                        <div
                          className={`flex items-center px-2 py-1 rounded-full ${form.watch("enableFollowUp") ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}
                        >
                          <span className="text-xs mr-1">after</span>
                          <Select
                            value={String(form.watch("followUpDays") || 3)}
                            onValueChange={(value) =>
                              form.setValue("followUpDays", parseInt(value))
                            }
                            disabled={!form.watch("enableFollowUp")}
                          >
                            <SelectTrigger
                              className={`w-[80px] h-6 text-xs border-none bg-transparent focus:ring-0 ${!form.watch("enableFollowUp") ? "opacity-50" : ""}`}
                            >
                              <SelectValue placeholder="3 days" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((days) => (
                                <SelectItem key={days} value={days.toString()}>
                                  {days} {days === 1 ? "day" : "days"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redesigned modern action buttons with fixed heights and consistent spacing */}
                <div className="flex justify-between mt-4 py-2.5 border-t">
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      onClick={() => setIsComposeOpen(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>

                  {/* Modern, consistent button group with smooth hover effects */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 w-[140px] transition-colors"
                      onClick={() => {
                        const formValues = form.getValues();

                        // Check if we are in personalized email mode with multiple emails
                        if (Object.keys(multipleEmails).length > 0) {
                          // Save drafts for all coaches that have personalized emails
                          const coachIds = Object.keys(multipleEmails);

                          // Update the current preview email content in multipleEmails if needed
                          if (previewCoach) {
                            multipleEmails[previewCoach.id] = {
                              ...multipleEmails[previewCoach.id],
                              subject: formValues.subject,
                              body: formValues.body,
                            };
                          }

                          // Save each personalized email as a draft
                          for (const coachId of coachIds) {
                            const coach = coaches?.find(
                              (c) => c.id === Number(coachId),
                            );
                            if (!coach) continue;

                            const emailData = {
                              coachIds: [Number(coachId)],
                              subject: multipleEmails[coachId].subject,
                              body: multipleEmails[coachId].body,
                              isDraft: true,
                              status: "draft",
                              followUpDays: formValues.enableFollowUp
                                ? formValues.followUpDays
                                : undefined,
                              enableFollowUp: formValues.enableFollowUp,
                            };

                            // Use the mutation to save draft
                            createEmailMutation.mutate(emailData);
                          }

                          // Show toast to confirm saving
                          toast({
                            title: "Drafts saved",
                            description: `Saved ${coachIds.length} personalized email draft${coachIds.length > 1 ? "s" : ""}.`,
                          });
                        } else {
                          // Regular draft saving for non-personalized emails
                          const emailData = {
                            coachIds: selectedCoaches,
                            subject: formValues.subject,
                            body: formValues.body,
                            isDraft: true,
                            status: "draft",
                            followUpDays: formValues.enableFollowUp
                              ? formValues.followUpDays
                              : undefined,
                            enableFollowUp: formValues.enableFollowUp,
                          };

                          // Use the mutation to save draft
                          createEmailMutation.mutate(emailData);
                        }
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>

                    {/* Middle button - using fixed width and conditionally showing content */}
                    {Object.keys(multipleEmails).length > 0 && previewCoach ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 w-[180px] px-4"
                        onClick={() => {
                          if (!previewCoach) return;

                          // Get current form values for the displayed email
                          const formValues = form.getValues();

                          // Send the current personalized email
                          const values = {
                            coachIds: [previewCoach.id],
                            subject: formValues.subject,
                            body: formValues.body,
                            isDraft: false,
                            status: "sent",
                            followUpDays: formValues.enableFollowUp
                              ? formValues.followUpDays
                              : undefined,
                            enableFollowUp: formValues.enableFollowUp,
                          };

                          createEmailMutation.mutate(values);
                        }}
                      >
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Current Email
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white w-[180px] px-4"
                        onClick={() => {
                          const values = form.getValues();
                          values.isDraft = false;
                          onSubmit(values);
                        }}
                      >
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Now
                      </Button>
                    )}

                    {/* Fixed width "Send All" button */}
                    <Button
                      type="button"
                      className={`${
                        Object.keys(multipleEmails).length > 1
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"
                      } text-white w-[130px] px-4`}
                      disabled={Object.keys(multipleEmails).length <= 1}
                      onClick={() => {
                        // Send all emails
                        const coachIds =
                          Object.keys(multipleEmails).map(Number);

                        if (coachIds.length <= 1) {
                          return;
                        }

                        // Create a batch of emails
                        Promise.all(
                          coachIds.map((coachId) => {
                            const formValues = form.getValues();

                            // If this is the current coach in preview, use the form values
                            // (which might have been edited) instead of the stored values
                            const useCurrentFormValues =
                              previewCoach && previewCoach.id === coachId;

                            const values = {
                              coachIds: [coachId],
                              subject: useCurrentFormValues
                                ? formValues.subject
                                : multipleEmails[coachId]?.subject || "",
                              body: useCurrentFormValues
                                ? formValues.body
                                : multipleEmails[coachId]?.body || "",
                              isDraft: false,
                              status: "sent",
                              followUpDays: formValues.enableFollowUp
                                ? formValues.followUpDays
                                : undefined,
                              enableFollowUp: formValues.enableFollowUp,
                            };

                            return apiRequest("POST", "/api/emails", values);
                          }),
                        )
                          .then(() => {
                            queryClient.invalidateQueries({
                              queryKey: ["/api/emails"],
                            });
                            setIsComposeOpen(false);
                            setMultipleEmails({});
                            setPreviewCoach(null);

                            toast({
                              title: "Success!",
                              description: `${coachIds.length} emails have been sent successfully.`,
                            });
                          })
                          .catch((error) => {
                            toast({
                              title: "Error",
                              description:
                                "Failed to send emails. Please try again.",
                              variant: "destructive",
                            });
                          });
                      }}
                    >
                      <SendIcon className="h-4 w-4 mr-2" />
                      Send All{" "}
                      {Object.keys(multipleEmails).length > 0
                        ? `(${Object.keys(multipleEmails).length})`
                        : ""}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Email Dialog */}
      <Dialog open={isViewEmailOpen} onOpenChange={setIsViewEmailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              View Email
            </DialogTitle>
            <DialogDescription>Email details</DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedEmail.status)}
                  {selectedEmail.createdAt && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {formatDate(selectedEmail.createdAt)}
                    </div>
                  )}
                </div>

                {selectedEmail.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Edit the draft
                      if (coaches) {
                        const coach = coaches.find(
                          (c) => c.id === selectedEmail.coachId,
                        );
                        console.log("Found coach for editing:", coach);

                        if (coach) {
                          // Pre-fill the form with draft data
                          form.reset({
                            subject: selectedEmail.subject,
                            body: selectedEmail.body,
                            enableFollowUp: selectedEmail.followUpDays
                              ? true
                              : false,
                            followUpDays: selectedEmail.followUpDays || 5,
                          });

                          // Set the coach as selected and preview coach
                          setSelectedCoaches([coach.id]);
                          setPreviewCoach(coach);

                          // Close view dialog and open compose dialog
                          setIsViewEmailOpen(false);
                          setIsComposeOpen(true);
                        } else {
                          toast({
                            title: "Error",
                            description:
                              "Could not find the coach associated with this email",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    <PencilLine className="h-4 w-4 mr-2" />
                    Edit Draft
                  </Button>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-1">
                  {selectedEmail.subject || "No Subject"}
                </h3>

                {/* Coach information */}
                {coaches && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <div>
                      {coaches.some((c) => c.id === selectedEmail.coachId) ? (
                        <>
                          <p className="text-sm font-medium">
                            To:{" "}
                            {(() => {
                              const coach = coaches.find(
                                (c) => c.id === selectedEmail.coachId,
                              );
                              return coach
                                ? `${coach.firstName} ${coach.lastName} (${coach.school})`
                                : "Unknown Coach";
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const coach = coaches.find(
                                (c) => c.id === selectedEmail.coachId,
                              );
                              return coach?.email || "No email available";
                            })()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Coach information not available
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Email body */}
                <div className="mt-4 text-sm whitespace-pre-wrap">
                  {selectedEmail.body || "No content"}
                </div>

                {/* Follow-up info if applicable */}
                {selectedEmail.followUpDays && (
                  <div className="mt-5 pt-3 border-t text-sm text-muted-foreground">
                    <p className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Follow-up scheduled in {selectedEmail.followUpDays} days
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            {selectedEmail?.status === "draft" && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedEmail) {
                    deleteEmailMutation.mutate(selectedEmail.id);
                    setIsViewEmailOpen(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Draft
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewEmailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <GmailPrompt
        open={showGmailPrompt}
        onClose={() => setShowGmailPrompt(false)}
      />
    </div>
  );
}
