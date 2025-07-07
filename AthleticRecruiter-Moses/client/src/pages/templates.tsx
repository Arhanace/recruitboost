import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { createEmailBody } from "@/lib/utils";
import { Coach, EmailTemplate } from "@shared/schema";
import { 
  FileTextIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon,
  CheckCircleIcon,
  Sparkles,
  RefreshCw,
  MailIcon,
  AlertCircle
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Form schema for email templates
// Form schema for email templates
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Template body is required"),
  isDefault: z.boolean().default(false),
});

// Form schema for AI email generator
const aiGeneratorSchema = z.object({
  sportInfo: z.string().min(1, "Sport information is required"),
  studentInfo: z.string().min(1, "Student information is required"),
  coachDetails: z.string().optional(),
  tone: z.enum(["professional", "friendly", "enthusiastic", "formal"]).default("professional"),
  name: z.string().min(1, "Template name is required"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;
type AIGeneratorValues = z.infer<typeof aiGeneratorSchema>;

export default function Templates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [aiResponse, setAIResponse] = useState<{ subject: string; body: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch email templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/email-templates"],
  });

  // Fetch coaches for preview
  const { data: coaches } = useQuery({
    queryKey: ["/api/coaches"],
  });

  // Setup form
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      isDefault: false,
    }
  });

  // Create mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormValues) => {
      return apiRequest("POST", "/api/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      
      toast({
        title: "Template Created",
        description: "Your email template has been successfully created.",
      });
      
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormValues & { id: number }) => {
      return apiRequest("PUT", `/api/email-templates/${data.id}`, {
        name: data.name,
        subject: data.subject,
        body: data.body,
        isDefault: data.isDefault,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      
      toast({
        title: "Template Updated",
        description: "Your email template has been successfully updated.",
      });
      
      setIsDialogOpen(false);
      form.reset();
      setSelectedTemplate(null);
      setIsEditMode(false);
    },
    onError: (error) => {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: number) => {
      return apiRequest("DELETE", `/api/email-templates/${templateId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      
      toast({
        title: "Template Deleted",
        description: "Your email template has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: TemplateFormValues) => {
    if (isEditMode && selectedTemplate) {
      updateTemplateMutation.mutate({
        ...data,
        id: selectedTemplate.id,
      });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  // Edit template
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditMode(true);
    
    form.reset({
      name: template.name,
      subject: template.subject,
      body: template.body,
      isDefault: template.isDefault,
    });
    
    setIsDialogOpen(true);
  };

  // Handle dialog open/close
  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setSelectedTemplate(null);
      setIsEditMode(false);
      setPreviewMode(false);
      setIsUsingAI(false);
      setAIResponse(null);
      setAIError(null);
    }
    setIsDialogOpen(open);
  };
  
  // Set up AI generator form
  const aiForm = useForm<AIGeneratorValues>({
    resolver: zodResolver(aiGeneratorSchema),
    defaultValues: {
      sportInfo: "",
      studentInfo: "",
      coachDetails: "",
      tone: "professional",
      name: "",
    }
  });
  
  // AI Email Generation Mutation
  const generateEmailMutation = useMutation<
    { subject: string; body: string },
    Error,
    Omit<AIGeneratorValues, "name">
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/generate-email", data);
      if (!response || typeof response !== 'object' || !('subject' in response) || !('body' in response)) {
        throw new Error('Invalid response format from AI generation');
      }
      return response as { subject: string; body: string };
    },
    onSuccess: (data: { subject: string; body: string }) => {
      setAIResponse(data);
      setIsGenerating(false);
      setAIError(null);
      
      // Set the data in the main form
      form.setValue("subject", data.subject);
      form.setValue("body", data.body);
      form.setValue("name", aiForm.getValues("name"));
      
      toast({
        title: "AI Email Generated",
        description: "Your personalized email template has been successfully generated.",
      });
    },
    onError: (error: any) => {
      console.error("Error generating AI email:", error);
      setIsGenerating(false);
      
      if (error.response?.data?.needsApiKey) {
        setAIError("API key required. Please contact the administrator to set up the Anthropic API key.");
      } else {
        setAIError("Failed to generate email. Please try again with more detailed information.");
      }
      
      toast({
        title: "Error",
        description: "Failed to generate AI email. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle AI form submission
  const handleGenerateAI = (data: AIGeneratorValues) => {
    setIsGenerating(true);
    setAIError(null);
    generateEmailMutation.mutate({
      sportInfo: data.sportInfo,
      studentInfo: data.studentInfo,
      coachDetails: data.coachDetails,
      tone: data.tone
    });
  };
  
  // Toggle between normal and AI mode
  const toggleAIMode = () => {
    setIsUsingAI(!isUsingAI);
    if (!isUsingAI) {
      // If switching to AI mode, make sure name is synced
      aiForm.setValue("name", form.getValues("name"));
    }
  };

  // Handle preview toggle
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Get sample preview data with placeholders replaced
  const getPreviewBody = () => {
    if (!coaches || coaches.length === 0) {
      return form.getValues("body");
    }
    
    const sampleCoach = coaches[0];
    const placeholders = {
      firstName: sampleCoach.firstName,
      lastName: sampleCoach.lastName,
      school: sampleCoach.school,
      sport: sampleCoach.sport,
    };
    
    return createEmailBody(form.getValues("body"), placeholders);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Email Writer</h1>
          <p className="text-gray-600">Create personalized emails with AI assistance</p>
        </div>
        <Button onClick={() => {
          setIsEditMode(false);
          form.reset({
            name: "",
            subject: "",
            body: "",
            isDefault: false,
          });
          setIsDialogOpen(true);
        }}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New AI Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template: EmailTemplate) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.subject}
                        </CardDescription>
                      </div>
                      {template.isDefault && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Default
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-4 whitespace-pre-wrap">
                      {template.body}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{template.name}" template.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <FileTextIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No AI email templates yet</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  Use AI assistance to craft compelling emails to coaches.
                  Create templates with placeholders like {'{{firstName}}'} to personalize your outreach.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Your First AI Template
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit AI Email Template" : "Create AI Email Template"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update your AI-powered email template details" 
                : "Create a new AI-powered email template to streamline your outreach"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="edit" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Initial Contact" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., High School Athlete Introduction - Basketball Prospect" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={"Dear Coach {{lastName}},\n\nI'm a high school athlete interested in your program at {{school}}..."}
                            className="min-h-[300px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Use {'{{firstName}}'}, {'{{lastName}}'}, {'{{school}}'}, etc. as placeholders that will be automatically replaced.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!isEditMode && (
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-medium">AI Assistance</h3>
                        <p className="text-sm text-gray-500">
                          Let AI help you craft the perfect email
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant={isUsingAI ? "default" : "outline"}
                        onClick={toggleAIMode}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isUsingAI ? "Using AI" : "Use AI"}
                      </Button>
                    </div>
                  )}

                  {isUsingAI && !isEditMode && (
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                        <h3 className="font-medium">AI Email Generator</h3>
                      </div>
                      
                      {aiError && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{aiError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Form {...aiForm}>
                        <form onSubmit={aiForm.handleSubmit(handleGenerateAI)} className="space-y-4">
                          <FormField
                            control={aiForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Template Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., AI Coach Outreach" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={aiForm.control}
                            name="sportInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Sport Details</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe your sport, position, achievements, stats, etc." 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Example: "I'm a junior basketball point guard averaging 18 points, 7 assists per game with a 40% 3-point shooting percentage."
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={aiForm.control}
                            name="studentInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Academic & Personal Information</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Share your academic achievements, extracurriculars, GPA, etc." 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Example: "3.8 GPA, 1320 SAT, volunteer basketball coach for youth, interested in business major"
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={aiForm.control}
                            name="coachDetails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Coach & Program Information (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Any specific information about the coach or program you'd like to mention" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Example: "I admire your team's fast-paced offense and watched your conference championship win last year"
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={aiForm.control}
                            name="tone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Tone</FormLabel>
                                <FormControl>
                                  <RadioGroup 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    className="flex flex-wrap gap-3"
                                  >
                                    <FormItem className="flex items-center space-x-1 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="professional" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        Professional
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-1 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="friendly" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        Friendly
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-1 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="enthusiastic" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        Enthusiastic
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-1 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="formal" />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        Formal
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full gap-2"
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating Email...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Generate AI Email
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Set as Default</FormLabel>
                          <FormDescription>
                            Make this the default template for new emails
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Subject:</h3>
                      <p className="mt-1">{form.getValues("subject")}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Body:</h3>
                      <div className="mt-1 whitespace-pre-wrap border-t pt-3">
                        {getPreviewBody()}
                      </div>
                    </div>
                    
                    <div className="pt-2 text-sm text-gray-500 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                      Preview mode: Showing with sample data
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    isEditMode ? "Update AI Template" : "Create AI Template"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
