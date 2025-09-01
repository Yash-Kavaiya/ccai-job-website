import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Eye, EyeOff, Globe, Link, LinkedIn, Mail, Plus, Share2, Trash2, Twitter, Users, X } from 'lucide-react';
import { useSocialStore, type Achievement, type PortfolioItem, type SocialLinks } from '@/store/social-store';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

export default function SocialPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const {
    socialProfile,
    connections,
    connectionRequests,
    publicProfiles,
    isLoading,
    error,
    createSocialProfile,
    updateSocialProfile,
    loadSocialProfile,
    toggleProfileVisibility,
    updateProfileSlug,
    addAchievement,
    removeAchievement,
    addPortfolioItem,
    removePortfolioItem,
    updateSocialLinks,
    loadConnections,
    loadConnectionRequests,
    loadFeaturedProfiles,
    acceptConnectionRequest,
    rejectConnectionRequest,
    shareProfile,
    generateProfileShareUrl,
    clearError
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [profileSlugInput, setProfileSlugInput] = useState('');
  const [socialLinksInput, setSocialLinksInput] = useState<SocialLinks>({});

  // Form states
  const [achievementForm, setAchievementForm] = useState<Achievement>({
    title: '',
    description: '',
    date: '',
    type: 'project',
    url: ''
  });

  const [portfolioForm, setPortfolioForm] = useState<PortfolioItem>({
    title: '',
    description: '',
    image_url: '',
    project_url: '',
    github_url: '',
    technologies: [],
    date: ''
  });

  const [profileForm, setProfileForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    loadSocialProfile();
    loadConnections();
    loadConnectionRequests();
    loadFeaturedProfiles();
  }, []);

  useEffect(() => {
    if (socialProfile) {
      setProfileForm({
        display_name: socialProfile.display_name || '',
        bio: socialProfile.bio || '',
        avatar_url: socialProfile.avatar_url || ''
      });
      setProfileSlugInput(socialProfile.profile_slug || '');
      setSocialLinksInput(JSON.parse(socialProfile.social_links || '{}'));
    }
  }, [socialProfile]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Create initial profile if it doesn't exist
  const handleCreateProfile = async () => {
    if (!user) return;
    
    const slug = `${user.email?.split('@')[0]}-ai-professional`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    await createSocialProfile({
      profile_slug: slug,
      display_name: user.email?.split('@')[0] || 'AI Professional',
      bio: 'AI and Machine Learning enthusiast',
      avatar_url: ''
    });
    
    toast({
      title: "Success",
      description: "Your social profile has been created!",
    });
  };

  const handleUpdateProfile = async () => {
    await updateSocialProfile(profileForm);
    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
  };

  const handleUpdateSlug = async () => {
    if (profileSlugInput !== socialProfile?.profile_slug) {
      await updateProfileSlug(profileSlugInput);
      toast({
        title: "Success",
        description: "Profile URL updated successfully!",
      });
    }
  };

  const handleUpdateSocialLinks = async () => {
    await updateSocialLinks(socialLinksInput);
    toast({
      title: "Success",
      description: "Social links updated successfully!",
    });
  };

  const handleAddAchievement = async () => {
    if (!achievementForm.title || !achievementForm.description) return;
    
    await addAchievement(achievementForm);
    setAchievementForm({
      title: '',
      description: '',
      date: '',
      type: 'project',
      url: ''
    });
    
    toast({
      title: "Success",
      description: "Achievement added successfully!",
    });
  };

  const handleAddPortfolioItem = async () => {
    if (!portfolioForm.title || !portfolioForm.description) return;
    
    await addPortfolioItem(portfolioForm);
    setPortfolioForm({
      title: '',
      description: '',
      image_url: '',
      project_url: '',
      github_url: '',
      technologies: [],
      date: ''
    });
    
    toast({
      title: "Success",
      description: "Portfolio item added successfully!",
    });
  };

  const handleShareProfile = async (platform: 'linkedin' | 'twitter' | 'email' | 'copy') => {
    await shareProfile(platform);
    
    if (platform === 'copy') {
      toast({
        title: "Success",
        description: "Profile URL copied to clipboard!",
      });
    }
    
    setShowShareDialog(false);
  };

  const handleAcceptConnection = async (connectionId: string) => {
    await acceptConnectionRequest(connectionId);
    toast({
      title: "Success",
      description: "Connection request accepted!",
    });
  };

  const handleRejectConnection = async (connectionId: string) => {
    await rejectConnectionRequest(connectionId);
    toast({
      title: "Success",
      description: "Connection request rejected.",
    });
  };

  if (!socialProfile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              Create Your Social Profile
            </CardTitle>
            <CardDescription>
              Build your professional AI profile to connect with other professionals and showcase your expertise.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg text-white">
                  <Globe className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Share Your Expertise</h3>
                  <p className="text-blue-100">Connect with AI professionals worldwide</p>
                </div>
              </div>
              <Button onClick={handleCreateProfile} size="lg" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Social Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const achievements = JSON.parse(socialProfile.achievements || '[]') as Achievement[];
  const portfolioItems = JSON.parse(socialProfile.portfolio_items || '[]') as PortfolioItem[];
  const shareUrl = generateProfileShareUrl(socialProfile.profile_slug);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Social Profile</h1>
            <p className="text-muted-foreground">Manage your professional presence and connections</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={socialProfile.is_public === 'true' ? 'default' : 'secondary'}>
              {socialProfile.is_public === 'true' ? (
                <><Eye className="h-3 w-3 mr-1" /> Public</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" /> Private</>
              )}
            </Badge>
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Profile</DialogTitle>
                  <DialogDescription>
                    Share your professional AI profile with others
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <Input value={shareUrl} readOnly className="flex-1" />
                    <Button size="sm" onClick={() => handleShareProfile('copy')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleShareProfile('linkedin')}>
                      <LinkedIn className="h-4 w-4 mr-2" />
                      LinkedIn
                    </Button>
                    <Button variant="outline" onClick={() => handleShareProfile('twitter')}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" onClick={() => handleShareProfile('email')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" onClick={() => window.open(shareUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="connections">
            Connections
            {connections.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {connections.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {connectionRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {connectionRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                    placeholder="Your professional name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell others about your AI expertise..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Profile Image URL</Label>
                  <Input
                    id="avatar_url"
                    value={profileForm.avatar_url}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                    placeholder="https://example.com/your-photo.jpg"
                  />
                </div>
                <Button onClick={handleUpdateProfile} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Control your profile visibility and sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to everyone
                    </p>
                  </div>
                  <Switch
                    checked={socialProfile.is_public === 'true'}
                    onCheckedChange={toggleProfileVisibility}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="profile_slug">Profile URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="profile_slug"
                      value={profileSlugInput}
                      onChange={(e) => setProfileSlugInput(e.target.value)}
                      placeholder="your-profile-name"
                    />
                    <Button variant="outline" onClick={handleUpdateSlug}>
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {window.location.origin}/profile/{profileSlugInput}
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Visibility Settings</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Email</span>
                      <Switch
                        checked={socialProfile.show_email === 'true'}
                        onCheckedChange={(checked) => updateSocialProfile({ show_email: checked ? 'true' : 'false' })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Location</span>
                      <Switch
                        checked={socialProfile.show_location === 'true'}
                        onCheckedChange={(checked) => updateSocialProfile({ show_location: checked ? 'true' : 'false' })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Skills</span>
                      <Switch
                        checked={socialProfile.show_skills === 'true'}
                        onCheckedChange={(checked) => updateSocialProfile({ show_skills: checked ? 'true' : 'false' })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Experience Level</span>
                      <Switch
                        checked={socialProfile.show_experience === 'true'}
                        onCheckedChange={(checked) => updateSocialProfile({ show_experience: checked ? 'true' : 'false' })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>Connect your professional social media profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={socialLinksInput.linkedin || ''}
                      onChange={(e) => setSocialLinksInput({ ...socialLinksInput, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Profile</Label>
                    <Input
                      id="github"
                      value={socialLinksInput.github || ''}
                      onChange={(e) => setSocialLinksInput({ ...socialLinksInput, github: e.target.value })}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X Profile</Label>
                    <Input
                      id="twitter"
                      value={socialLinksInput.twitter || ''}
                      onChange={(e) => setSocialLinksInput({ ...socialLinksInput, twitter: e.target.value })}
                      placeholder="https://twitter.com/yourusername"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio Website</Label>
                    <Input
                      id="portfolio"
                      value={socialLinksInput.portfolio || ''}
                      onChange={(e) => setSocialLinksInput({ ...socialLinksInput, portfolio: e.target.value })}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleUpdateSocialLinks} disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Social Links'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Achievement Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Achievement</CardTitle>
                <CardDescription>Showcase your professional accomplishments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="achievement_title">Title</Label>
                  <Input
                    id="achievement_title"
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                    placeholder="Achievement title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement_description">Description</Label>
                  <Textarea
                    id="achievement_description"
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                    placeholder="Describe your achievement..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement_type">Type</Label>
                  <Select value={achievementForm.type} onValueChange={(value: Achievement['type']) => setAchievementForm({ ...achievementForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="award">Award</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="publication">Publication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement_date">Date</Label>
                  <Input
                    id="achievement_date"
                    type="date"
                    value={achievementForm.date}
                    onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement_url">URL (Optional)</Label>
                  <Input
                    id="achievement_url"
                    value={achievementForm.url}
                    onChange={(e) => setAchievementForm({ ...achievementForm, url: e.target.value })}
                    placeholder="https://certificate-url.com"
                  />
                </div>
                <Button onClick={handleAddAchievement} disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Achievement
                </Button>
              </CardContent>
            </Card>

            {/* Achievements List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Achievements ({achievements.length})</h3>
              </div>
              
              {achievements.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No achievements added yet.</p>
                    <p className="text-sm text-muted-foreground">Add your first achievement to showcase your expertise!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {achievements.map((achievement, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{achievement.type}</Badge>
                              {achievement.date && (
                                <span className="text-sm text-muted-foreground">{achievement.date}</span>
                              )}
                            </div>
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <p className="text-muted-foreground text-sm mt-1">{achievement.description}</p>
                            {achievement.url && (
                              <a 
                                href={achievement.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2"
                              >
                                <Link className="h-3 w-3 mr-1" />
                                View Certificate
                              </a>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAchievement(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Portfolio Item Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Portfolio Item</CardTitle>
                <CardDescription>Showcase your projects and work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolio_title">Project Title</Label>
                  <Input
                    id="portfolio_title"
                    value={portfolioForm.title}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                    placeholder="Project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_description">Description</Label>
                  <Textarea
                    id="portfolio_description"
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    placeholder="Describe your project..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_image">Image URL</Label>
                  <Input
                    id="portfolio_image"
                    value={portfolioForm.image_url}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, image_url: e.target.value })}
                    placeholder="https://example.com/project-image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_project_url">Project URL</Label>
                  <Input
                    id="portfolio_project_url"
                    value={portfolioForm.project_url}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, project_url: e.target.value })}
                    placeholder="https://your-project.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_github">GitHub URL</Label>
                  <Input
                    id="portfolio_github"
                    value={portfolioForm.github_url}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, github_url: e.target.value })}
                    placeholder="https://github.com/user/repo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio_date">Completion Date</Label>
                  <Input
                    id="portfolio_date"
                    type="date"
                    value={portfolioForm.date}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddPortfolioItem} disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </CardContent>
            </Card>

            {/* Portfolio Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Portfolio ({portfolioItems.length})</h3>
              </div>
              
              {portfolioItems.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No portfolio items added yet.</p>
                    <p className="text-sm text-muted-foreground">Showcase your best AI projects and work!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {portfolioItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex gap-4">
                          {item.image_url && (
                            <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                              <img 
                                src={item.image_url} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{item.title}</h4>
                                <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                {item.date && (
                                  <p className="text-xs text-muted-foreground mt-2">Completed: {item.date}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {item.project_url && (
                                    <a 
                                      href={item.project_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Live Demo
                                    </a>
                                  )}
                                  {item.github_url && (
                                    <a 
                                      href={item.github_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
                                    >
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                      </svg>
                                      Code
                                    </a>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePortfolioItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Connections ({connections.length})</h3>
          </div>
          
          {connections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No connections yet.</p>
                <p className="text-sm text-muted-foreground">Start networking with other AI professionals!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection._id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {connection.connected_user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{connection.connected_user_name}</h4>
                        <Badge variant="outline" className="mt-1">
                          {connection.connection_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connected: {new Date(connection.accepted_at || connection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Connection Requests ({connectionRequests.length})</h3>
          </div>
          
          {connectionRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending connection requests.</p>
                <p className="text-sm text-muted-foreground">New connection requests will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {connectionRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {request.connected_user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold">{request.connected_user_name}</h4>
                          <Badge variant="outline" className="mt-1">
                            {request.connection_type}
                          </Badge>
                          {request.message && (
                            <p className="text-sm text-muted-foreground mt-2 max-w-md">
                              "{request.message}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptConnection(request._id)}
                          disabled={isLoading}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectConnection(request._id)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}