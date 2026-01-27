import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Github, Building, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface LoginFormProps {
  defaultView?: 'login' | 'signup';
  role?: 'candidate' | 'recruiter';
  hideTabs?: boolean;
  showRoleSelector?: boolean;
}

export function LoginForm({ defaultView = 'login', role = 'candidate', hideTabs = false, showRoleSelector = false }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter'>(role);
  const { loginWithEmail, signupWithEmail, loginWithGithub, loginWithGoogle, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab(defaultView);
  }, [defaultView]);

  const handleEmailAuth = async (isSignup: boolean) => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isSignup) {
        await signupWithEmail(email, password, selectedRole); // use selectedRole
        toast({
          title: "Account created!",
          description: `Welcome to AIJobHub${selectedRole === 'recruiter' ? ' for Recruiters' : ''}`,
        });
      } else {
        await loginWithEmail(email, password);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });
      }
    } catch (err: any) {
      toast({
        title: isSignup ? "Sign up failed" : "Login failed",
        description: error || err.message,
        variant: "destructive",
      });
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub(selectedRole);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with GitHub",
      });
    } catch (err: any) {
      toast({
        title: "GitHub login failed",
        description: error || err.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(selectedRole);
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
    } catch (err: any) {
      toast({
        title: "Google login failed",
        description: error || err.message,
        variant: "destructive",
      });
    }
  };

  const isRecruiter = selectedRole === 'recruiter';
  const title = isRecruiter ? 'Recruiter Portal' : 'Welcome to AIJobHub';

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center">
        <div className="w-12 h-12 ai-gradient rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
          {isRecruiter ? <Building className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-primary" />}
        </div>
        <CardTitle className="text-2xl">
          {title}
        </CardTitle>
        <CardDescription>
          {isRecruiter
            ? 'Find top AI talent for your organization'
            : 'Sign in to access your dashboard'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showRoleSelector && (
          <div className="mb-6">
            <Label className="text-base mb-3 block">I am a</Label>
            <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'candidate' | 'recruiter')} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="candidate" id="candidate" className="peer sr-only" />
                <Label
                  htmlFor="candidate"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <User className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Candidate</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="recruiter" id="recruiter" className="peer sr-only" />
                <Label
                  htmlFor="recruiter"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Building className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Recruiter</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
        {hideTabs ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-center mb-4">
              {activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </h3>
            {activeTab === 'login' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(false); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Work Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={isRecruiter ? "recruiter@company.com" : "name@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full ai-gradient text-white border-0" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(true); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Work Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={isRecruiter ? "recruiter@company.com" : "name@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full ai-gradient text-white border-0" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} className="w-full" onValueChange={(val) => {
            setActiveTab(val as 'login' | 'signup');
            clearError();
          }}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(false); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(true); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21-1.19-2.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Google
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGithubLogin} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
            GitHub
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}