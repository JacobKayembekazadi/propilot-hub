import { useState } from "react";
import { Save, Upload, Camera, Mail, Phone, MapPin, Calendar, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@sloemedia.com",
    phone: "+1 (555) 123-4567",
    bio: "Experienced real estate agent specializing in luxury properties and first-time homebuyers. 10+ years in the industry with a track record of successful sales.",
    location: "New York, NY",
    licenseNumber: "RE123456789",
    specialties: ["Luxury Properties", "First-Time Buyers", "Investment Properties"],
    website: "https://johndoe-realestate.com",
    linkedin: "https://linkedin.com/in/johndoe",
    avatar: ""
  });

  const [achievements] = useState([
    { title: "Top Producer 2023", description: "Highest sales volume in Q4", icon: Award, color: "text-yellow-600" },
    { title: "100+ Deals Closed", description: "Lifetime achievement", icon: TrendingUp, color: "text-green-600" },
    { title: "5-Star Rating", description: "Average client rating", icon: Award, color: "text-blue-600" }
  ]);

  const [stats] = useState({
    dealsThisYear: 47,
    totalRevenue: 2840000,
    averageDealSize: 580000,
    clientSatisfaction: 98,
    responseTime: "< 2 hours",
    experienceYears: 12
  });

  const handleSaveProfile = () => {
    // Here you would typically save to your backend
    toast({
      title: "Profile updated successfully!",
      description: "Your changes have been saved."
    });
  };

  const handleAvatarUpload = () => {
    // Handle avatar upload logic
    toast({
      title: "Avatar upload",
      description: "Avatar upload functionality would be implemented here."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your professional profile and preferences</p>
        </div>
        <Button onClick={handleSaveProfile}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button onClick={handleAvatarUpload} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile(prev => ({...prev, firstName: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile(prev => ({...prev, lastName: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({...prev, email: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({...prev, bio: e.target.value}))}
                  rows={4}
                  placeholder="Tell potential clients about your experience and expertise..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({...prev, location: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile(prev => ({...prev, licenseNumber: e.target.value}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile(prev => ({...prev, website: e.target.value}))}
                    placeholder="https://your-website.com"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    value={profile.linkedin}
                    onChange={(e) => setProfile(prev => ({...prev, linkedin: e.target.value}))}
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>Your areas of expertise and specializations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm">
                    + Add Specialty
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats and Achievements */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your key metrics this year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Deals Closed</span>
                  <span className="font-medium">{stats.dealsThisYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Revenue</span>
                  <span className="font-medium">${(stats.totalRevenue / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Deal Size</span>
                  <span className="font-medium">${(stats.averageDealSize / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Client Satisfaction</span>
                  <span className="font-medium">{stats.clientSatisfaction}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Client Satisfaction</span>
                  <span>{stats.clientSatisfaction}%</span>
                </div>
                <Progress value={stats.clientSatisfaction} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.experienceYears}</div>
                  <div className="text-xs text-muted-foreground">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.responseTime}</div>
                  <div className="text-xs text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your professional milestones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <achievement.icon className={`w-5 h-5 mt-0.5 ${achievement.color}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Member since 2019</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}