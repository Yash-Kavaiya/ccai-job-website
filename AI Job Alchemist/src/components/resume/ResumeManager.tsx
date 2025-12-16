import React from 'react';
import {
  FileText,
  Download,
  Trash2,
  RotateCcw,
  Calendar,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useResumeStore } from '@/store/resume-store';
import { useToast } from '@/hooks/use-toast';

export function ResumeManager() {
  const { resumes, currentResume, setCurrentResume, removeResume, analyzeResume } = useResumeStore();
  const { toast } = useToast();

  const handleDownload = (resume: any) => {
    window.open(resume.file_url, '_blank');
  };

  const handleReanalyze = async (resumeId: string) => {
    try {
      await analyzeResume(resumeId, '');
      toast({
        title: 'Analysis Started',
        description: 'Your resume is being re-analyzed...',
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (resumeId: string) => {
    removeResume(resumeId);
    toast({
      title: 'Resume Deleted',
      description: 'Your resume has been removed',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (resumes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Resumes Uploaded</h3>
          <p className="text-sm text-muted-foreground">
            Upload your first resume to get started with ATS analysis and job matching
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Resumes</h3>
        <Badge variant="secondary">{resumes.length} Resume{resumes.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="grid gap-4">
        {resumes.map((resume) => (
          <Card
            key={resume.id}
            className={`transition-all duration-200 ${currentResume?.id === resume.id
              ? 'ring-2 ring-primary border-primary'
              : 'hover:shadow-md'
              }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{resume.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(resume.created_at)}</span>
                    </div>
                    {currentResume?.id === resume.id && (
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {resume.analysis && (
                    <Badge className={`${getScoreColor(resume.analysis.ats_score)} border`}>
                      <Target className="h-3 w-3 mr-1" />
                      {resume.analysis.ats_score}/100
                    </Badge>
                  )}

                  {resume.isAnalyzing && (
                    <Badge variant="outline" className="text-xs">
                      <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-1" />
                      Analyzing
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {resume.analysis && !resume.isAnalyzing && (
                <div className="space-y-3 mb-4">
                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Skills Found:</span>
                      <span className="ml-2 font-medium">
                        {(resume.analysis.keyword_matches || []).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Suggestions:</span>
                      <span className="ml-2 font-medium">
                        {(resume.analysis.suggestions || []).length}
                      </span>
                    </div>
                  </div>

                  {(resume.analysis.keyword_matches || []).length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground mb-2 block">Top Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {(resume.analysis.keyword_matches || []).slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(resume.analysis.keyword_matches || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(resume.analysis.keyword_matches || []).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentResume(resume.id)}
                  disabled={currentResume?.id === resume.id}
                >
                  {currentResume?.id === resume.id ? 'Current' : 'Select'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(resume)}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReanalyze(resume.id)}
                  disabled={resume.isAnalyzing}
                  className="flex items-center space-x-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Re-analyze</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{resume.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(resume.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}