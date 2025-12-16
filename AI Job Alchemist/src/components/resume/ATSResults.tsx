import React from 'react';
import { BarChart3, CheckCircle, XCircle, AlertCircle, TrendingUp, Brain, Target, Award, Lightbulb, Zap, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumeAnalysis } from '@/store/resume-store';
import { SuggestionsGenerator } from './SuggestionsGenerator';
import AIProjectGenerator from './AIProjectGenerator';

interface ATSResultsProps {
  analysis: ResumeAnalysis;
  isAnalyzing: boolean;
}

export function ATSResults({ analysis, isAnalyzing }: ATSResultsProps) {
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <div className="relative">
              <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">AI Analysis in Progress</h3>
            <p className="text-blue-700 mb-4">
              Our advanced AI is performing comprehensive ATS analysis using industry-specific algorithms...
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-blue-600">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                <span>Parsing content</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <span>Analyzing keywords</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span>Generating insights</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall ATS Score - Enhanced */}
      <Card className={`${getScoreBg(analysis.ats_score)} border-2 shadow-lg`}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center space-x-2 text-xl">
            <div className="p-2 bg-white rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <span>ATS Compatibility Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-7xl font-bold ${getScoreColor(analysis.ats_score)} mb-4`}>
            {analysis.ats_score}
            <span className="text-3xl">/100</span>
          </div>
          <Progress value={analysis.ats_score} className="w-full max-w-md mx-auto mb-4 h-3" />
          <p className="text-base font-medium mb-2">
            {analysis.ats_score >= 80 ? '🎉 Excellent! Your resume is highly ATS-friendly' :
              analysis.ats_score >= 60 ? '👍 Good score with room for improvement' :
                '⚠️ Needs optimization for better ATS compatibility'}
          </p>
          <p className="text-sm text-muted-foreground">
            Based on analysis of top AI/ML job requirements at leading companies
          </p>
        </CardContent>
      </Card>

      {/* Detailed Scoring Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Detailed Score Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(analysis.detailedScoring || {}).map(([category, score]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                    {score}/100
                  </span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analysis Tabs */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="skills">Skills & Keywords</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-1">
            <Wand2 className="h-3 w-3" />
            <span>AI Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center space-x-1">
            <Lightbulb className="h-3 w-3" />
            <span>Project Ideas</span>
          </TabsTrigger>
        </TabsList>

        {/* Skills and Keywords Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI-Specific Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-600">
                  <Brain className="h-5 w-5" />
                  <span>AI-Specific Keywords</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(analysis.aiSpecificKeywords || []).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Industry Relevance:</strong> {analysis.industryRelevance || 0}/100
                  <Progress value={analysis.industryRelevance || 0} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Skills Found */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Skills Detected ({(analysis.keyword_matches || []).length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(analysis.keyword_matches || []).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {(analysis.keyword_matches || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No technical skills detected</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Missing Skills & Keyword Density */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Recommended Skills to Add</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(analysis.missing_keywords || []).map((skill, index) => (
                    <Badge key={index} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Keyword Density</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.keywordDensity || {}).slice(0, 5).map(([keyword, count]) => (
                    <div key={keyword} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{keyword}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-6">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Resume Structure Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.sectionAnalysis || {}).map(([section, hasSection]) => (
                    <div key={section} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        {hasSection ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {section.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <Badge variant={hasSection ? "secondary" : "destructive"} className="text-xs">
                        {hasSection ? "Present" : "Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Format & Readability</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Format Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(analysis.formatScore || 0)}`}>
                      {analysis.formatScore || 0}/100
                    </span>
                  </div>
                  <Progress value={analysis.formatScore || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Readability Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(analysis.readabilityScore || 0)}`}>
                      {analysis.readabilityScore || 0}/100
                    </span>
                  </div>
                  <Progress value={analysis.readabilityScore || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Improvements Tab */}
        <TabsContent value="improvements" className="space-y-6">
          {/* Priority Improvements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-600">
                <Zap className="h-5 w-5" />
                <span>Priority Improvements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analysis.improvementPriority || []).map((item, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{item.category}</h4>
                        <Badge variant="outline" className={getPriorityColor(item.priority)}>
                          {item.priority} priority
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">+{item.impact}</span>
                        <p className="text-xs text-muted-foreground">potential score increase</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* General Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-600">
                <Lightbulb className="h-5 w-5" />
                <span>AI-Generated Suggestions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(analysis.suggestions || []).map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Analysis Tab */}
        <TabsContent value="competitive" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  <span>Competitive Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(analysis.competitiveAnalysis?.strengthAreas || []).map((strength, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>Areas for Development</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(analysis.competitiveAnalysis?.weaknessAreas || []).map((weakness, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-sm">{weakness}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-600">
                <Target className="h-5 w-5" />
                <span>Market Positioning</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">
                  {analysis.competitiveAnalysis?.marketPositioning || 'Analysis not available'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <SuggestionsGenerator
            currentSkills={analysis.keyword_matches || []}
            missingSkills={analysis.missing_keywords || []}
            industryFocus="AI/ML Engineering"
          />
        </TabsContent>

        {/* AI Project Generator Tab */}
        <TabsContent value="projects" className="space-y-6">
          <AIProjectGenerator
            userSkills={analysis.keyword_matches || []}
            missingSkills={analysis.missing_keywords || []}
            targetRoles={['AI Engineer', 'ML Engineer', 'Google CCAI', 'Microsoft Copilot', 'Amazon Lex']}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}