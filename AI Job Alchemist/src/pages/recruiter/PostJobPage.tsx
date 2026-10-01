import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRecruiterStore } from '@/store/recruiter-store';
import type { JobPosting } from '@/types/recruiter';

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(20, 'Requirements must be at least 20 characters'),
  location: z.string().min(2, 'Location is required'),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  remotePolicy: z.enum(['remote', 'hybrid', 'onsite']),
  status: z.enum(['draft', 'active', 'paused', 'closed']),
});

type JobFormValues = z.infer<typeof jobSchema>;

type NewJobPosting = Omit<
  JobPosting,
  'id' | 'recruiterId' | 'views' | 'applicationsCount' | 'createdAt' | 'updatedAt'
>;

export function PostJobPage() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId?: string }>();
  const isEditing = Boolean(jobId);
  const { toast } = useToast();
  const { createJob, updateJob, postedJobs, loadPostedJobs, isLoading } = useRecruiterStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrating, setIsHydrating] = useState(isEditing);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      location: '',
      jobType: 'full-time',
      remotePolicy: 'hybrid',
      status: 'active',
    },
  });

  useEffect(() => {
    if (!isEditing) {
      setIsHydrating(false);
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      setIsHydrating(true);
      try {
        if (postedJobs.length === 0) {
          await loadPostedJobs();
        }
        const jobs = useRecruiterStore.getState().postedJobs;
        const existing = jobs.find((job) => job.id === jobId);
        if (!existing) {
          if (!cancelled) {
            toast({
              title: 'Job not found',
              description: 'This posting may have been deleted.',
              variant: 'destructive',
            });
            navigate('/recruiter/jobs');
          }
          return;
        }
        if (!cancelled) {
          form.reset({
            title: existing.title || '',
            description: existing.description || '',
            requirements: Array.isArray(existing.requirements)
              ? existing.requirements.join('\n')
              : String(existing.requirements || ''),
            location: existing.location || '',
            salaryMin: existing.salaryMin,
            salaryMax: existing.salaryMax,
            jobType: existing.jobType || 'full-time',
            remotePolicy: existing.remotePolicy || 'hybrid',
            status: existing.status || 'active',
          });
        }
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [isEditing, jobId, postedJobs.length, loadPostedJobs, form, navigate, toast]);

  const onSubmit = async (data: JobFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: Partial<NewJobPosting> = {
        title: data.title,
        description: data.description,
        requirements: data.requirements
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        jobType: data.jobType,
        remotePolicy: data.remotePolicy,
        status: data.status,
      };

      if (isEditing && jobId) {
        await updateJob(jobId, payload);
        toast({
          title: 'Job updated',
          description: 'Your job listing changes were saved.',
        });
      } else {
        const createPayload: NewJobPosting = {
          ...payload,
          title: data.title,
          description: data.description,
          requirements: payload.requirements as string[],
          location: data.location,
          jobType: data.jobType,
          remotePolicy: data.remotePolicy,
          status: data.status === 'paused' || data.status === 'closed' ? 'draft' : data.status,
        };
        await createJob(createPayload);
        toast({
          title: 'Job Posted!',
          description: 'Your job listing is now live.',
        });
      }

      navigate('/recruiter/jobs');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || (isEditing ? 'Failed to update job.' : 'Failed to create job posting.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/recruiter/jobs')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {isEditing ? 'Edit Job' : 'Post a New Job'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update the details for this job listing'
                : 'Fill in the details below to create a new job listing'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHydrating || isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading job…</p>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Senior Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter each requirement on a new line..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter each requirement on a separate line
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="e.g., San Francisco, CA" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="remotePolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remote Policy</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select remote policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="remote">Fully Remote</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="onsite">On-site</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salaryMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Salary (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="e.g., 80000"
                                className="pl-10"
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salaryMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Salary (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="e.g., 120000"
                                className="pl-10"
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full-time">Full-time</SelectItem>
                              <SelectItem value="part-time">Part-time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publish Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Publish Now</SelectItem>
                              <SelectItem value="draft">Save as Draft</SelectItem>
                              {isEditing && (
                                <>
                                  <SelectItem value="paused">Paused</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/recruiter/jobs')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="ai-gradient text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? isEditing
                          ? 'Saving…'
                          : 'Publishing…'
                        : isEditing
                          ? 'Save Changes'
                          : 'Publish Job'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
