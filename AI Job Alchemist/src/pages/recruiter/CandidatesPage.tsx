import { useState, useEffect } from 'react';
import { Search, Filter, Users, Brain, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Candidate {
  id: string;
  name: string;
  email: string;
  title?: string;
  location?: string;
  skills: string[];
  experience_years?: number;
  matchScore?: number;
  resumeId?: string;
}

export function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch candidates from Firebase
  useEffect(() => {
    const fetchCandidates = async () => {
      setIsLoading(true);
      try {
        // Fetch users who are candidates
        const usersRef = collection(db, 'users');
        const usersQuery = query(
          usersRef,
          where('role', '==', 'candidate'),
          limit(50)
        );
        const usersSnapshot = await getDocs(usersQuery);

        const candidatesList: Candidate[] = [];
        const skillsSet = new Set<string>();

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();

          // Fetch resume data for this user
          const resumesRef = collection(db, 'resumes');
          const resumeQuery = query(
            resumesRef,
            where('user_id', '==', userDoc.id),
            orderBy('created_at', 'desc'),
            limit(1)
          );

          try {
            const resumeSnapshot = await getDocs(resumeQuery);
            let skills: string[] = [];
            let experienceYears = 0;
            let resumeId: string | undefined;

            if (!resumeSnapshot.empty) {
              const resumeData = resumeSnapshot.docs[0].data();
              skills = resumeData.skills || [];
              experienceYears = resumeData.experience_years || 0;
              resumeId = resumeSnapshot.docs[0].id;

              // Collect all skills for filter
              skills.forEach(skill => skillsSet.add(skill));
            }

            candidatesList.push({
              id: userDoc.id,
              name: userData.name || userData.email?.split('@')[0] || 'Unknown',
              email: userData.email || '',
              title: userData.title || 'Job Seeker',
              location: userData.location || 'Not specified',
              skills,
              experience_years: experienceYears,
              resumeId,
            });
          } catch (resumeError) {
            // User might not have a resume yet, still add them
            candidatesList.push({
              id: userDoc.id,
              name: userData.name || userData.email?.split('@')[0] || 'Unknown',
              email: userData.email || '',
              title: userData.title || 'Job Seeker',
              location: userData.location || 'Not specified',
              skills: [],
              experience_years: 0,
            });
          }
        }

        setCandidates(candidatesList);
        setAvailableSkills(Array.from(skillsSet).slice(0, 10));
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load candidates. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [toast]);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSkill = selectedSkill === 'all' || candidate.skills.includes(selectedSkill);
    return matchesSearch && matchesSkill;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatExperience = (years?: number) => {
    if (!years || years === 0) return 'Entry level';
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Browse Candidates
          </h1>
          <p className="text-muted-foreground">Find the perfect candidates for your open positions</p>
        </div>

        {/* AI Matching Banner */}
        <Card className="mb-6 ai-gradient text-white">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <h3 className="font-semibold">AI-Powered Matching</h3>
                <p className="text-sm opacity-90">Our AI analyzes candidate profiles to find the best matches for your job requirements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates by name, title, or skills..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {availableSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading candidates...</span>
          </div>
        )}

        {/* Candidates Grid */}
        {!isLoading && filteredCandidates.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">{candidate.title}</p>
                        </div>
                        {candidate.matchScore && (
                          <Badge className="bg-green-100 text-green-800">
                            {candidate.matchScore}% Match
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {candidate.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {formatExperience(candidate.experience_years)}
                        </span>
                      </div>
                      {candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {candidate.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1 ai-gradient text-white">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No candidates found</h3>
              <p className="text-muted-foreground">
                {candidates.length === 0
                  ? 'No candidates have signed up yet. Check back later!'
                  : 'Try adjusting your search or filters'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
