import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  CheckCircle,
  Users,
  Search,
  MessageSquare,
  Calendar,
  BarChart4,
  ArrowLeft
} from "lucide-react";

export default function CoachComingSoon() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    school: "",
    position: "",
    sport: "",
    teamSize: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send the data to the server
    console.log("Form submitted:", form);
    
    // Show success toast
    toast({
      title: "Successfully joined waitlist!",
      description: "We'll notify you when coach features become available.",
    });
    
    // Show the success state
    setSubmitted(true);
  };

  return (
    <div className="container max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center" 
        onClick={() => window.location.href = "/"}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          RecruitAthlete for Coaches
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A powerful platform to find, evaluate, and recruit student athletes for your team.
          <span className="block mt-2 font-semibold">Coming Soon!</span>
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 mb-12">
        <div className="md:col-span-3">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Streamline Your Recruiting Process</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Find Athletes</h3>
                    <p className="text-gray-600">
                      Discover student athletes that match your program's specific needs and criteria.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Team Management</h3>
                    <p className="text-gray-600">
                      Keep your coaching staff in sync with shared recruiting boards and notes.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Communication</h3>
                    <p className="text-gray-600">
                      Engage with prospects through compliant, trackable messaging.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Events & Camps</h3>
                    <p className="text-gray-600">
                      Organize and promote recruiting events and camps to attract talent.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <BarChart4 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Analytics</h3>
                    <p className="text-gray-600">
                      Get insights into prospect engagement and recruiting performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Why Choose RecruitAthlete?</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Access to thousands of verified student-athlete profiles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Compliance-friendly communication tools that meet NCAA regulations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Advanced filtering to find athletes that match your program's needs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Time-saving tools for busy coaching staffs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Customizable team dashboard to track recruiting progress</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{submitted ? "Thanks for Joining!" : "Join the Waitlist"}</CardTitle>
              <CardDescription>
                {submitted 
                  ? "You'll be among the first to know when we launch for coaches." 
                  : "Be the first to know when our coach platform launches."}
              </CardDescription>
            </CardHeader>
            
            {submitted ? (
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">You're on the list!</h3>
                  <p className="text-gray-500 mb-6">
                    We'll notify you when RecruitAthlete for Coaches is ready.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSubmitted(false)}
                    className="mt-2"
                  >
                    Join with another email
                  </Button>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="John Smith" 
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="coach@school.edu" 
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="school">School/Organization</Label>
                    <Input 
                      id="school" 
                      name="school" 
                      placeholder="University of Example" 
                      value={form.school}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("position", value)}
                        value={form.position}
                      >
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head_coach">Head Coach</SelectItem>
                          <SelectItem value="assistant_coach">Assistant Coach</SelectItem>
                          <SelectItem value="athletic_director">Athletic Director</SelectItem>
                          <SelectItem value="recruiting_coordinator">Recruiting Coordinator</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sport">Sport</Label>
                      <Select 
                        onValueChange={(value) => handleSelectChange("sport", value)}
                        value={form.sport}
                      >
                        <SelectTrigger id="sport">
                          <SelectValue placeholder="Select sport" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basketball">Basketball</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="baseball">Baseball</SelectItem>
                          <SelectItem value="soccer">Soccer</SelectItem>
                          <SelectItem value="volleyball">Volleyball</SelectItem>
                          <SelectItem value="swimming">Swimming</SelectItem>
                          <SelectItem value="track">Track & Field</SelectItem>
                          <SelectItem value="tennis">Tennis</SelectItem>
                          <SelectItem value="golf">Golf</SelectItem>
                          <SelectItem value="lacrosse">Lacrosse</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("teamSize", value)}
                      value={form.teamSize}
                    >
                      <SelectTrigger id="teamSize">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Less than 15 athletes</SelectItem>
                        <SelectItem value="medium">15-30 athletes</SelectItem>
                        <SelectItem value="large">30-50 athletes</SelectItem>
                        <SelectItem value="xlarge">50+ athletes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">What features would you like to see?</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      placeholder="Tell us what would help your recruiting process..."
                      value={form.message}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full">Join Waitlist</Button>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}