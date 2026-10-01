import React, { useState } from 'react';
import { FileText, Upload, BarChart3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { ResumeManager } from '@/components/resume/ResumeManager';
import { ATSResults } from '@/components/resume/ATSResults';
import { useResumeStore } from '@/store/resume-store';

export function ResumePage() {
  const { resumes, currentResume, fetchResumes } = useResumeStore();
  const [activeTab, setActiveTab] = useState('upload');

  React.useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  React.useEffect(() => {
    if (currentResume?.analysis && !currentResume.isAnalyzing) {
      setActiveTab('analysis');
    }
  }, [currentResume?.analysis, currentResume?.isAnalyzing]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume</h1>
        <p className="text-muted-foreground mt-1">
          Upload, manage, and analyze resumes for ATS compatibility.
        </p>
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-accent" />
            Resume management & analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Manage</span>
                {resumes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {resumes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="flex items-center gap-2"
                disabled={!currentResume?.analysis}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analysis</span>
                {currentResume?.analysis && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {currentResume.analysis.ats_score}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <ResumeUpload />
            </TabsContent>

            <TabsContent value="manage" className="mt-6">
              <ResumeManager />
            </TabsContent>

            <TabsContent value="analysis" className="mt-6">
              {currentResume?.analysis ? (
                <div className="space-y-6">
                  <div className="pb-2">
                    <h3 className="text-lg font-semibold mb-1">
                      Analysis for “{currentResume.name}”
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      ATS evaluation and recommendations
                    </p>
                  </div>
                  <ATSResults
                    analysis={currentResume.analysis}
                    isAnalyzing={currentResume.isAnalyzing}
                  />
                </div>
              ) : currentResume?.isAnalyzing ? (
                <ATSResults analysis={{} as any} isAnalyzing={true} />
              ) : (
                <div className="p-8 text-center rounded-xl border">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No resume selected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a resume or select an existing one to view analysis results
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setActiveTab('upload')} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    {resumes.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('manage')}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5" />
            Tips for better ATS scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Keywords & skills</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Mirror keywords from target job descriptions</li>
                <li>• Name tools: TensorFlow, PyTorch, scikit-learn</li>
                <li>• Include cloud platforms: AWS, GCP, Azure</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Format & structure</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use standard section headers</li>
                <li>• Quantify achievements with metrics</li>
                <li>• Keep formatting consistent</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
