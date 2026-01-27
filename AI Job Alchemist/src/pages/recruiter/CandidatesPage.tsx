import { useState } from 'react';
import { Search, Filter, Users, Brain, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Mock candidates data
const mockCandidates = [
  {
    id: '1',
    name: 'Alex Johnson',
    title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    experience: '8 years',
    matchScore: 95,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    title: 'Full Stack Developer',
    location: 'New York, NY',
    skills: ['Python', 'Django', 'React', 'PostgreSQL'],
    experience: '5 years',
    matchScore: 88,
  },
  {
    id: '3',
    name: 'Michael Brown',
    title: 'DevOps Engineer',
    location: 'Austin, TX',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
    experience: '6 years',
    matchScore: 82,
  },
  {
    id: '4',
    name: 'Emily Davis',
    title: 'Product Manager',
    location: 'Seattle, WA',
    skills: ['Agile', 'Roadmapping', 'User Research', 'Analytics'],
    experience: '7 years',
    matchScore: 78,
  },
];

export function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');

  const filteredCandidates = mockCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = selectedSkill === 'all' || candidate.skills.includes(selectedSkill);
    return matchesSearch && matchesSkill;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
              <SelectItem value="React">React</SelectItem>
              <SelectItem value="Python">Python</SelectItem>
              <SelectItem value="TypeScript">TypeScript</SelectItem>
              <SelectItem value="Node.js">Node.js</SelectItem>
              <SelectItem value="AWS">AWS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Candidates Grid */}
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
                      <Badge className="bg-green-100 text-green-800">
                        {candidate.matchScore}% Match
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {candidate.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {candidate.experience}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {candidate.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
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

        {filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No candidates found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
