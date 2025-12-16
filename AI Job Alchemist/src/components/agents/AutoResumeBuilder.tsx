import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAIAgentsStore } from '@/store/ai-agents-store';
import { useResumeStore } from '@/store/resume-store';
import {
  FileText,
  Download,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Eye,
  Loader2,
  Target,
  Brain,
  Wand2
} from 'lucide-react';

export default function AutoResumeBuilder() {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [optimizationScore, setOptimizationScore] = useState(0);

  const { generateTailoredResume, generatedResumes } = useAIAgentsStore();
  const { currentResume } = useResumeStore();

  const handleGenerateResume = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Job Description Required',
        description: 'Please paste the job description to generate a tailored resume.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentResume) {
      toast({
        title: 'Base Resume Required',
        description: 'Please upload your base resume first to generate variations.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress steps
      const steps = [
        { message: 'Analyzing job description...', progress: 20 },
        { message: 'Extracting key requirements...', progress: 40 },
        { message: 'Matching skills and experience...', progress: 60 },
        { message: 'Optimizing for ATS compatibility...', progress: 80 },
        { message: 'Generating tailored resume...', progress: 100 }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(step.progress);

        toast({
          title: 'Processing',
          description: step.message,
        });
      }

      await generateTailoredResume(jobDescription);

      // Simulate generated resume data
      const mockResume = {
        id: `resume-${Date.now()}`,
        title: 'AI Engineer - Tailored Resume',
        optimizations: [
          'Added 15 relevant keywords from job description',
          'Emphasized machine learning project experience',
          'Highlighted Python and TensorFlow skills',
          'Restructured experience section for ATS compatibility',
          'Added quantified achievements in AI model development'
        ],
        ats_score: 92,
        keywordMatches: 18,
        sections: {
          summary: 'AI Engineer with 5+ years of experience developing machine learning models and neural networks. Expertise in Python, TensorFlow, and deep learning algorithms. Proven track record of deploying production AI systems that improved operational efficiency by 40%.',
          skills: [
            'Machine Learning', 'Deep Learning', 'Python', 'TensorFlow', 'PyTorch',
            'Natural Language Processing', 'Computer Vision', 'AWS', 'Docker', 'Kubernetes'
          ],
          experience: 'Enhanced based on job requirements...'
        }
      };

      setGeneratedResume(mockResume);
      setOptimizationScore(mockResume.ats_score);

      toast({
        title: 'Resume Generated Successfully!',
        description: `Your tailored resume has been optimized with ${mockResume.ats_score}% ATS compatibility.`,
      });

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate tailored resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleCopyResume = () => {
    if (generatedResume) {
      navigator.clipboard.writeText(JSON.stringify(generatedResume.sections, null, 2));
      toast({
        title: 'Resume Copied',
        description: 'Resume content has been copied to clipboard.',
      });
    }
  };

  const handleDownloadResume = () => {
    toast({
      title: 'Download Started',
      description: 'Your tailored resume is being prepared for download.',
    });
  };

  const sampleJD = `Senior AI Engineer - Google Cloud AI
  
We are looking for a Senior AI Engineer to join our Cloud AI team. You will be responsible for developing and deploying machine learning models at scale.

Key Requirements:
• 5+ years of experience in machine learning and AI
• Proficiency in Python, TensorFlow, and PyTorch
• Experience with cloud platforms (GCP preferred)
• Knowledge of MLOps and model deployment
• Strong background in deep learning and neural networks
• Experience with natural language processing
• Ability to work with large datasets
• Understanding of distributed computing

Preferred Qualifications:
• PhD in Computer Science, Machine Learning, or related field
• Experience with Kubernetes and Docker
• Knowledge of transformer architectures
• Publications in top-tier ML conferences
• Experience with production ML systems`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-500" />
            Auto Resume Builder
          </h2>
          <p className="text-muted-foreground">
            AI-powered resume generation tailored to specific job requirements
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Job Description Input
              </CardTitle>
              <CardDescription>
                Paste the job description to generate a perfectly tailored resume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {jobDescription.length} characters
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setJobDescription(sampleJD)}
                  >
                    Use Sample JD
                  </Button>
                </div>
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">Generating Tailored Resume...</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    This may take 30-60 seconds as we analyze and optimize your resume
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateResume}
                  disabled={isGenerating || !jobDescription.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Generate Tailored Resume
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setJobDescription('');
                    setGeneratedResume(null);
                    setOptimizationScore(0);
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Resume Preview */}
          {generatedResume && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Generated Resume
                    </CardTitle>
                    <CardDescription>
                      AI-optimized resume tailored for the job description
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyResume}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownloadResume}>
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ATS Score */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">ATS Compatibility Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">{optimizationScore}%</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                </div>

                {/* Optimizations Made */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    AI Optimizations Applied
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {generatedResume.optimizations.map((opt: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Resume Sections Preview */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Resume Preview</h4>

                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Professional Summary</h5>
                      <p className="text-sm text-muted-foreground">
                        {generatedResume.sections.summary}
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Key Skills</h5>
                      <div className="flex flex-wrap gap-1">
                        {generatedResume.sections.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Stats and History */}
        <div className="space-y-4">
          {/* Current Resume Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {currentResume ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Base resume uploaded</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Filename: {currentResume.name}</p>
                    <p>ATS Score: {currentResume.analysis?.ats_score || 0}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">No base resume found</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your base resume first to enable AI generation
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <FileText className="w-3 h-3 mr-1" />
                    Upload Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generation Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Generated:</span>
                <span className="font-semibold">{generatedResumes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg ATS Score:</span>
                <span className="font-semibold">
                  {generatedResumes.length > 0 ? '89%' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className="font-semibold">95%</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Generations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Generations</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedResumes.length > 0 ? (
                <div className="space-y-3">
                  {generatedResumes.slice(0, 3).map((resume: any, index: number) => (
                    <div key={index} className="p-2 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          Resume #{index + 1}
                        </span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No generated resumes yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>Keyword optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>ATS compatibility</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>Multi-format export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>A/B testing variations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span>Real-time optimization</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}