import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  FileType, 
  Settings, 
  Zap,
  Eye,
  CheckCircle,
  AlertTriangle,
  FileX,
  Brain,
  Layers,
  Search,
  Hash
} from 'lucide-react';

interface DocumentParsingDemoProps {
  filename: string;
  fileType: 'PDF' | 'DOCX' | 'unknown';
}

interface ParsingStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  details?: string;
  icon: React.ReactNode;
}

const DocumentParsingDemo: React.FC<DocumentParsingDemoProps> = ({ 
  filename, 
  fileType 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ParsingStep[]>([
    {
      name: 'Document Format Detection',
      description: 'Analyzing file type and structure',
      status: 'pending',
      details: `Detected ${fileType} format. Selecting appropriate parser...`,
      icon: <FileType className="h-4 w-4" />
    },
    {
      name: 'Text Extraction',
      description: fileType === 'PDF' ? 'PyPDF2/pdfplumber extraction' : 'python-docx parsing',
      status: 'pending',
      details: fileType === 'PDF' 
        ? 'Using pdfplumber for robust text extraction with layout preservation'
        : 'Using python-docx for structured document parsing',
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: 'Format Analysis',
      description: 'ATS compatibility assessment',
      status: 'pending',
      details: 'Checking for tables, images, complex formatting that may break ATS parsing',
      icon: <Layers className="h-4 w-4" />
    },
    {
      name: 'Section Identification',
      description: 'NLP-based section extraction',
      status: 'pending',
      details: 'Using spaCy NLP to identify: Contact Info, Experience, Education, Skills, Projects',
      icon: <Search className="h-4 w-4" />
    },
    {
      name: 'Keyword Extraction',
      description: 'AI/ML keyword identification',
      status: 'pending',
      details: 'Extracting technical skills, tools, frameworks, and AI-specific terminology',
      icon: <Hash className="h-4 w-4" />
    },
    {
      name: 'Readability Analysis',
      description: 'Flesch-Kincaid scoring',
      status: 'pending', 
      details: 'Calculating readability score using NLTK for optimal ATS compatibility',
      icon: <Eye className="h-4 w-4" />
    },
    {
      name: 'Vector Embedding',
      description: 'Sentence-BERT encoding',
      status: 'pending',
      details: 'Creating vector embeddings for similarity search and job matching',
      icon: <Brain className="h-4 w-4" />
    },
    {
      name: 'Privacy Processing',
      description: 'Data anonymization',
      status: 'pending',
      details: 'Anonymizing personal information while preserving analysis capabilities',
      icon: <Settings className="h-4 w-4" />
    }
  ]);

  const runParsingDemo = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Update current step to running
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'running' } : step
      ));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      
      // Complete current step
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'complete' } : step
      ));
    }
    
    setIsRunning(false);
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStepBg = (status: string, index: number) => {
    if (status === 'complete') return 'bg-green-50 border-green-200';
    if (status === 'running') return 'bg-blue-50 border-blue-200';
    if (status === 'error') return 'bg-red-50 border-red-200';
    if (index <= currentStep) return 'bg-gray-50 border-gray-200';
    return 'bg-white border-gray-100';
  };

  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Document Parsing Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Simulating advanced PDF/DOCX parsing and NLP analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">
                File: {filename}
              </div>
              <Badge variant={fileType === 'PDF' ? 'default' : 'secondary'}>
                {fileType} Parser
              </Badge>
            </div>
            
            <Button 
              onClick={runParsingDemo} 
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isRunning ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {completedSteps}/{steps.length} steps completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Processing Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${getStepBg(step.status, index)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStepStatusIcon(step.status)}
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{step.name}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Step {index + 1}
                  </div>
                  {step.status === 'running' && (
                    <div className="text-xs text-blue-600 font-medium">
                      Processing...
                    </div>
                  )}
                </div>
              </div>
              
              {(step.status === 'running' || step.status === 'complete') && (
                <div className="mt-3 pl-9">
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                    💡 <strong>Technical Implementation:</strong> {step.details}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Technical Stack Information */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Technical Implementation Stack
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-purple-800 mb-2">Document Processing</h5>
              <ul className="space-y-1 text-purple-700">
                <li>• <strong>PDF:</strong> PyPDF2, pdfplumber for text extraction</li>
                <li>• <strong>DOCX:</strong> python-docx for structured parsing</li>
                <li>• <strong>OCR:</strong> Tesseract for image-based PDFs</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-purple-800 mb-2">NLP & Analysis</h5>
              <ul className="space-y-1 text-purple-700">
                <li>• <strong>NLP:</strong> spaCy for section extraction</li>
                <li>• <strong>Readability:</strong> NLTK Flesch-Kincaid scoring</li>
                <li>• <strong>Embeddings:</strong> Sentence-BERT for vectors</li>
              </ul>
            </div>
          </div>
        </div>

        {completedSteps === steps.length && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <h4 className="font-semibold">Document Processing Complete!</h4>
                <p className="text-sm text-green-700">
                  Resume successfully parsed and analyzed. Data stored securely with privacy compliance.
                  Vector embeddings ready for similarity search and job matching.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentParsingDemo;