import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Globe, Briefcase, Users, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { companySizeOptions, industryOptions } from '@/types/recruiter';

const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
  industry: z.string().min(1, 'Please select an industry'),
  website: z.string().url('Please enter a valid URL').or(z.literal('')),
});

type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export function CompanySettingsPage() {
  const { toast } = useToast();
  const { companyProfile, hiringNeeds, loadRecruiterProfile, isLoading } = useRecruiterStore();

  useEffect(() => {
    loadRecruiterProfile();
  }, [loadRecruiterProfile]);

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: companyProfile?.name || '',
      size: companyProfile?.size || 'startup',
      industry: companyProfile?.industry || '',
      website: companyProfile?.website || '',
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (companyProfile) {
      form.reset({
        name: companyProfile.name,
        size: companyProfile.size,
        industry: companyProfile.industry,
        website: companyProfile.website,
      });
    }
  }, [companyProfile, form]);

  const onSubmit = async (data: CompanySettingsFormValues) => {
    try {
      // TODO: Implement update in recruiter store
      toast({
        title: 'Settings saved',
        description: 'Your company profile has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Company Settings
          </h1>
          <p className="text-muted-foreground">Manage your company profile and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>
              This information will be shown to candidates viewing your job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="e.g., Acme Corporation"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companySizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {industryOptions.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="https://www.example.com"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Your company's website URL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="ai-gradient text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Hiring Needs Summary */}
        {hiringNeeds && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hiring Information</CardTitle>
              <CardDescription>
                Your current hiring needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Roles Hiring For</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {hiringNeeds.rolesHiring?.map((role) => (
                      <span key={role} className="px-2 py-1 bg-muted rounded text-sm">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                    <p className="text-lg">{hiringNeeds.teamSize} people</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hiring Urgency</p>
                    <p className="text-lg capitalize">{hiringNeeds.urgency?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
