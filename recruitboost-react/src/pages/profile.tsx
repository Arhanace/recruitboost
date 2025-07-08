import { useState } from "react";
import { 
  User, 
  Camera, 
  Save, 
  Edit,
  GraduationCap,
  Trophy,
  Star,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockUser, sports } from "@/lib/mock-data";
import { getInitials } from "@/lib/utils";

export default function Profile() {
  const { toast } = useToast();
  const [user, setUser] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [newAchievement, setNewAchievement] = useState("");

  // Form states for editing
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    sport: user.sport || "",
    position: user.position || "",
    graduationYear: user.graduationYear?.toString() || "",
    gpa: user.gpa?.toString() || "",
    height: "6'2\"", // Mock data
    weight: "180 lbs", // Mock data
    highSchool: "Lincoln High School", // Mock data
    coachName: "Coach Smith", // Mock data
    coachEmail: "coach.smith@lincolnhs.edu", // Mock data
    phoneNumber: "(555) 123-4567", // Mock data
    address: "123 Main St, Anytown, USA", // Mock data
    bio: "Passionate basketball player with strong leadership skills and academic excellence. Team captain for two years with a focus on teamwork and continuous improvement.", // Mock data
  });

  const [achievements, setAchievements] = useState(user.achievements || []);

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      name: formData.name,
      email: formData.email,
      sport: formData.sport,
      position: formData.position,
      graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
      gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
      achievements: achievements,
      updatedAt: new Date().toISOString()
    };

    setUser(updatedUser);
    setIsEditing(false);
    
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully"
    });
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements(prev => [...prev, newAchievement.trim()]);
      setNewAchievement("");
      toast({
        title: "Achievement added",
        description: "New achievement has been added to your profile"
      });
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Achievement removed",
      description: "Achievement has been removed from your profile"
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      sport: user.sport || "",
      position: user.position || "",
      graduationYear: user.graduationYear?.toString() || "",
      gpa: user.gpa?.toString() || "",
      height: "6'2\"",
      weight: "180 lbs",
      highSchool: "Lincoln High School",
      coachName: "Coach Smith",
      coachEmail: "coach.smith@lincolnhs.edu",
      phoneNumber: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      bio: "Passionate basketball player with strong leadership skills and academic excellence. Team captain for two years with a focus on teamwork and continuous improvement.",
    });
    setAchievements(user.achievements || []);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">
              Manage your athletic profile and recruiting information
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>
                {user.sport} • Class of {user.graduationYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p className="text-lg">{user.position || "Not specified"}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">GPA</p>
                  <p className="text-lg font-bold text-green-600">{user.gpa || "Not specified"}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Sport</p>
                  <p className="text-lg">{user.sport || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coaches Contacted</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Emails Sent</span>
                <Badge variant="secondary">15</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Responses</span>
                <Badge variant="success">4</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profile Views</span>
                <Badge variant="info">47</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="athletic">Athletic</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                      {isEditing ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Full name"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{user.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Email address"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{user.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</label>
                      {isEditing ? (
                        <Input
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="Phone number"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{formData.phoneNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Graduation Year</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={formData.graduationYear}
                          onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                          placeholder="Graduation year"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{user.graduationYear}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Address</label>
                    {isEditing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Address"
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">{formData.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Bio</label>
                    {isEditing ? (
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell coaches about yourself..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm p-4 bg-gray-50 rounded">{formData.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Athletic Information */}
            <TabsContent value="athletic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Athletic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Sport</label>
                      {isEditing ? (
                        <Select value={formData.sport} onValueChange={(value) => setFormData(prev => ({ ...prev, sport: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                          <SelectContent>
                            {sports.map(sport => (
                              <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{user.sport}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Position</label>
                      {isEditing ? (
                        <Input
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Position"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{user.position}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Height</label>
                      {isEditing ? (
                        <Input
                          value={formData.height}
                          onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                          placeholder="Height"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{formData.height}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Weight</label>
                      {isEditing ? (
                        <Input
                          value={formData.weight}
                          onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="Weight"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{formData.weight}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">High School</label>
                      {isEditing ? (
                        <Input
                          value={formData.highSchool}
                          onChange={(e) => setFormData(prev => ({ ...prev, highSchool: e.target.value }))}
                          placeholder="High school"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{formData.highSchool}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">High School Coach</label>
                      {isEditing ? (
                        <Input
                          value={formData.coachName}
                          onChange={(e) => setFormData(prev => ({ ...prev, coachName: e.target.value }))}
                          placeholder="Coach name"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{formData.coachName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Coach Email</label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.coachEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, coachEmail: e.target.value }))}
                        placeholder="Coach email"
                      />
                    ) : (
                      <p className="text-sm p-2 bg-gray-50 rounded">{formData.coachEmail}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Information */}
            <TabsContent value="academic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">GPA</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="4"
                          value={formData.gpa}
                          onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                          placeholder="GPA"
                        />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">{user.gpa}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Class Rank</label>
                      {isEditing ? (
                        <Input placeholder="Class rank" />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">15 of 320</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">SAT Score</label>
                      {isEditing ? (
                        <Input placeholder="SAT score" />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">1450</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">ACT Score</label>
                      {isEditing ? (
                        <Input placeholder="ACT score" />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded">32</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Academic Honors</label>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium">Honor Roll</p>
                        <p className="text-xs text-gray-600">All four years of high school</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium">National Honor Society</p>
                        <p className="text-xs text-gray-600">Member since junior year</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium">AP Scholar</p>
                        <p className="text-xs text-gray-600">Completed 6 AP courses</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Achievements & Awards
                  </CardTitle>
                  <CardDescription>
                    Showcase your athletic and academic accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new achievement..."
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
                      />
                      <Button onClick={handleAddAchievement}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{achievement}</span>
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAchievement(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {achievements.length === 0 && (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                      <p className="text-gray-500">
                        {isEditing ? "Add your first achievement above" : "Edit your profile to add achievements"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Save/Cancel Actions */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 flex gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile}>
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </div>
      )}
    </div>
  );
}