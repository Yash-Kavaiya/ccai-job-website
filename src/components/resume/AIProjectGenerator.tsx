import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DevvAI } from '@devvai/devv-code-backend';
import { 
  Sparkles, 
  Lightbulb, 
  Code, 
  Cloud, 
  Database,
  Loader2,
  Copy,
  ExternalLink,
  Star
} from 'lucide-react';

interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeline: string;
  impact: string;
  relevantFor: string[];
  implementationSteps: string[];
  learningOutcomes: string[];
}

interface AIProjectGeneratorProps {
  userSkills: string[];
  missingSkills: string[];
  targetRoles?: string[];
}

const AIProjectGenerator: React.FC<AIProjectGeneratorProps> = ({
  userSkills,
  missingSkills,
  targetRoles = ['AI Engineer', 'ML Engineer', 'Data Scientist']
}) => {
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'All'>('All');
  const { toast } = useToast();

  const generateProjects = async () => {
    setIsGenerating(true);
    
    try {
      const ai = new DevvAI();
      
      const projectPrompt = `You are an AI Career Coach Agent specializing in generating personalized AI/ML project ideas for resume enhancement.

USER PROFILE ANALYSIS:
Current Skills: ${userSkills.join(', ')}
Skills to Develop: ${missingSkills.join(', ')}
Target Roles: ${targetRoles.join(', ')}

Generate 4 diverse AI project ideas that will significantly enhance this person's resume for target roles. Focus on:
1. Projects that bridge current skills with missing skills
2. Real-world applications relevant to Google CCAI, Microsoft Copilot, Amazon Lex
3. Projects that demonstrate quantifiable business impact
4. Progressive difficulty to show learning journey

For each project, provide this exact JSON structure:
{
  "projects": [
    {
      "title": "Intelligent Customer Support Chatbot with RAG",
      "description": "Build an advanced conversational AI system using retrieval-augmented generation to provide accurate customer support responses with source citations.",
      "techStack": ["Python", "LangChain", "OpenAI API", "Pinecone", "FastAPI", "Docker"],
      "difficulty": "Intermediate",
      "timeline": "4-6 weeks",
      "impact": "Reduce customer support response time by 60% and improve accuracy to 85%",
      "relevantFor": ["Google CCAI", "Amazon Lex", "Conversational AI roles"],
      "implementationSteps": [
        "Set up vector database with company knowledge base",
        "Implement document chunking and embedding pipeline", 
        "Build RAG system with context retrieval",
        "Create FastAPI backend with conversation memory",
        "Deploy using Docker and implement monitoring"
      ],
      "learningOutcomes": [
        "Master vector databases and similarity search",
        "Learn RAG architecture and prompt engineering",
        "Gain experience with production API deployment",
        "Understand conversation state management"
      ]
    }
  ]
}

FOCUS AREAS:
- Conversational AI (chatbots, voice assistants, intent recognition)
- Computer Vision (object detection, image classification, OCR)
- NLP & LLM Applications (sentiment analysis, document processing, code generation)
- MLOps & Deployment (model serving, monitoring, CI/CD pipelines)
- Vector Databases & Similarity Search (recommendation systems, semantic search)
- Edge AI & Optimization (model compression, mobile deployment)

Ensure projects are:
- Portfolio-worthy with clear business value
- Technically challenging but achievable
- Aligned with current 2024 AI job market demands
- Demonstrable with metrics and outcomes`;

      const response = await ai.chat.completions.create({
        model: 'default',
        messages: [
          { role: 'system', content: 'You are an AI Career Coach Agent. Always respond with valid JSON containing practical, resume-enhancing project ideas.' },
          { role: 'user', content: projectPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const projectData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        if (projectData?.projects) {
          setProjects(projectData.projects);
          toast({
            title: "✨ AI Project Ideas Generated!",
            description: `Generated ${projectData.projects.length} personalized project ideas to enhance your resume.`,
          });
        } else {
          throw new Error('Invalid project data structure');
        }
      } catch (parseError) {
        // Fallback with curated project ideas
        const fallbackProjects: ProjectIdea[] = [
          {
            title: "Multi-Modal AI Assistant for Enterprise",
            description: "Build a comprehensive AI assistant that handles text, voice, and image inputs for business workflow automation.",
            techStack: ["Python", "OpenAI API", "Whisper", "FastAPI", "React", "Docker"],
            difficulty: "Advanced",
            timeline: "8-10 weeks",
            impact: "Improve enterprise productivity by 35% through automated task handling",
            relevantFor: ["Microsoft Copilot", "Enterprise AI", "Full-stack AI"],
            implementationSteps: [
              "Design multi-modal input processing pipeline",
              "Implement voice-to-text with Whisper integration",
              "Build image analysis with computer vision models",
              "Create unified API with context management",
              "Deploy with monitoring and analytics"
            ],
            learningOutcomes: [
              "Master multi-modal AI architecture",
              "Learn enterprise-grade API design",
              "Gain production deployment experience",
              "Understand business workflow automation"
            ]
          },
          {
            title: "Intelligent Document Processing System",
            description: "Create an AI-powered system that extracts, categorizes, and processes business documents with high accuracy.",
            techStack: ["Python", "spaCy", "Tesseract", "PostgreSQL", "Streamlit", "AWS"],
            difficulty: "Intermediate",
            timeline: "5-6 weeks", 
            impact: "Reduce document processing time by 80% and improve accuracy to 95%",
            relevantFor: ["Document AI", "Enterprise Automation", "Computer Vision"],
            implementationSteps: [
              "Build OCR pipeline with preprocessing",
              "Implement NLP for entity extraction",
              "Create document classification system",
              "Build web interface with Streamlit",
              "Deploy on AWS with auto-scaling"
            ],
            learningOutcomes: [
              "Master OCR and document processing",
              "Learn NLP entity extraction techniques",
              "Gain cloud deployment experience",
              "Understand document workflow automation"
            ]
          }
        ];
        
        setProjects(fallbackProjects);
        toast({
          title: "📋 Curated Project Ideas",
          description: "Generated fallback project ideas tailored to your skills.",
        });
      }
    } catch (error) {
      toast({
        title: "Error Generating Projects",
        description: "Failed to generate project ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyProjectToClipboard = (project: ProjectIdea) => {
    const projectText = `
# ${project.title}

**Description:** ${project.description}

**Tech Stack:** ${project.techStack.join(', ')}
**Difficulty:** ${project.difficulty}
**Timeline:** ${project.timeline}
**Expected Impact:** ${project.impact}

## Implementation Steps:
${project.implementationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Learning Outcomes:
${project.learningOutcomes.map(outcome => `• ${outcome}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(projectText);
    toast({
      title: "📋 Copied to Clipboard",
      description: "Project details copied for your reference.",
    });
  };

  const filteredProjects = selectedDifficulty === 'All' 
    ? projects 
    : projects.filter(p => p.difficulty === selectedDifficulty);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';  
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">AI Project Generator</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          
          <Button 
            onClick={generateProjects} 
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Projects
              </>
            )}
          </Button>
        </div>
      </div>

      {projects.length === 0 && !isGenerating && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              AI-Powered Project Ideas
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Get personalized project recommendations based on your current skills and career goals. 
              Perfect for enhancing your resume and portfolio.
            </p>
            <Button onClick={generateProjects} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {filteredProjects.map((project, index) => (
          <Card key={index} className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    {project.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {project.description}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Badge className={getDifficultyColor(project.difficulty)}>
                    {project.difficulty}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyProjectToClipboard(project)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4" />
                    Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {project.techStack.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Cloud className="h-4 w-4" />
                    Relevant For
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {project.relevantFor.map((role, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">📅 Timeline & Impact</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Duration:</strong> {project.timeline}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Expected Impact:</strong> {project.impact}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">🎯 Learning Outcomes</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {project.learningOutcomes.slice(0, 2).map((outcome, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-500 mt-1">•</span>
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  View Implementation Roadmap
                  <ExternalLink className="h-3 w-3" />
                </summary>
                <div className="mt-3 pl-5 border-l-2 border-purple-200">
                  <h5 className="font-medium mb-2">Implementation Steps:</h5>
                  <ol className="text-sm text-gray-600 space-y-1">
                    {project.implementationSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIProjectGenerator;