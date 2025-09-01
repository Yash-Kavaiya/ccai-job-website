import React, { useState, useEffect } from 'react';
import { useJobMatchingStore } from '@/store/job-matching-store';
import { useResumeStore } from '@/store/resume-store';
import OneClickApply from '@/components/jobs/OneClickApply';
import { JobAggregationPanel } from '@/components/jobs/JobAggregationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MapPin, 
  Building2, 
  Clock, 
  Star, 
  StarOff, 
  ExternalLink, 
  Filter,
  Sparkles,
  Target,
  TrendingUp,
  Loader2,
  RefreshCw,
  Bookmark,
  Send,
  Settings,
  Grid3X3,
  List,
  CheckCircle2,
  ArrowUpDown,
  DollarSign,
  Calendar,
  Users,
  Briefcase,
  X
} from 'lucide-react';

export default function JobSearchPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [showFilters, setShowFilters] = useState(false);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [showJDMatcher, setShowJDMatcher] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('relevance');
  const [showBulkApplyModal, setShowBulkApplyModal] = useState(false);
  
  // Filter states
  const [locationFilter, setLocationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [salaryRange, setSalaryRange] = useState([0, 300]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');

  const {
    jobs,
    filteredJobs,
    matches,
    loading,
    matchingInProgress,
    error,
    filters,
    searchHistory,
    userPreferences,
    searchJobs,
    aggregateJobs,
    findJobMatches,
    findJobMatchesByJD,
    applyFilters,
    filterByNiche,
    clearFilters,
    bookmarkJob,
    updateApplicationStatus,
    updateUserPreferences,
    getPersonalizedMatches,
    getJobById,
    clearError,
    // One-Click Apply functions
    addToBatchApply,
    batchApplyJobs,
    batchApplyToJobs,
  } = useJobMatchingStore();

  const { resumes } = useResumeStore();

  useEffect(() => {
    // Load existing jobs on component mount
    if (jobs.length === 0) {
      // Auto-aggregate jobs when page loads
      aggregateJobs();
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    await searchJobs(searchQuery);
    toast({
      title: "Search Complete",
      description: `Found ${jobs.length} job listings`,
    });
  };

  const handleFindMatches = async () => {
    if (resumes.length === 0) {
      toast({
        title: "Resume Required",
        description: "Please upload a resume first to find job matches",
        variant: "destructive",
      });
      return;
    }

    if (jobs.length === 0) {
      toast({
        title: "No Jobs Available",
        description: "Please search for jobs first",
        variant: "destructive",
      });
      return;
    }

    // Use the latest resume
    const latestResume = resumes[resumes.length - 1];
    const resumeText = latestResume?.filename || 'User Resume';
    
    await findJobMatches(resumeText);
    
    toast({
      title: "Matching Complete",
      description: `Found ${matches.length} potential matches`,
    });
    
    setActiveTab('matches');
  };

  const handleBookmark = async (jobId: string) => {
    await bookmarkJob(jobId);
    const job = getJobById(jobId);
    toast({
      title: "Bookmark Updated",
      description: `${job?.title} at ${job?.company}`,
    });
  };

  const handleApply = async (matchId: string, jobId: string) => {
    await updateApplicationStatus(matchId, 'applied');
    const job = getJobById(jobId);
    toast({
      title: "Application Status Updated",
      description: `Applied to ${job?.title} at ${job?.company}`,
    });
  };

  const handleJDMatch = async () => {
    if (!jobDescriptionText.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please paste a job description to find similar roles",
        variant: "destructive",
      });
      return;
    }

    await findJobMatchesByJD(jobDescriptionText);
    
    toast({
      title: "JD Matching Complete",
      description: `Found ${matches.length} similar job listings`,
    });
    
    setActiveTab('matches');
  };

  const handleNicheFilter = (niche: string) => {
    filterByNiche(niche);
    toast({
      title: "Niche Filter Applied",
      description: `Showing ${niche} related positions`,
    });
  };

  const handleSimilarityThresholdChange = (threshold: number) => {
    applyFilters({ similarity_threshold: threshold });
    toast({
      title: "Similarity Threshold Updated",
      description: `Now showing matches above ${(threshold * 100).toFixed(0)}%`,
    });
  };

  const handleJobSelect = (jobId: string, selected: boolean) => {
    const newSelection = new Set(selectedJobs);
    if (selected) {
      newSelection.add(jobId);
    } else {
      newSelection.delete(jobId);
    }
    setSelectedJobs(newSelection);
  };

  const handleSelectAll = () => {
    const allJobIds = new Set((activeTab === 'matches' ? matches : filteredJobs).map((item: any) => item.job_id || item.id));
    setSelectedJobs(allJobIds);
  };

  const handleDeselectAll = () => {
    setSelectedJobs(new Set());
  };

  const handleBulkApply = () => {
    if (selectedJobs.size === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select jobs to apply to",
        variant: "destructive",
      });
      return;
    }
    setShowBulkApplyModal(true);
  };

  const confirmBulkApply = async () => {
    const jobIds = Array.from(selectedJobs);
    // Add selected jobs to batch apply first
    jobIds.forEach(jobId => addToBatchApply(jobId));
    // Execute batch apply
    await batchApplyToJobs();
    setShowBulkApplyModal(false);
    setSelectedJobs(new Set());
    toast({
      title: "Applications Submitted",
      description: `Applied to ${jobIds.length} jobs successfully`,
    });
  };

  const applyAdvancedFilters = () => {
    const filters = {
      location: locationFilter,
      experience: experienceFilter,
      salary_min: salaryRange[0] * 1000,
      salary_max: salaryRange[1] * 1000,
      company: companyFilter,
      job_type: jobTypeFilter
    };
    applyFilters(filters);
    setShowFilters(false);
    toast({
      title: "Filters Applied",
      description: "Job listings updated with your criteria",
    });
  };

  const clearAllFilters = () => {
    setLocationFilter('');
    setExperienceFilter('');
    setSalaryRange([0, 300]);
    setCompanyFilter('');
    setJobTypeFilter('');
    clearFilters();
  };

  const renderJobCard = (job: any, match?: any) => {
    const jobId = job.id || job.job_id;
    const isSelected = selectedJobs.has(jobId);
    const isListView = viewMode === 'list';
    
    return (
      <Card key={jobId} className={`group hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''} ${isListView ? 'flex' : ''}`}>
        <CardHeader className={`${isListView ? 'flex-1' : ''} pb-3`}>
          <div className="flex items-start gap-3">
            {/* Selection Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleJobSelect(jobId, !!checked)}
              className="mt-1"
            />
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {job.title || job.job_title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4" />
                    {job.company}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  {match && (
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {(match.similarity_score * 100).toFixed(0)}% Match
                      </Badge>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmark(jobId)}
                    className="h-8 w-8 p-0"
                  >
                    {match?.is_bookmarked ? (
                      <Bookmark className="h-4 w-4 fill-current text-primary" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isListView ? 'flex-1' : ''} pb-3 ml-8`}>
          <div className="space-y-3">
            <div className={`grid ${isListView ? 'grid-cols-4' : 'grid-cols-2'} gap-4 text-sm text-muted-foreground`}>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.job_type || 'Full-time'}
              </div>
              {job.salary && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {job.posted_date || '2 days ago'}
              </div>
            </div>

            {!isListView && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            )}

            {(job.skills || []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(job.skills || []).slice(0, isListView ? 3 : 4).map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {(job.skills || []).length > (isListView ? 3 : 4) && (
                  <Badge variant="outline" className="text-xs">
                    +{(job.skills || []).length - (isListView ? 3 : 4)} more
                  </Badge>
                )}
              </div>
            )}

          {match && match.match_reasons && (
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-primary">Why this matches:</h4>
                <Badge variant="outline" className="text-xs">
                  {match.match_type === 'resume_vector' ? 'Resume Match' : 
                   match.match_type === 'job_description' ? 'JD Similarity' : 'AI Match'}
                </Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {match.match_reasons.slice(0, 3).map((reason: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Sparkles className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    {reason}
                  </li>
                ))}
                {match.match_reasons.length > 3 && (
                  <li className="text-xs text-muted-foreground/70 mt-1">
                    +{match.match_reasons.length - 3} more reasons
                  </li>
                )}
              </ul>
              {match.similarity_score >= 0.9 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <Target className="h-3 w-3" />
                  High-confidence match
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

        <CardFooter className={`flex items-center justify-between pt-3 border-t ml-8`}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{job.posted_date || '2 days ago'}</span>
            {job.applicants && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <Users className="h-3 w-3" />
                <span>{job.applicants} applicants</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <a 
                href={job.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View Details
              </a>
            </Button>
            
            <Button
              size="sm"
              onClick={() => match ? handleApply(match.id, jobId) : null}
              disabled={match?.application_status === 'applied'}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {match?.application_status === 'applied' ? 'Applied' : 'Apply Now'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Job Search & Matching</h1>
            <p className="text-muted-foreground">
              Find and match with AI-specialized positions using advanced similarity search
            </p>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="e.g., San Francisco, Remote"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any level</SelectItem>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                      <SelectItem value="lead">Lead/Principal (7+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Company</label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any company</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Microsoft">Microsoft</SelectItem>
                      <SelectItem value="Amazon">Amazon</SelectItem>
                      <SelectItem value="OpenAI">OpenAI</SelectItem>
                      <SelectItem value="Meta">Meta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Job Type</label>
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">
                  Salary Range: ${salaryRange[0]}K - ${salaryRange[1]}K
                </label>
                <Slider
                  value={salaryRange}
                  onValueChange={setSalaryRange}
                  max={300}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button onClick={applyAdvancedFilters}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions Bar */}
        {selectedJobs.size > 0 && (
          <Card className="mt-6 bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleBulkApply}>
                    Apply to {selectedJobs.size} Jobs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search Jobs
          </TabsTrigger>
          <TabsTrigger value="aggregation" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Job Aggregation
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-2">
            <Target className="h-4 w-4" />
            My Matches ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="apply" className="gap-2">
            <Send className="h-4 w-4" />
            One-Click Apply ({batchApplyJobs.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Controls */}
          <Card>
            <CardHeader>
              <CardTitle>AI Job Search & Vector Matching</CardTitle>
              <CardDescription>
                Search for AI jobs, upload JD for similarity matching, or aggregate from top sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Standard Search */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search for AI jobs (e.g., 'Machine Learning Engineer', 'CCAI Developer')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {/* JD Similarity Matcher */}
              <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Job Description Vector Matching</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowJDMatcher(!showJDMatcher)}
                  >
                    {showJDMatcher ? 'Hide' : 'Show'} JD Matcher
                  </Button>
                </div>
                
                {showJDMatcher && (
                  <div className="space-y-3">
                    <textarea
                      className="w-full h-32 p-3 border rounded-md resize-none text-sm"
                      placeholder="Paste a job description here to find similar roles using vector similarity search (Qdrant-style)..."
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleJDMatch} 
                        disabled={matchingInProgress}
                        size="sm"
                        className="gap-2"
                      >
                        {matchingInProgress ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Find Similar Jobs
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Similarity threshold:</span>
                        <select 
                          value={filters.similarity_threshold}
                          onChange={(e) => handleSimilarityThresholdChange(parseFloat(e.target.value))}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value={0.5}>50%</option>
                          <option value={0.6}>60%</option>
                          <option value={0.7}>70% (Recommended)</option>
                          <option value={0.8}>80%</option>
                          <option value={0.9}>90%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Niche Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Quick AI Specialization Filters</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Google CCAI',
                    'Microsoft Copilot', 
                    'Amazon Lex',
                    'OpenAI GPT',
                    'LangChain',
                    'Hugging Face',
                    'Computer Vision',
                    'NLP',
                    'MLOps'
                  ].map((niche) => (
                    <Button
                      key={niche}
                      variant={filters.company_niche === niche ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNicheFilter(niche)}
                      className="text-xs"
                    >
                      {niche}
                    </Button>
                  ))}
                  {filters.company_niche && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyFilters({ company_niche: '' })}
                      className="text-xs"
                    >
                      Clear Niche
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => aggregateJobs()}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Auto-Aggregate Jobs
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>

                <Button
                  onClick={handleFindMatches}
                  disabled={matchingInProgress || jobs.length === 0}
                  className="gap-2"
                >
                  {matchingInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Find Matches
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  <Select
                    value={filters.location}
                    onValueChange={(value) => applyFilters({ location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Location</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="san francisco">San Francisco</SelectItem>
                      <SelectItem value="new york">New York</SelectItem>
                      <SelectItem value="seattle">Seattle</SelectItem>
                      <SelectItem value="austin">Austin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.experience_level}
                    onValueChange={(value) => applyFilters({ experience_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Level</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="principal">Principal/Lead</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.job_type}
                    onValueChange={(value) => applyFilters({ job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Type</SelectItem>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((query, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery(query);
                          searchJobs(query);
                        }}
                        className="text-xs"
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Job Listings ({filteredJobs.length})
              </h2>
              
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading jobs...
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {filteredJobs.map(job => renderJobCard(job))}
              
              {filteredJobs.length === 0 && !loading && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try searching for AI positions or aggregating jobs
                    </p>
                    <Button onClick={() => aggregateJobs()} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Aggregate Latest Jobs
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="aggregation" className="space-y-6">
          <JobAggregationPanel />
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Job Matches</h2>
              <p className="text-muted-foreground">
                AI-powered matches based on your resume and preferences
              </p>
            </div>
            
            <Button
              onClick={handleFindMatches}
              disabled={matchingInProgress}
              className="gap-2"
            >
              {matchingInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Refresh Matches
            </Button>
          </div>

          <div className="grid gap-4">
            {matches.map(match => {
              const job = getJobById(match.job_id);
              return job ? renderJobCard(job, match) : null;
            })}
            
            {matches.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No matches yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a resume and search for jobs to find matches
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" asChild>
                      <a href="/resume">Upload Resume</a>
                    </Button>
                    <Button onClick={handleFindMatches} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Find Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* User Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Personalization Preferences</CardTitle>
              <CardDescription>
                Customize your job matching to get more relevant results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Preferred Locations</label>
                  <Input
                    placeholder="e.g., San Francisco, Remote"
                    value={userPreferences.preferred_locations.join(', ')}
                    onChange={(e) => updateUserPreferences({
                      preferred_locations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Focus Areas</label>
                  <Input
                    placeholder="e.g., NLP, Computer Vision, MLOps"
                    value={userPreferences.ai_focus_areas.join(', ')}
                    onChange={(e) => updateUserPreferences({
                      ai_focus_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Salary Range (USD)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={userPreferences.salary_expectations.min}
                      onChange={(e) => updateUserPreferences({
                        salary_expectations: {
                          ...userPreferences.salary_expectations,
                          min: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={userPreferences.salary_expectations.max}
                      onChange={(e) => updateUserPreferences({
                        salary_expectations: {
                          ...userPreferences.salary_expectations,
                          max: parseInt(e.target.value) || 500000
                        }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Career Level</label>
                  <Select
                    value={userPreferences.career_level}
                    onValueChange={(value) => updateUserPreferences({ career_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="principal">Principal/Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Search Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchHistory.length}</div>
                <p className="text-sm text-muted-foreground">Total searches</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Job Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{matches.length}</div>
                <p className="text-sm text-muted-foreground">Potential matches</p>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const personalizedMatches = getPersonalizedMatches();
                      toast({
                        title: "Personalized Ranking Applied",
                        description: `${personalizedMatches.length} matches reranked based on your preferences`,
                      });
                    }}
                    className="text-xs"
                  >
                    Apply Personalization
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {matches.filter(m => m.application_status === 'applied').length}
                </div>
                <p className="text-sm text-muted-foreground">Jobs applied to</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Match Quality Distribution</CardTitle>
              <CardDescription>
                How well your profile matches available positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { range: '90-100%', count: matches.filter(m => m.similarity_score >= 0.9).length, color: 'bg-green-500' },
                  { range: '80-89%', count: matches.filter(m => m.similarity_score >= 0.8 && m.similarity_score < 0.9).length, color: 'bg-blue-500' },
                  { range: '70-79%', count: matches.filter(m => m.similarity_score >= 0.7 && m.similarity_score < 0.8).length, color: 'bg-yellow-500' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium">{item.range}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all duration-300`}
                          style={{ width: `${matches.length > 0 ? (item.count / matches.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm text-muted-foreground text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apply" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <OneClickApply showBatchApply={true} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Apply Confirmation Modal */}
      <Dialog open={showBulkApplyModal} onOpenChange={setShowBulkApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Application</DialogTitle>
            <DialogDescription>
              You're about to apply to {selectedJobs.size} jobs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Your application will be automatically customized for each role using your resume and AI optimization.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Jobs selected:</span>
                <span className="font-medium">{selectedJobs.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Estimated time:</span>
                <span className="font-medium">{Math.ceil(selectedJobs.size * 0.5)} minutes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Success rate:</span>
                <span className="font-medium text-green-600">~85%</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkApplyModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBulkApply}>
              Apply to {selectedJobs.size} Jobs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}