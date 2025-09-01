import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Search, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Users,
  Zap,
  Target,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  ShieldCheck,
  Upload,
  ChevronRight,
  Play,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Menu,
  X,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { LoginForm } from '@/components/auth/LoginForm';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  if (isAuthenticated) {
    // Redirect to dashboard - this will be handled by routing
    return null;
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate('/jobs', { state: { searchQuery } });
    }
  };

  const handleUploadResume = () => {
    navigate('/resume');
  };

  const handleViewJobs = () => {
    navigate('/jobs');
  };

  const handleStartJourney = () => {
    setShowAuthModal(true);
    setAuthMode('signup');
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
    setAuthMode('login');
  };

  const handleSignUp = () => {
    setShowAuthModal(true);
    setAuthMode('signup');
  };

  const handleJobClick = (job: any) => {
    navigate('/jobs', { state: { selectedJob: job } });
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Job Matching',
      description: 'Advanced algorithms match you with perfect AI roles at top companies like Google, Microsoft, and Amazon.',
      badge: 'Smart'
    },
    {
      icon: FileText,
      title: 'Resume ATS Optimization',
      description: 'Get instant ATS scores and AI-generated suggestions to improve your resume for AI positions.',
      badge: 'Essential'
    },
    {
      icon: MessageSquare,
      title: 'Mock AI Interviews',
      description: 'Practice with AI interviewers for roles in CCAI, Copilot development, Amazon Lex, and more.',
      badge: 'Beta'
    },
    {
      icon: Search,
      title: 'Multi-Source Job Aggregation',
      description: 'Search jobs from LinkedIn, Indeed, Twitter/X, Reddit, and company websites in one place.',
      badge: 'Comprehensive'
    },
    {
      icon: Zap,
      title: 'One-Click Applications',
      description: 'Apply to multiple jobs instantly with AI-optimized applications tailored for each role.',
      badge: 'Fast'
    },
    {
      icon: TrendingUp,
      title: 'Market Intelligence',
      description: 'Stay ahead with AI job market trends, salary insights, and skill demand analytics.',
      badge: 'Insights'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'AI Jobs Tracked' },
    { number: '500+', label: 'Companies Monitored' },
    { number: '95%', label: 'Match Accuracy' },
    { number: '3x', label: 'Faster Applications' }
  ];

  const specializations = [
    'Google Cloud CCAI',
    'Microsoft Copilots',
    'Amazon Lex',
    'Dialogflow',
    'OpenAI Integration',
    'LangChain',
    'Vector Databases',
    'AI Agents',
    'Machine Learning',
    'NLP Engineering'
  ];

  const featuredJobs = [
    {
      title: 'Microsoft Copilot Engineer',
      company: 'Microsoft',
      location: 'Seattle, WA',
      salary: '$150K - $200K',
      type: 'Full-time',
      posted: '2 days ago',
      tags: ['AI', 'Copilot', 'TypeScript', 'Azure'],
      match: 95
    },
    {
      title: 'Google CCAI Specialist',
      company: 'Google',
      location: 'Mountain View, CA',
      salary: '$160K - $220K',
      type: 'Full-time',
      posted: '1 day ago',
      tags: ['CCAI', 'Dialogflow', 'GCP', 'Python'],
      match: 92
    },
    {
      title: 'Amazon Lex Developer',
      company: 'Amazon',
      location: 'Austin, TX',
      salary: '$140K - $185K',
      type: 'Full-time',
      posted: '3 days ago',
      tags: ['Lex', 'AWS', 'Conversational AI', 'Node.js'],
      match: 88
    },
    {
      title: 'AI Agent Developer',
      company: 'OpenAI',
      location: 'San Francisco, CA',
      salary: '$180K - $250K',
      type: 'Full-time',
      posted: '1 day ago',
      tags: ['AI Agents', 'LangChain', 'Python', 'ML'],
      match: 94
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">CCAI Jobs by AI-Powered Careers Easy AI Labs</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-accent transition-colors">
                Features
              </a>
              <a href="#jobs" className="text-sm font-medium hover:text-accent transition-colors">
                Jobs
              </a>
              <a href="#about" className="text-sm font-medium hover:text-accent transition-colors">
                About
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-accent transition-colors">
                Pricing
              </a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={handleSignIn} className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
              <Button onClick={handleSignUp} className="ai-gradient text-white border-0 gap-2">
                <UserPlus className="w-4 h-4" />
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl">CCAI Jobs by AI-Powered Careers Easy AI Labs</span>
                  </div>
                  
                  <nav className="flex flex-col gap-4">
                    <a href="#features" className="text-sm font-medium hover:text-accent transition-colors">
                      Features
                    </a>
                    <a href="#jobs" className="text-sm font-medium hover:text-accent transition-colors">
                      Jobs
                    </a>
                    <a href="#about" className="text-sm font-medium hover:text-accent transition-colors">
                      About
                    </a>
                    <a href="#pricing" className="text-sm font-medium hover:text-accent transition-colors">
                      Pricing
                    </a>
                  </nav>

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleSignIn} className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                    <Button onClick={handleSignUp} className="ai-gradient text-white border-0 gap-2">
                      <UserPlus className="w-4 h-4" />
                      Get Started
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="ai-gradient text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Career Platform
                </Badge>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  Land Your Dream
                  <span className="block ai-gradient bg-clip-text text-transparent">
                    AI Job Today
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  The only platform specialized for AI careers. Get matched with roles at Google, Microsoft, Amazon, and top AI companies using advanced algorithms and automated tools.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {specializations.slice(0, 8).map((spec) => (
                  <Badge key={spec} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  +2 more
                </Badge>
              </div>

              {/* Hero CTAs */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={handleSignUp} className="ai-gradient text-white border-0 gap-2 text-lg px-8 py-6">
                    <UserPlus className="w-5 h-5" />
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6" onClick={handleSignIn}>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Button>
                </div>

                {/* Hero Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs by title, company, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-base"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button size="lg" onClick={handleSearch} variant="secondary" className="gap-2 shrink-0">
                    <Search className="w-4 h-4" />
                    Search Jobs
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="ghost" className="gap-2" onClick={handleUploadResume}>
                    <Upload className="w-4 h-4" />
                    Upload Resume to Get Started
                  </Button>
                  <Button size="lg" variant="ghost" className="gap-2" onClick={() => navigate('/interview')}>
                    <Play className="w-4 h-4" />
                    Try Mock Interview
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t max-w-3xl mx-auto">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-bold ai-gradient bg-clip-text text-transparent">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 ai-gradient opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent opacity-10 rounded-full blur-2xl"></div>
      </section>

      {/* Featured Jobs Section */}
      <section id="jobs" className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <Badge className="mb-4" variant="outline">
                <TrendingUp className="w-3 h-3 mr-1" />
                Hot Jobs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured AI Roles
              </h2>
              <p className="text-lg text-muted-foreground">
                Top opportunities at leading companies. Updated daily.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold ai-gradient bg-clip-text text-transparent">100+</div>
              <div className="text-sm text-muted-foreground">CCAI Jobs Aggregated Daily</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJobs.map((job) => (
              <Card key={`${job.company}-${job.title}`} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg group cursor-pointer" onClick={() => handleJobClick(job)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-accent" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {job.match}% Match
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-accent transition-colors">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="font-medium text-foreground">
                    {job.company}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {job.posted}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button className="w-full group/btn" variant="outline">
                    View Details
                    <ChevronRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="gap-2" onClick={handleViewJobs}>
              View All AI Jobs
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              <Target className="w-3 h-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Land AI Jobs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with deep industry knowledge to accelerate your career in artificial intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 ai-gradient rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Trusted by AI Professionals
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Privacy-First, GDPR Compliant
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your data is encrypted, anonymized, and never shared. We comply with all data protection regulations while helping you succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 success-color" />
                </div>
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  End-to-end encryption for all resume data and personal information with zero-knowledge architecture.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 success-color" />
                </div>
                <CardTitle>Professional Network</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with AI professionals at FAANG companies and leading AI startups worldwide.
                </CardDescription>
              </CardContent>
              </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 success-color" />
                </div>
                <CardTitle>AI Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built by AI engineers who understand the unique challenges of landing roles in artificial intelligence.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              <Target className="w-3 h-3 mr-1" />
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Free, Scale as You Grow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your career goals. All plans include core features with advanced capabilities for premium users.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Basic job search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Resume upload & basic ATS scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">5 mock interviews per month</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={handleSignUp}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl relative ai-gradient-border">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="ai-gradient text-white border-0">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>For serious job seekers</CardDescription>
                <div className="text-3xl font-bold">$29<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Advanced AI job matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Unlimited mock interviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">AI resume optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">One-click applications</span>
                  </div>
                </div>
                <Button className="w-full ai-gradient text-white border-0" onClick={handleSignUp}>
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For teams and organizations</CardDescription>
                <div className="text-3xl font-bold">Custom</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Team management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline" onClick={handleSignUp}>
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 ai-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Accelerate Your AI Career?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of AI professionals who've landed roles at top companies using our platform.
          </p>
          <Button size="lg" variant="secondary" className="gap-2" onClick={handleStartJourney}>
            Start Your Journey
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">CCAI Jobs by AI-Powered Careers Easy AI Labs</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              The premier platform for AI career advancement. Find your next role in artificial intelligence.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Privacy</button>
              <button className="hover:text-foreground transition-colors">Terms</button>
              <button className="hover:text-foreground transition-colors">Support</button>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 CCAI Jobs by AI-Powered Careers Easy AI Labs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <Sheet open={showAuthModal} onOpenChange={setShowAuthModal}>
        <SheetContent side="right" className="w-full sm:w-96 sm:max-w-md">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">CCAI Jobs by AI-Powered Careers Easy AI Labs</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={authMode === 'login' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAuthMode('login')}
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === 'signup' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAuthMode('signup')}
                >
                  Sign Up
                </Button>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {authMode === 'login' ? 'Welcome back!' : 'Join CCAI Jobs by AI-Powered Careers Easy AI Labs'}
                </h2>
                <p className="text-muted-foreground">
                  {authMode === 'login' 
                    ? 'Sign in to continue your AI career journey' 
                    : 'Start your AI career journey today'
                  }
                </p>
              </div>
              
              <LoginForm />
              
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-accent hover:underline font-medium"
                  >
                    {authMode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default HomePage;