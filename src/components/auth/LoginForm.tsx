import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'email' | 'otp';

export function LoginForm() {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { sendOTP, verifyOTP, isLoading } = useAuthStore();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendOTP(email);
      setStep('otp');
      toast({
        title: "Code sent!",
        description: `Verification code sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send code",
        description: "Please check your email and try again",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast({
        title: "Verification code required",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyOTP(email, otp);
      toast({
        title: "Welcome to AIJobHub!",
        description: "You've successfully logged in",
      });
    } catch (error) {
      toast({
        title: "Invalid code",
        description: "Please check your code and try again",
        variant: "destructive",
      });
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 ai-gradient rounded-full flex items-center justify-center mx-auto mb-4">
          {step === 'email' ? (
            <Mail className="w-6 h-6 text-white" />
          ) : (
            <Shield className="w-6 h-6 text-white" />
          )}
        </div>
        <CardTitle className="text-2xl">
          {step === 'email' ? 'Sign in to AIJobHub' : 'Enter verification code'}
        </CardTitle>
        <CardDescription>
          {step === 'email' 
            ? 'Enter your email to get started with AI-powered job search'
            : `We sent a verification code to ${email}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'email' ? (
          <div key="email-form">
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  'Send verification code'
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div key="otp-form">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={handleBackToEmail}
                disabled={isLoading}
              >
                Back to email
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}