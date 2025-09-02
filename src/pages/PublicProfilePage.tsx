import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, ExternalLink, Eye, Github, Globe, Link, Linkedin, Mail, MapPin, Star, Twitter, User, UserPlus, Users } from 'lucide-react';
import { useSocialStore, type Achievement, type PortfolioItem, type SocialLinks, type UserConnection } from '@/store/social-store';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

export default function PublicProfilePage() {
  const { profileSlug } = useParams<{ profileSlug: string }>();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const {
    profilePreview,
    isLoading,
    error,
    viewPublicProfile,
    recordProfileView,
    sendConnectionRequest,
    clearError
  } = useSocialStore();

  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connectionType, setConnectionType] = useState<UserConnection['connection_type']>('peer');

  useEffect(() => {
    if (profileSlug) {
      viewPublicProfile(profileSlug);
      recordProfileView(profileSlug);
    }
  }, [profileSlug, viewPublicProfile, recordProfileView]);

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

  const handleSendConnectionRequest = async () => {
    if (!profilePreview || !connectionMessage.trim()) return;

    await sendConnectionRequest(profilePreview._uid, connectionMessage, connectionType);
    setShowConnectionDialog(false);
    setConnectionMessage('');
    
    toast({
      title: "Success",
      description: "Connection request sent successfully!",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profilePreview) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This profile doesn't exist or is set to private.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const achievements = JSON.parse(profilePreview.achievements || '[]') as Achievement[];
  const portfolioItems = JSON.parse(profilePreview.portfolio_items || '[]') as PortfolioItem[];
  const socialLinks = JSON.parse(profilePreview.social_links || '{}') as SocialLinks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">CCAI Jobs by AI-Powered Careers Easy AI Labs Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {profilePreview.total_views} views
              </div>
              {user && user.email !== profilePreview._uid && (
                <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Connection Request</DialogTitle>
                      <DialogDescription>
                        Send a connection request to {profilePreview.display_name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Connection Type</label>
                        <Select value={connectionType} onValueChange={(value: UserConnection['connection_type']) => setConnectionType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="peer">Peer</SelectItem>
                            <SelectItem value="colleague">Colleague</SelectItem>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="mentor">Mentor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                          value={connectionMessage}
                          onChange={(e) => setConnectionMessage(e.target.value)}
                          placeholder="Write a personal message..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSendConnectionRequest}
                        disabled={!connectionMessage.trim() || isLoading}
                      >
                        Send Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                {profilePreview.avatar_url ? (
                  <img
                    src={profilePreview.avatar_url}
                    alt={profilePreview.display_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                    {profilePreview.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profilePreview.display_name}
              </h1>
              
              {profilePreview.bio && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                  {profilePreview.bio}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {profilePreview.total_connections} connections
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profilePreview.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="flex items-center justify-center gap-3">
                  {socialLinks.linkedin && (
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.github && (
                    <a
                      href={socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.portfolio && (
                    <a
                      href={socialLinks.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Section */}
          {achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Professional accomplishments and certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{achievement.type}</Badge>
                        {achievement.date && (
                          <span className="text-xs text-muted-foreground">{achievement.date}</span>
                        )}
                      </div>
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {achievement.url && (
                        <a 
                          href={achievement.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-1"
                        >
                          <Link className="h-3 w-3 mr-1" />
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Section */}
          {portfolioItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  Portfolio
                </CardTitle>
                <CardDescription>
                  Featured projects and work samples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {portfolioItems.map((item, index) => (
                    <div key={index} className="group">
                      {item.image_url && (
                        <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      {item.technologies && item.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.technologies.map((tech, techIndex) => (
                            <Badge key={techIndex} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
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
                            <Github className="h-3 w-3 mr-1" />
                            Code
                          </a>
                        )}
                      </div>
                      {index < portfolioItems.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State for No Content */}
        {achievements.length === 0 && portfolioItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Profile Under Construction</h3>
              <p className="text-muted-foreground">
                {profilePreview.display_name} is still building their professional showcase.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact CTA */}
        {user && user.email !== profilePreview._uid && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="text-center py-8">
              <h3 className="text-xl font-semibold mb-2">Connect with {profilePreview.display_name}</h3>
              <p className="text-muted-foreground mb-4">
                Expand your professional network in the AI industry
              </p>
              <Button onClick={() => setShowConnectionDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Connection Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}