import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, MessageSquare, BarChart4, UserIcon, Mail, CheckCircle, School, UserCheck, ArrowRight } from "lucide-react";
import { SocialButton } from "@/components/auth/social-button";
import { useAuth } from "@/hooks/use-auth-provider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function SplashPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [location, setLocation] = useLocation();
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth();
  const { toast } = useToast();
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      // Use wouter's navigation for redirection
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // Handle sign in with Google
  const handleGoogleSignIn = () => {
    signInWithGoogle().catch(error => {
      toast({
        title: activeTab === "login" ? "Login Error" : "Registration Error",
        description: `Unable to sign ${activeTab === "login" ? "in" : "up"} with Google. Please try again.`,
        variant: "destructive"
      });
      console.error("Google sign-in error:", error);
    });
  };

  // Handle sign in with Apple
  const handleAppleSignIn = () => {
    signInWithApple().catch(error => {
      toast({
        title: activeTab === "login" ? "Login Error" : "Registration Error",
        description: `Unable to sign ${activeTab === "login" ? "in" : "up"} with Apple. Please try again.`,
        variant: "destructive"
      });
      console.error("Apple sign-in error:", error);
    });
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
                <Button size="lg" variant="outline" asChild className="py-6">
                  <a href="#features">Learn More</a>
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
        <div id="features" className="max-w-screen-xl mx-auto py-16">
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
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Division I, II, III coaches
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified contact information
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save favorite coaches
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Contact Coaches</h3>
              <p className="text-gray-600 mb-4">
                Send personalized emails with our AI-powered writing assistant that helps you create impressive outreach messages.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI email templates
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bulk email campaigns
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Open and response tracking
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart4 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-gray-600 mb-4">
                Manage your entire recruitment journey with our task management system and communication tracking.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Task management
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Response analytics
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Recruitment timeline
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Testimonial */}
        <div className="max-w-screen-xl mx-auto py-16 bg-gray-50 rounded-xl my-16 overflow-hidden">
          <div className="relative">
            <div className="absolute -left-16 -top-16 w-40 h-40 bg-primary/5 rounded-full"></div>
            <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-primary/5 rounded-full"></div>
          </div>
          
          <div className="relative px-8 py-8 md:px-12 md:py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Hear from athletes who found their perfect college match using RecruitBoost
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=120&h=120"
                    alt="Michael Johnson"
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-lg">Michael Johnson</h4>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">Stanford University | Basketball</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "After months of silence from coaches, I started using RecruitBoost and received 5 responses in my first week. The coach database and email templates made all the difference in my recruiting journey."
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-green-600">Full Scholarship</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120"
                    alt="Sarah Williams"
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-lg">Sarah Williams</h4>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">UCLA | Soccer</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "The task management system helped me stay organized during my recruiting process. I could track every email, campus visit, and follow-up in one place. I'm now playing soccer at my dream school!"
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-green-600">Athletic Scholarship</span>
                </div>
              </div>
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
        
        {/* Footer */}
        <footer className="max-w-screen-xl mx-auto border-t border-gray-200 pt-12 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-gray-800">RecruitBoost</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                The comprehensive platform that connects student-athletes with college coaches to simplify the recruiting process.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2025 RecruitBoost. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
              </a>
            </div>
          </div>
        </footer>
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
                <SocialButton 
                  provider="google" 
                  onClick={handleGoogleSignIn}
                />
                
                <SocialButton 
                  provider="apple" 
                  onClick={handleAppleSignIn}
                />
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
                <SocialButton 
                  provider="google" 
                  onClick={handleGoogleSignIn}
                />
                
                <SocialButton 
                  provider="apple" 
                  onClick={handleAppleSignIn}
                />
              
                {/* Athlete Information Notice */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                  <div className="flex items-start">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-blue-600 mt-0.5 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-1">Complete Your Athlete Profile After Registration</h3>
                      <p className="text-sm text-blue-600">
                        After creating your account, you'll be prompted to provide your athletic information,
                        academic details, and school preferences. This will help us match you with the right
                        schools and coaches for your specific goals.
                      </p>
                    </div>
                  </div>
                </div>
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
                <SocialButton 
                  provider="google" 
                  onClick={handleGoogleSignIn}
                />
                
                <SocialButton 
                  provider="apple" 
                  onClick={handleAppleSignIn}
                />
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
                <SocialButton 
                  provider="google" 
                  onClick={handleGoogleSignIn}
                />
                
                <SocialButton 
                  provider="apple" 
                  onClick={handleAppleSignIn}
                />
              
                {/* Athlete Information Notice */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                  <div className="flex items-start">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-blue-600 mt-0.5 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-1">Complete Your Athlete Profile After Registration</h3>
                      <p className="text-sm text-blue-600">
                        After creating your account, you'll be prompted to provide your athletic information,
                        academic details, and school preferences. This will help us match you with the right
                        schools and coaches for your specific goals.
                      </p>
                    </div>
                  </div>
                </div>
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