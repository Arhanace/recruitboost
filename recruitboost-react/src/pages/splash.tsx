import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, MessageSquare, BarChart4, Mail, School, ArrowRight } from "lucide-react";

export default function SplashPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();

  // Mock sign in function - in real app this would handle authentication
  const handleSignIn = () => {
    setLoginOpen(false);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gray-800">RecruitBoost</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveTab("register");
                setLoginOpen(true);
              }}
              className="font-medium"
            >
              Sign Up
            </Button>
            <Button onClick={() => {
              setActiveTab("login");
              setLoginOpen(true);
            }}>Sign In</Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-screen-xl mx-auto py-12">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 lg:pr-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 text-gray-900 leading-tight">
                Connect with <span className="text-primary">College Coaches</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Take control of your athletic future with our platform that helps you reach out to coaches, manage your recruitment, and find your perfect college fit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  onClick={() => {
                    setActiveTab("register");
                    setLoginOpen(true);
                  }} 
                  className="py-6"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="py-6">
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center text-gray-600">
                <div className="flex -space-x-2 mr-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium">JT</div>
                  <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-medium">KL</div>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-xs font-medium">SP</div>
                </div>
                <span className="text-sm">Joined by <span className="font-medium">25,000+</span> athletes</span>
              </div>
            </div>
            
            <div className="lg:w-1/2 mt-12 lg:mt-0">
              <div className="relative">
                <div className="absolute -right-4 -top-4 w-full h-full bg-primary/10 rounded-lg -z-10 transform translate-x-4 translate-y-2"></div>
                <img 
                  src="https://images.unsplash.com/photo-1519766304817-4f37bda74a26?auto=format&fit=crop&q=80"
                  alt="College athlete"
                  className="rounded-lg shadow-lg object-cover w-full h-[450px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-screen-xl mx-auto my-16">
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 p-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">10,000+</p>
              <p className="text-gray-500">Coaches</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">1,500+</p>
              <p className="text-gray-500">Schools</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">25,000+</p>
              <p className="text-gray-500">Athletes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">98%</p>
              <p className="text-gray-500">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-screen-xl mx-auto py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              How RecruitBoost <span className="text-primary">Works</span>
            </h2>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Our platform makes recruiting simple with powerful tools designed specifically for student-athletes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <School className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Coaches</h3>
              <p className="text-gray-600 mb-4">
                Search our database of 10,000+ college coaches across all divisions, filtered by your sport, location, and academic preferences.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Contact Coaches</h3>
              <p className="text-gray-600 mb-4">
                Send personalized emails with our AI-powered writing assistant that helps you create impressive outreach messages.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart4 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-gray-600 mb-4">
                Manage your entire recruitment journey with our task management system and communication tracking.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-screen-xl mx-auto mb-24">
          <div className="bg-primary rounded-xl overflow-hidden">
            <div className="px-8 py-12 md:px-12 md:py-16 relative">
              <div className="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              
              <div className="relative max-w-3xl mx-auto text-center z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Find Your Perfect College Match?</h2>
                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                  Join thousands of athletes who have successfully connected with college coaches using RecruitBoost.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white hover:bg-gray-100 text-primary py-6"
                    onClick={() => {
                      setActiveTab("register");
                      setLoginOpen(true);
                    }}
                  >
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white bg-white text-primary hover:bg-gray-100 py-6"
                    onClick={() => {
                      setActiveTab("login");
                      setLoginOpen(true);
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login/Register Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to RecruitBoost</DialogTitle>
            <DialogDescription>
              Sign in to your account or create a new one
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 py-4">
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={handleSignIn}
                >
                  Continue with Demo
                </Button>
              </div>
              
              <div className="pt-2 text-center text-sm text-gray-500">
                Don't have an account? <span 
                  className="text-primary underline cursor-pointer" 
                  onClick={() => setActiveTab("register")}
                >
                  Sign up
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 py-4">
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={handleSignIn}
                >
                  Get Started with Demo
                </Button>
              </div>
              
              <div className="pt-2 text-center text-sm text-gray-500">
                Already have an account? <span 
                  className="text-primary underline cursor-pointer" 
                  onClick={() => setActiveTab("login")}
                >
                  Sign in
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}