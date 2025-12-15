import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Copy, ExternalLink, Linkedin, Mail, Share2, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function SocialShare({ 
  url, 
  title, 
  description = '', 
  className,
  variant = 'outline',
  size = 'sm'
}: SocialShareProps) {
  const { toast } = useToast();

  const shareUrls = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
  };

  const handleShare = async (platform: keyof typeof shareUrls | 'copy' | 'native') => {
    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Success",
            description: "Link copied to clipboard!",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to copy link",
            variant: "destructive",
          });
        }
        break;
      
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              text: description,
              url
            });
          } catch (error) {
            // User cancelled or share failed
          }
        }
        break;
      
      default:
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          Share on Twitter/X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="h-4 w-4 mr-2 text-gray-600" />
          Share via Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={() => handleShare('native')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}