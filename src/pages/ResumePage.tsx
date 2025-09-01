import React, { useState } from 'react';
import { FileText, Upload, BarChart3, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ResumeHeader } from '@/components/resume/ResumeHeader';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { ResumeManager } from '@/components/resume/ResumeManager';
import { ATSResults } from '@/components/resume/ATSResults';
import { useResumeStore } from '@/store/resume-store';

export function ResumePage() {
  const { resumes, currentResume } = useResumeStore();
  const [activeTab, setActiveTab] = useState('upload');

  // Auto-switch to analysis tab when a resume is analyzed
  React.useEffect(() => {
    if (currentResume?.analysis && !currentResume.isAnalyzing) {
      setActiveTab('analysis');
    }
  }, [currentResume?.analysis, currentResume?.isAnalyzing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Resume Header */}
      <ResumeHeader />

      <div className="container mx-auto px-4 py-8">

        {/* Main Content */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <span>Resume Management & Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center space-x-2">
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
                  className="flex items-center space-x-2"
                  disabled={!currentResume?.analysis}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analysis</span>
                  {currentResume?.analysis && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {currentResume.analysis.atsScore}
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
                    <div className="text-center pb-4">
                      <h3 className="text-lg font-semibold mb-2">
                        Analysis Results for "{currentResume.filename}"
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive ATS evaluation and AI-powered recommendations
                      </p>
                    </div>
                    <ATSResults 
                      analysis={currentResume.analysis} 
                      isAnalyzing={currentResume.isAnalyzing}
                    />
                  </div>
                ) : currentResume?.isAnalyzing ? (
                  <ATSResults 
                    analysis={{} as any} 
                    isAnalyzing={true}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Resume Selected</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a resume or select an existing one to view analysis results
                      </p>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          onClick={() => setActiveTab('upload')}
                          className="flex items-center space-x-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload Resume</span>
                        </Button>
                        {resumes.length > 0 && (
                          <Button 
                            variant="outline"
                            onClick={() => setActiveTab('manage')}
                            className="flex items-center space-x-2"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Select Resume</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Lightbulb className="h-5 w-5" />
              <span>Pro Tips for Better ATS Scores</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Keywords & Skills</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Include AI/ML specific keywords from job descriptions</li>
                  <li>• Mention specific tools: TensorFlow, PyTorch, scikit-learn</li>
                  <li>• Add cloud platforms: AWS, Google Cloud, Azure</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Format & Structure</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Use standard section headers</li>
                  <li>• Include quantified achievements</li>
                  <li>• Keep consistent formatting throughout</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}