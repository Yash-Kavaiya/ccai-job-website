import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRecruiterStore } from '@/store/recruiter-store';
import { OnboardingProgress } from './OnboardingProgress';
import { CompanyInfoStep } from './CompanyInfoStep';
import { HiringNeedsStep } from './HiringNeedsStep';
import type { CompanyProfile, HiringNeeds } from '@/types/recruiter';

const ONBOARDING_STEPS = [
  { title: 'Company Info', description: 'About your organization' },
  { title: 'Hiring Needs', description: 'What you\'re looking for' },
];

export function RecruiterOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    companyProfile,
    hiringNeeds,
    setCompanyProfile,
    setHiringNeeds,
    completeOnboarding,
  } = useRecruiterStore();

  const handleCompanyInfoNext = (data: CompanyProfile) => {
    setCompanyProfile(data);
    setCurrentStep(2);
  };

  const handleHiringNeedsNext = async (data: HiringNeeds) => {
    setHiringNeeds(data);
    setIsSubmitting(true);

    try {
      await completeOnboarding();
      toast({
        title: 'Welcome aboard!',
        description: 'Your recruiter profile has been created successfully.',
      });
      navigate('/recruiter/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardContent className="pt-8 pb-8">
            <OnboardingProgress
              currentStep={currentStep}
              totalSteps={ONBOARDING_STEPS.length}
              steps={ONBOARDING_STEPS}
            />

            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Setting up your account...</p>
                <p className="text-muted-foreground">This will only take a moment</p>
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <CompanyInfoStep
                    initialData={companyProfile || undefined}
                    onNext={handleCompanyInfoNext}
                  />
                )}

                {currentStep === 2 && (
                  <HiringNeedsStep
                    initialData={hiringNeeds || undefined}
                    onNext={handleHiringNeedsNext}
                    onBack={handleBack}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          You can update this information later in your settings
        </p>
      </div>
    </div>
  );
}
