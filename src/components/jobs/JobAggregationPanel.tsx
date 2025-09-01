import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useJobMatchingStore } from '@/store/job-matching-store';
import {
  Globe,
  RefreshCw,
  Database,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  Filter,
  Calendar,
  Users
} from 'lucide-react';

export const JobAggregationPanel = () => {
  const { toast } = useToast();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  
  const {
    jobSources,
    crawlConfig,
    isAggregating,
    aggregationProgress,
    qualityMetrics,
    lastAggregationDate,
    aggregateJobs,
    toggleJobSource,
    updateCrawlConfig,
    scheduleAggregation
  } = useJobMatchingStore();

  const handleStartAggregation = async () => {
    if (selectedSources.length === 0) {
      toast({
        title: "No Sources Selected",
        description: "Please select at least one job source to aggregate from.",
        variant: "destructive"
      });
      return;
    }

    try {
      await aggregateJobs(selectedSources);
      toast({
        title: "Job Aggregation Started",
        description: `Aggregating jobs from ${selectedSources.length} sources...`,
      });
    } catch (error) {
      toast({
        title: "Aggregation Failed",
        description: "Failed to start job aggregation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    toggleJobSource(sourceId);
    
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(prev => prev.filter(id => id !== sourceId));
    } else {
      setSelectedSources(prev => [...prev, sourceId]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'crawling':
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      case 'api':
        return 'bg-blue-100 text-blue-800';
      case 'scraping':
        return 'bg-orange-100 text-orange-800';
      case 'webhook':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Job Aggregation</h2>
            <p className="text-sm text-muted-foreground">
              Collect AI jobs from multiple sources with intelligent deduplication
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStartAggregation}
            disabled={isAggregating || selectedSources.length === 0}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {isAggregating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Aggregating...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Start Aggregation
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources">Sources ({jobSources.length})</TabsTrigger>
          <TabsTrigger value="progress">
            Progress
            {isAggregating && <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />}
          </TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Job Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Available Job Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobSources.map((source) => (
                  <Card 
                    key={source.id}
                    className={`transition-all cursor-pointer ${
                      selectedSources.includes(source.id) 
                        ? 'ring-2 ring-blue-500 shadow-md' 
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => handleSourceToggle(source.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={source.is_active && selectedSources.includes(source.id)}
                            onCheckedChange={() => {}}
                          />
                          <h3 className="font-medium">{source.name}</h3>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={getSourceTypeColor(source.type)}
                        >
                          {source.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Rate Limit:</span>
                          <span>{source.rate_limit}/hr</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jobs Found:</span>
                          <span className="font-medium text-foreground">
                            {source.jobs_found.toLocaleString()}
                          </span>
                        </div>
                        {source.last_crawled && (
                          <div className="flex justify-between">
                            <span>Last Crawled:</span>
                            <span>{new Date(source.last_crawled).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aggregation Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aggregationProgress.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {aggregationProgress.map((progress, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(progress.status)}
                            <span className="font-medium">{progress.source}</span>
                          </div>
                          <Badge variant={
                            progress.status === 'completed' ? 'default' :
                            progress.status === 'failed' ? 'destructive' :
                            progress.status === 'crawling' ? 'secondary' : 'outline'
                          }>
                            {progress.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Jobs Found:</span>
                            <span className="font-medium">{progress.jobs_found}</span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {progress.message}
                          </div>
                          
                          {progress.status === 'crawling' && (
                            <Progress value={33} className="w-full h-2" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No aggregation in progress</p>
                  <p className="text-sm">Select sources and start aggregation to see progress here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Crawl Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AI Keywords</Label>
                  <Input
                    value={crawlConfig.keywords.join(', ')}
                    onChange={(e) => updateCrawlConfig({
                      keywords: e.target.value.split(',').map(k => k.trim())
                    })}
                    placeholder="AI, Machine Learning, Deep Learning..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Locations</Label>
                  <Input
                    value={crawlConfig.locations.join(', ')}
                    onChange={(e) => updateCrawlConfig({
                      locations: e.target.value.split(',').map(l => l.trim())
                    })}
                    placeholder="Remote, San Francisco, New York..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Companies</Label>
                  <Input
                    value={crawlConfig.companies.join(', ')}
                    onChange={(e) => updateCrawlConfig({
                      companies: e.target.value.split(',').map(c => c.trim())
                    })}
                    placeholder="Google, Microsoft, Amazon..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Max Age (Days)</Label>
                  <Input
                    type="number"
                    value={crawlConfig.max_age_days}
                    onChange={(e) => updateCrawlConfig({
                      max_age_days: parseInt(e.target.value) || 30
                    })}
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>AI Specializations</Label>
                <Input
                  value={crawlConfig.ai_specializations.join(', ')}
                  onChange={(e) => updateCrawlConfig({
                    ai_specializations: e.target.value.split(',').map(s => s.trim())
                  })}
                  placeholder="Google CCAI, Microsoft Copilot, Amazon Lex..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => scheduleAggregation(6)}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Every 6 Hours
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                    <p className="text-2xl font-bold">{qualityMetrics.total_jobs.toLocaleString()}</p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unique Jobs</p>
                    <p className="text-2xl font-bold">{qualityMetrics.unique_jobs.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Sources</p>
                    <p className="text-2xl font-bold">{qualityMetrics.sources_active}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Data Quality Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Duplicates Removed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (qualityMetrics.duplicates_removed / Math.max(1, qualityMetrics.total_jobs)) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {qualityMetrics.duplicates_removed}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Low Quality Filtered</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (qualityMetrics.low_quality_filtered / Math.max(1, qualityMetrics.total_jobs)) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {qualityMetrics.low_quality_filtered}
                    </span>
                  </div>
                </div>

                {lastAggregationDate && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Last aggregation: {new Date(lastAggregationDate).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};