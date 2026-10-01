import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResumeStore } from '@/store/resume-store';
import { useToast } from '@/hooks/use-toast';

export function ResumeUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const { uploadResume, saveResumeFromText, isUploading, uploadError, clearError } = useResumeStore();
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      return 'Please upload a PDF, DOC, DOCX, or TXT file';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
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
        await uploadResume(file);
        toast({
          title: 'Resume saved',
          description: 'Your resume was saved and analyzed for ATS keywords.',
        });
      } catch (err) {
        const description =
          err instanceof Error ? err.message : 'Please try again or paste resume text below';
        const isQuota =
          description.toLowerCase().includes('quota') ||
          description.includes('storage/quota-exceeded');
        toast({
          title: isQuota ? 'Storage quota exceeded' : 'Upload Failed',
          description: isQuota
            ? `${description} You can still paste resume text below.`
            : description,
          variant: 'destructive',
        });
      }
    },
    [uploadResume, toast]
  );

  const handlePasteSave = useCallback(async () => {
    try {
      await saveResumeFromText(pasteText);
      setPasteText('');
      toast({
        title: 'Resume text saved',
        description: 'Saved to your account without file storage. Ready for job matching.',
      });
    } catch (err) {
      toast({
        title: 'Could not save text',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  }, [pasteText, saveResumeFromText, toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  return (
    <div className="space-y-6">
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-start justify-between gap-2">
            <span>{uploadError}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="h-auto p-1 shrink-0">
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-8 border-border/60 shadow-none">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) handleFileUpload(files[0]);
              e.target.value = '';
            }}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center space-y-4">
            <div
              className={`p-4 rounded-full transition-colors ${
                isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {isUploading ? (
                <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isUploading ? 'Saving resume…' : 'Upload your resume'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                PDF, DOC, DOCX, or TXT (max 10MB). If Storage quota is full, paste text below instead.
              </p>
            </div>

            {!isUploading && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>Max 10MB</span>
                </div>
                <span>PDF · DOC · DOCX · TXT</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border/60 shadow-none space-y-3">
        <div>
          <h3 className="font-semibold mb-1">Or paste resume text</h3>
          <p className="text-sm text-muted-foreground">
            Works without Firebase Storage — ideal when quota is exceeded. Text is saved to your
            profile for ATS scoring and job matching.
          </p>
        </div>
        <Textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your full resume text here…"
          className="min-h-[180px]"
          disabled={isUploading}
        />
        <div className="flex justify-end">
          <Button onClick={handlePasteSave} disabled={isUploading || pasteText.trim().length < 40}>
            {isUploading ? 'Saving…' : 'Save & analyze text'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
