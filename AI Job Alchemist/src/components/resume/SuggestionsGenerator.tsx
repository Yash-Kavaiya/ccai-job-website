import React, { useState } from 'react';
import { Lightbulb, Sparkles, Wand2, RefreshCw, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DevvAI } from '@devvai/devv-code-backend';

interface SuggestionsGeneratorProps {
  currentSkills: string[];
  missingSkills: string[];
  industryFocus?: string;
}

export function SuggestionsGenerator({ 
  currentSkills, 
  missingSkills, 
  industryFocus = 'AI/ML' 
}: SuggestionsGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    projectIdeas: string[];
    skillEnhancements: string[];
    resumeImprovements: string[];
  }>({
    projectIdeas: [],
    skillEnhancements: [],
    resumeImprovements: []
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setIsGenerating(true);
    
    try {
      const ai = new DevvAI();
      
      const prompt = `You are an AI career coach specializing in ${industryFocus} roles at top companies like Google, Microsoft, Amazon.

Current Skills: ${currentSkills.join(', ')}
Missing Skills: ${missingSkills.join(', ')}

Generate personalized career enhancement suggestions in JSON format:

{
  "projectIdeas": [
    "Build a conversational AI chatbot using Amazon Lex with voice integration",
    "Create a vector database similarity search system using Qdrant",
    "Develop a multi-modal AI application combining vision and NLP"
  ],
  "skillEnhancements": [
    "Complete AWS Machine Learning certification to strengthen cloud AI deployment skills",
    "Learn LangChain framework for building AI agent applications",
    "Practice fine-tuning transformer models using Hugging Face"
  ],
  "resumeImprovements": [
    "Quantify ML model performance improvements (e.g., 'improved accuracy by 15%')",
    "Add specific AI frameworks and tools used in each project",
    "Include business impact of AI solutions (cost savings, efficiency gains)"
  ]
}

Focus on:
1. Project ideas that demonstrate missing skills and current market demands
2. Specific learning paths for skill gaps
3. Resume enhancements that make achievements more compelling

Make suggestions actionable, specific, and aligned with current AI job market trends.`;

      const response = await ai.chat.completions.create({
        model: 'default',
        messages: [
          { role: 'system', content: 'You are an expert AI career coach. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const suggestionsData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        
        if (suggestionsData) {
          setSuggestions({
            projectIdeas: suggestionsData.projectIdeas || [],
            skillEnhancements: suggestionsData.skillEnhancements || [],
            resumeImprovements: suggestionsData.resumeImprovements || []
          });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        // Fallback suggestions
        setSuggestions({
          projectIdeas: [
            'Build a real-time AI chatbot using modern NLP frameworks',
            'Create a computer vision project with object detection',
            'Develop a recommendation system using collaborative filtering'
          ],
          skillEnhancements: [
            'Learn cloud AI services (AWS SageMaker, Google AI Platform)',
            'Practice with transformer models and fine-tuning',
            'Study MLOps tools for model deployment and monitoring'
          ],
          resumeImprovements: [
            'Add quantified results for each AI project',
            'Include specific technologies and frameworks used',
            'Highlight business impact and problem-solving approach'
          ]
        });
      }
      
      toast({
        title: "Suggestions Generated!",
        description: "AI-powered career enhancement suggestions are ready.",
      });
      
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
      toast({
        title: "Copied!",
        description: "Suggestion copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const SuggestionCard = ({ 
    title, 
    items, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    items: string[]; 
    icon: React.ElementType; 
    color: string; 
  }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className={`flex items-center space-x-2 text-${color}-600`}>
          <Icon className="h-5 w-5" />
          <span>{title}</span>
          <Badge variant="outline" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg bg-${color}-50 border border-${color}-200 group hover:bg-${color}-100 transition-colors cursor-pointer`}
              onClick={() => copyToClipboard(item)}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-800 flex-1">{item}</p>
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedText === item ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-900">
            <Wand2 className="h-6 w-6" />
            <span>AI Career Enhancement Suggestions</span>
            <Sparkles className="h-5 w-5 text-purple-600" />
          </CardTitle>
          <p className="text-purple-700 text-sm">
            Get personalized project ideas, learning paths, and resume improvements powered by advanced AI
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                Skills Analyzed: {currentSkills.length}
              </Badge>
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Gaps Identified: {missingSkills.length}
              </Badge>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                Focus: {industryFocus}
              </Badge>
            </div>
            <Button 
              onClick={generateSuggestions}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Display */}
      {(suggestions.projectIdeas.length > 0 || 
        suggestions.skillEnhancements.length > 0 || 
        suggestions.resumeImprovements.length > 0) && (
        <div className="grid md:grid-cols-3 gap-6">
          <SuggestionCard
            title="Project Ideas"
            items={suggestions.projectIdeas}
            icon={Lightbulb}
            color="blue"
          />
          <SuggestionCard
            title="Skill Development"
            items={suggestions.skillEnhancements}
            icon={Sparkles}
            color="green"
          />
          <SuggestionCard
            title="Resume Improvements"
            items={suggestions.resumeImprovements}
            icon={Wand2}
            color="purple"
          />
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">How to use these suggestions:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Project Ideas:</strong> Build these to demonstrate missing skills and stay current with industry trends</li>
                <li>• <strong>Skill Development:</strong> Follow these learning paths to close identified skill gaps</li>
                <li>• <strong>Resume Improvements:</strong> Apply these enhancements to make your achievements more compelling</li>
                <li>• <strong>Click any suggestion</strong> to copy it to your clipboard for easy reference</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}