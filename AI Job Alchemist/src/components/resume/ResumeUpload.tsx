import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResumeStore } from '@/store/resume-store';
import { useToast } from '@/hooks/use-toast';
import DocumentParsingDemo from './DocumentParsingDemo';

export function ResumeUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const { uploadResume, isUploading, uploadError, clearError } = useResumeStore();
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF, DOC, DOCX, or TXT file';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Invalid File',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    try {
      setLastUploadedFile(file);
      await uploadResume(file);
      toast({
        title: 'Resume Uploaded',
        description: 'Your resume has been uploaded and analysis is starting...',
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    }
  }, [uploadResume, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Clear input value to allow re-uploading same file
    e.target.value = '';
  }, [handleFileUpload]);

  return (
    <div className="space-y-4">
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {uploadError}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-8">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
            ${isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-4 rounded-full transition-colors duration-200
              ${isDragOver 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {isUploading ? (
                <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isUploading ? 'Uploading Resume...' : 'Upload Your Resume'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isUploading 
                  ? 'Please wait while we upload and analyze your resume'
                  : 'Drag and drop your resume here, or click to browse. Supports PDF, DOC, DOCX, and TXT files.'
                }
              </p>
            </div>

            {!isUploading && (
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>Max 10MB</span>
                </div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>PDF, DOC, DOCX, TXT</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Your resume will be analyzed for ATS compatibility and AI job matching
        </p>
      </div>

      {/* Document Parsing Pipeline Demo */}
      {lastUploadedFile && (
        <div className="mt-8">
          <DocumentParsingDemo 
            filename={lastUploadedFile.name}
            fileType={lastUploadedFile.type.includes('pdf') ? 'PDF' : 
                     lastUploadedFile.type.includes('word') || lastUploadedFile.name.includes('.docx') ? 'DOCX' : 
                     'unknown'}
          />
        </div>
      )}
    </div>
  );
}