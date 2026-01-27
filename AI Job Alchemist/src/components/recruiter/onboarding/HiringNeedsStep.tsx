import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, Clock, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { hiringUrgencyOptions } from '@/types/recruiter';
import type { HiringNeeds } from '@/types/recruiter';

const hiringNeedsSchema = z.object({
  rolesHiring: z.array(z.string()).min(1, 'Please add at least one role'),
  teamSize: z.number().min(1, 'Team size must be at least 1'),
  urgency: z.enum(['immediate', 'within_month', 'within_quarter', 'exploratory'], {
    required_error: 'Please select hiring urgency',
  }),
});

type HiringNeedsFormValues = z.infer<typeof hiringNeedsSchema>;

interface HiringNeedsStepProps {
  initialData?: Partial<HiringNeeds>;
  onNext: (data: HiringNeeds) => void;
  onBack: () => void;
}

const suggestedRoles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'DevOps Engineer',
  'AI/ML Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'QA Engineer',
];

export function HiringNeedsStep({ initialData, onNext, onBack }: HiringNeedsStepProps) {
  const { toast } = useToast();
  const [roleInput, setRoleInput] = useState('');

  const form = useForm<HiringNeedsFormValues>({
    resolver: zodResolver(hiringNeedsSchema),
    defaultValues: {
      rolesHiring: initialData?.rolesHiring || [],
      teamSize: initialData?.teamSize || 1,
      urgency: initialData?.urgency || undefined,
    },
  });

  const roles = form.watch('rolesHiring');

  const addRole = (role: string) => {
    const trimmedRole = role.trim();
    if (trimmedRole && !roles.includes(trimmedRole)) {
      form.setValue('rolesHiring', [...roles, trimmedRole]);
    }
    setRoleInput('');
  };

  const removeRole = (roleToRemove: string) => {
    form.setValue('rolesHiring', roles.filter(role => role !== roleToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRole(roleInput);
    }
  };

  const onSubmit = (data: HiringNeedsFormValues) => {
    onNext(data as HiringNeeds);
  };

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);
    const errorMessages = Object.values(errors)
      .map((err: any) => err.message)
      .join(', ');

    toast({
      title: "Please check the form",
      description: errorMessages || "Please fill in all required fields correctly.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 ai-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">What are your hiring needs?</h2>
        <p className="text-muted-foreground mt-2">
          Help us understand what roles you're looking to fill
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <FormField
            control={form.control}
            name="rolesHiring"
            render={() => (
              <FormItem>
                <FormLabel>Roles You're Hiring For</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Software Engineer"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addRole(roleInput)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {roles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role) => (
                          <Badge key={role} variant="secondary" className="px-3 py-1">
                            {role}
                            <button
                              type="button"
                              onClick={() => removeRole(role)}
                              className="ml-2 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Quick add:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedRoles
                          .filter(role => !roles.includes(role))
                          .slice(0, 5)
                          .map((role) => (
                            <Button
                              key={role}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addRole(role)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {role}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size (hiring for)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    How many people are you looking to hire?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hiring Urgency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hiringUrgencyOptions.map((option) => (
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
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="ai-gradient text-white">
              Complete Setup
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
