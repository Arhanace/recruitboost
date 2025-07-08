import { useState } from "react";
import { 
  Mail, 
  Plus, 
  Send, 
  Save, 
  FileText, 
  Inbox, 
  SendHorizontal, 
  Edit,
  Reply,
  Forward,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  mockEmails, 
  mockCoaches, 
  emailTemplates,
  mockUser
} from "@/lib/mock-data";
import { Email } from "@/types";
import { createEmailBody } from "@/lib/utils";

export default function Emails() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Compose email state
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCoach, setSelectedCoach] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const getEmailsByType = (type: string) => {
    switch (type) {
      case "inbox":
        return mockEmails.filter(email => email.status === "received");
      case "sent":
        return mockEmails.filter(email => ["sent", "delivered", "opened", "replied"].includes(email.status));
      case "drafts":
        return mockEmails.filter(email => email.status === "draft");
      default:
        return mockEmails;
    }
  };

  const filteredEmails = getEmailsByType(activeTab).filter(email => {
    if (!searchTerm) return true;
    const coach = mockCoaches.find(c => c.id === email.coachId);
    return email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
           coach?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           coach?.school.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  };

  const applyTemplate = () => {
    const coach = mockCoaches.find(c => c.id === selectedCoach);
    if (!coach) return;

    const placeholders = {
      coachName: coach.name,
      school: coach.school,
      sport: coach.sport,
      playerName: mockUser.name,
      graduationYear: mockUser.graduationYear?.toString() || "2025",
      position: mockUser.position || "Student-Athlete",
      gpa: mockUser.gpa?.toString() || "3.8",
      playerEmail: mockUser.email,
      playerPhone: "(555) 123-4567", // Mock phone
      highSchool: "Lincoln High School", // Mock high school
      height: "6'2\"", // Mock height
      weight: "180 lbs", // Mock weight
      achievements: mockUser.achievements?.join(", ") || "Team Captain, All-State Selection",
      recentAchievement1: "Scored 25 points in playoff game",
      recentAchievement2: "Named conference player of the week",
      recentAchievement3: "Maintained 3.9 GPA this semester",
      visitHighlight1: "The state-of-the-art training facilities",
      visitHighlight2: "The strong academic support program",
      visitHighlight3: "The team culture and coaching philosophy"
    };

    setEmailSubject(createEmailBody(emailSubject, placeholders));
    setEmailBody(createEmailBody(emailBody, placeholders));
  };

  const handleSendEmail = () => {
    if (!selectedCoach || !emailSubject || !emailBody) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Email sent!",
      description: "Your email has been sent successfully"
    });
    
    // Reset form
    setComposeOpen(false);
    setSelectedTemplate("");
    setSelectedCoach("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your email has been saved as a draft"
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "warning" | "info"> = {
      sent: "info",
      delivered: "secondary",
      opened: "warning",
      replied: "success",
      received: "default",
      draft: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "default"} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Center</h1>
            <p className="text-gray-600">
              Manage your coach communications and recruiting emails
            </p>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Email List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="inbox" className="flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Inbox
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2">
                    <SendHorizontal className="h-4 w-4" />
                    Sent
                  </TabsTrigger>
                  <TabsTrigger value="drafts" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Drafts
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEmails.map((email) => {
                  const coach = mockCoaches.find(c => c.id === email.coachId);
                  return (
                    <div
                      key={email.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{coach?.name || "Unknown Coach"}</p>
                            {getStatusBadge(email.status)}
                          </div>
                          <p className="text-xs text-gray-500">{coach?.school}</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(email.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-2">{email.subject}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {email.body.substring(0, 100)}...
                      </p>
                    </div>
                  );
                })}
                
                {filteredEmails.length === 0 && (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Try adjusting your search" : "No emails in this folder"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Stats Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">15</p>
                <p className="text-sm text-gray-600">Emails Sent</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">4</p>
                <p className="text-sm text-gray-600">Responses</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">27%</p>
                <p className="text-sm text-gray-600">Response Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Templates
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compose Email Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email Template</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template</SelectItem>
                    {emailTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => handleTemplateSelect(selectedTemplate)}
                  >
                    Load Template
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Recipient Coach</label>
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCoaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.name} - {coach.school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && selectedCoach && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={applyTemplate}
                  >
                    Apply Template with Coach Info
                  </Button>
                )}
              </div>
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Subject</label>
                <Input
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
                <Textarea
                  placeholder="Write your email message..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[300px]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSendEmail} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Detail Dialog */}
      {selectedEmail && (
        <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedEmail.subject}</span>
                {getStatusBadge(selectedEmail.status)}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Email Header */}
              <div className="pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {mockCoaches.find(c => c.id === selectedEmail.coachId)?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mockCoaches.find(c => c.id === selectedEmail.coachId)?.email}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(selectedEmail.createdAt).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {mockCoaches.find(c => c.id === selectedEmail.coachId)?.school}
                </p>
              </div>

              {/* Email Body */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm">
                  {selectedEmail.body}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button size="sm">
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                <Button size="sm" variant="outline">
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}