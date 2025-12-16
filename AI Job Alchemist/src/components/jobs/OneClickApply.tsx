import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useJobMatchingStore } from '@/store/job-matching-store';
import { useResumeStore } from '@/store/resume-store';
import {
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Users,
  Clock,
  FileText,
  Settings,
  Loader2
} from 'lucide-react';

interface OneClickApplyProps {
  jobId?: string;
  showBatchApply?: boolean;
}

export default function OneClickApply({ jobId, showBatchApply = false }: OneClickApplyProps) {
  const { toast } = useToast();
  const {
    applicationData,
    batchApplyJobs,
    applyProgress,
    isApplying,
    dailyApplicationCount,
    applicationLimit,
    setupApplicationData,
    addToBatchApply,
    removeFromBatchApply,
    toggleBatchApplySelection,
    applyToJob,
    batchApplyToJobs,
    checkApplicationEligibility,
    getApplicationProgress,
    generateApplicationUrl,
  } = useJobMatchingStore();

  const { currentResume } = useResumeStore();
  const [showSetup, setShowSetup] = useState(!applicationData);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    coverLetter: '',
  });

  useEffect(() => {
    // Auto-populate from resume if available
    if (currentResume && !applicationData) {
      // For now, we'll let users manually fill the form
      // In a real implementation, this would extract data from the parsed resume
      setFormData(prev => ({
        ...prev,
        name: '',
        email: '',
        phone: '',
        summary: '',
      }));
    }
  }, [currentResume, applicationData]);

  const handleSetupApplication = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least your name and email.",
        variant: "destructive"
      });
      return;
    }

    const appData = {
      personal_info: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
      },
      resume_data: {
        summary: formData.summary,
        experience: [],
        education: [],
        skills: currentResume?.skills || [],
        projects: [],
      },
      cover_letter: formData.coverLetter,
    };

    setupApplicationData(appData);
    setShowSetup(false);

    toast({
      title: "Application Data Configured",
      description: "You're now ready to use One-Click Apply!",
    });
  };

  const handleSingleApply = async () => {
    if (!jobId) return;

    try {
      const eligibility = checkApplicationEligibility(jobId);
      if (!eligibility.canApply) {
        toast({
          title: "Cannot Apply",
          description: eligibility.reason,
          variant: "destructive"
        });
        return;
      }

      await applyToJob(jobId);

      toast({
        title: "Application Submitted",
        description: "Your application has been sent successfully!",
      });
    } catch (error) {
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleBatchApply = async () => {
    const selectedJobs = batchApplyJobs.filter(job => job.selected);

    if (selectedJobs.length === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select jobs to apply to.",
        variant: "destructive"
      });
      return;
    }

    if (dailyApplicationCount + selectedJobs.length > applicationLimit) {
      toast({
        title: "Daily Limit Exceeded",
        description: `You can only apply to ${applicationLimit - dailyApplicationCount} more jobs today.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await batchApplyToJobs();

      const successCount = applyProgress.filter(p => p.status === 'success').length;

      toast({
        title: "Batch Apply Complete",
        description: `Successfully applied to ${successCount} out of ${selectedJobs.length} jobs.`,
      });
    } catch (error) {
      toast({
        title: "Batch Apply Failed",
        description: "Some applications may have failed. Check the progress below.",
        variant: "destructive"
      });
    }
  };

  if (showSetup) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup One-Click Apply
          </CardTitle>
          <CardDescription>
            Configure your application data to enable one-click job applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="City, State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
            <div>
              <Label htmlFor="portfolio">Portfolio/Website</Label>
              <Input
                id="portfolio"
                value={formData.portfolio}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                placeholder="https://johndoe.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief professional summary..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="coverLetter">Default Cover Letter Template</Label>
            <Textarea
              id="coverLetter"
              value={formData.coverLetter}
              onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
              placeholder="Dear Hiring Manager,..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSetupApplication} className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              Enable One-Click Apply
            </Button>
            <Button variant="outline" onClick={() => setShowSetup(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Application Limit Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Daily Application Limit</CardTitle>
            <Badge variant={dailyApplicationCount >= applicationLimit ? "destructive" : "secondary"}>
              {dailyApplicationCount} / {applicationLimit}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={(dailyApplicationCount / applicationLimit) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {applicationLimit - dailyApplicationCount} applications remaining today
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue={jobId ? "single" : "batch"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {jobId && (
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Apply to Job
            </TabsTrigger>
          )}
          {showBatchApply && (
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Batch Apply ({batchApplyJobs.filter(j => j.selected).length})
            </TabsTrigger>
          )}
        </TabsList>

        {jobId && (
          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  One-Click Apply
                </CardTitle>
                <CardDescription>
                  Apply instantly using your configured application data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{applicationData?.personal_info.name}</p>
                      <p className="text-sm text-muted-foreground">{applicationData?.personal_info.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSetup(true)}
                  >
                    Edit Data
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSingleApply}
                    disabled={isApplying || dailyApplicationCount >= applicationLimit}
                    className="flex-1"
                  >
                    {isApplying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Apply Now
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => window.open(generateApplicationUrl(jobId), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showBatchApply && (
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Batch Apply to Multiple Jobs
                </CardTitle>
                <CardDescription>
                  Select jobs and apply to multiple positions at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {batchApplyJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No jobs added to batch apply</p>
                    <p className="text-sm">Use "Add to Batch" on job cards to get started</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {batchApplyJobs.map((job) => (
                          <div
                            key={job.job_id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={job.selected}
                                onChange={() => toggleBatchApplySelection(job.job_id)}
                                className="rounded"
                              />
                              <div>
                                <p className="font-medium">{job.title}</p>
                                <p className="text-sm text-muted-foreground">{job.company}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.can_auto_apply ? "secondary" : "outline"}>
                                {job.apply_method}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromBatchApply(job.job_id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        onClick={handleBatchApply}
                        disabled={isApplying || batchApplyJobs.filter(j => j.selected).length === 0}
                        className="flex-1"
                      >
                        {isApplying ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Apply to Selected ({batchApplyJobs.filter(j => j.selected).length})
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Application Progress */}
      {applyProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Application Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {applyProgress.map((progress) => (
                  <div key={progress.job_id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {progress.status === 'pending' && (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      {progress.status === 'applying' && (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                      {progress.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {progress.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {progress.status === 'requires_manual' && (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">Job ID: {progress.job_id}</p>
                      <p className="text-sm text-muted-foreground">{progress.message}</p>
                      {progress.error_details && (
                        <p className="text-xs text-red-500 mt-1">{progress.error_details}</p>
                      )}
                    </div>
                    {progress.application_url && progress.status === 'requires_manual' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(progress.application_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}