import React from 'react';
import { ArrowLeft, FileText, BarChart3, Lightbulb, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '@/store/resume-store';

export function ResumeHeader() {
  const navigate = useNavigate();
  const { resumes, currentResume } = useResumeStore();

  const stats = React.useMemo(() => {
    const totalResumes = resumes.length;
    const analyzedResumes = resumes.filter(r => r.analysis).length;
    const avgScore = analyzedResumes > 0 
      ? Math.round(resumes.reduce((sum, r) => sum + (r.analysis?.atsScore || 0), 0) / analyzedResumes)
      : 0;
    
    const highScoreResumes = resumes.filter(r => r.analysis && r.analysis.atsScore >= 80).length;
    
    return { totalResumes, analyzedResumes, avgScore, highScoreResumes };
  }, [resumes]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-white/30 text-white">
              AI-Powered Analysis
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white">
              ATS Optimized
            </Badge>
          </div>
        </div>

        {/* Header Content */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Resume Analysis Hub
              </h1>
              <p className="text-blue-200 text-lg mt-2">
                AI-powered ATS optimization and career enhancement
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-blue-200">
            <div className="flex items-center space-x-1">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Advanced AI</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>Industry-Specific Analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              <BarChart3 className="h-4 w-4" />
              <span>Real-time ATS Scoring</span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">Total Resumes</p>
                  <p className="text-3xl font-bold text-white">{stats.totalResumes}</p>
                  <p className="text-xs text-blue-300">
                    {stats.totalResumes > 0 ? 'Ready for analysis' : 'Upload your first resume'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">Analyzed</p>
                  <p className="text-3xl font-bold text-white">{stats.analyzedResumes}</p>
                  <p className="text-xs text-blue-300">
                    {stats.analyzedResumes > 0 ? `${Math.round((stats.analyzedResumes / stats.totalResumes) * 100)}% completion` : 'Start analyzing now'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-purple-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">Average ATS Score</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.avgScore > 0 ? `${stats.avgScore}/100` : '--'}
                  </p>
                  <p className="text-xs text-blue-300">
                    {stats.avgScore >= 80 ? 'Excellent performance' : 
                     stats.avgScore >= 60 ? 'Good, room for improvement' : 
                     stats.avgScore > 0 ? 'Needs optimization' : 'No data yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-yellow-300" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">High Score Resumes</p>
                  <p className="text-3xl font-bold text-white">{stats.highScoreResumes}</p>
                  <p className="text-xs text-blue-300">
                    {stats.highScoreResumes > 0 ? 'ATS optimized (80+)' : 'Optimize for better scores'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Resume Status */}
        {currentResume && (
          <div className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-300" />
                    <div>
                      <p className="font-medium">Currently Selected: {currentResume.filename}</p>
                      <p className="text-sm text-blue-200">
                        Uploaded {new Date(currentResume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {currentResume.analysis && (
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`border-2 ${getScoreColor(currentResume.analysis.atsScore)}`}
                      >
                        ATS Score: {currentResume.analysis.atsScore}/100
                      </Badge>
                      <Badge variant="outline" className="border-white/30 text-white">
                        {currentResume.isAnalyzing ? 'Analyzing...' : 'Analysis Complete'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}