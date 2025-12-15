import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, MapPin, UserPlus, Users } from 'lucide-react';
import { SocialProfile } from '@/store/social-store';
import { SocialShare } from './SocialShare';

interface ProfileCardProps {
  profile: SocialProfile;
  showConnectButton?: boolean;
  onConnect?: () => void;
  className?: string;
  compact?: boolean;
}

export function ProfileCard({ 
  profile, 
  showConnectButton = false, 
  onConnect,
  className,
  compact = false
}: ProfileCardProps) {
  const profileUrl = `${window.location.origin}/profile/${profile.profile_slug}`;

  return (
    <Card className={className}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-start gap-4">
          {/* Profile Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className={`rounded-full object-cover ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}
              />
            ) : (
              <div className={`rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${compact ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'}`}>
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={`font-semibold truncate ${compact ? 'text-base' : 'text-lg'}`}>
                  {profile.display_name}
                </h3>
                {profile.bio && (
                  <p className={`text-muted-foreground ${compact ? 'text-sm line-clamp-1' : 'text-sm line-clamp-2'} mt-1`}>
                    {profile.bio}
                  </p>
                )}
              </div>
              {!compact && (
                <Badge variant={profile.is_public === 'true' ? 'default' : 'secondary'}>
                  {profile.is_public === 'true' ? 'Public' : 'Private'}
                </Badge>
              )}
            </div>

            {/* Profile Stats */}
            {!compact && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {profile.total_views} views
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {profile.total_connections} connections
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {showConnectButton && onConnect && (
                <Button size="sm" onClick={onConnect}>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              )}
              {profile.is_public === 'true' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(profileUrl, '_blank')}
                  >
                    View Profile
                  </Button>
                  <SocialShare
                    url={profileUrl}
                    title={`${profile.display_name}'s AI Professional Profile`}
                    description={profile.bio || 'Check out this AI professional profile on AIJobHub'}
                    size="sm"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}