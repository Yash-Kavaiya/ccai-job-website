import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table, webSearch, DevvAI, OpenRouterAI } from '@/lib/devv-backend-stub';

interface JobSource {
  id: string;
  name: string;
  type: 'api' | 'scraping' | 'webhook';
  url: string;
  is_active: boolean;
  last_crawled: string;
  jobs_found: number;
  api_key?: string;
  rate_limit?: number;
  auth_required: boolean;
}

interface CrawlConfig {
  keywords: string[];
  locations: string[];
  experience_levels: string[];
  companies: string[];
  ai_specializations: string[];
  max_age_days: number;
  sources: string[];
}

interface JobListing {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  experience_level: string;
  skills: string[];
  ai_specializations: string[];
  salary_range?: string;
  job_type: string;
  source: string;
  source_id: string; // Original ID from source
  external_url: string;
  keywords: string[];
  posted_date: string;
  expires_date?: string;
  status: string;
  similarity_score?: number;
  match_reasons?: string[];
  // Enhanced aggregation fields
  raw_data?: Record<string, any>;
  normalized_score: number;
  duplicate_score?: number;
  quality_score: number;
  is_duplicate: boolean;
  canonical_job_id?: string;
  crawl_timestamp: string;
  embedding_vector?: number[];
}

interface JobMatch {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  similarity_score: number;
  match_type: string;
  match_reasons: string[];
  is_bookmarked: boolean;
  application_status: string;
  applied_date?: string;
  created_at: string;
  // One-Click Apply fields
  can_auto_apply?: boolean;
  apply_method?: 'linkedin_easy' | 'indeed_api' | 'company_direct' | 'manual';
  application_form_fields?: Record<string, any>;
  application_id?: string;
  application_notes?: string;
}

interface ApplicationData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin?: string;
    portfolio?: string;
  };
  resume_data: {
    summary: string;
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      school: string;
      year: string;
    }>;
    skills: string[];
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
  };
  cover_letter?: string;
}

interface BatchApplyJob {
  job_id: string;
  title: string;
  company: string;
  apply_method: string;
  can_auto_apply: boolean;
  selected: boolean;
}

interface ApplyProgress {
  job_id: string;
  status: 'pending' | 'applying' | 'success' | 'failed' | 'requires_manual';
  message: string;
  application_url?: string;
  error_details?: string;
}

interface JobSearchFilters {
  location: string;
  experience_level: string;
  job_type: string;
  skills: string[];
  salary_min?: number;
  salary_max?: number;
  company_size?: string;
  ai_specializations: string[];
  // Qdrant-style niche filtering
  company_niche?: string; // e.g., "Google CCAI", "Microsoft Copilot", "Amazon Lex"
  similarity_threshold: number; // Default 0.7 as per requirements
}

interface UserPreferences {
  preferred_locations: string[];
  salary_expectations: {
    min: number;
    max: number;
    currency: string;
  };
  work_arrangements: string[]; // remote, hybrid, onsite
  company_sizes: string[]; // startup, mid-size, enterprise
  ai_focus_areas: string[]; // nlp, computer-vision, robotics, etc.
  career_level: string;
  preferred_company_types?: string[]; // Added for enhanced personalization
  remote_preference?: string; // Added for remote work preferences
  skills?: string[]; // Added for skills-based matching
}

interface JobMatchingState {
  // Job listings
  jobs: JobListing[];
  filteredJobs: JobListing[];
  loading: boolean;
  error: string | null;
  
  // Job matching - Qdrant-style vector search
  matches: JobMatch[];
  matchingInProgress: boolean;
  lastMatchDate?: string;
  vectorEmbeddings: Map<string, number[]>; // Cache for resume/job embeddings
  
  // Search & filters
  searchQuery: string;
  filters: JobSearchFilters;
  searchHistory: string[];
  
  // User preferences for personalization
  userPreferences: UserPreferences;
  
  // Job Aggregation from Multiple Sources
  jobSources: JobSource[];
  crawlConfig: CrawlConfig;
  aggregationSources: string[];
  lastAggregationDate?: string;
  isAggregating: boolean;
  aggregationProgress: {
    source: string;
    status: 'pending' | 'crawling' | 'processing' | 'completed' | 'failed';
    jobs_found: number;
    message: string;
  }[];
  duplicateJobs: string[]; // IDs of detected duplicate jobs
  qualityMetrics: {
    total_jobs: number;
    unique_jobs: number;
    duplicates_removed: number;
    low_quality_filtered: number;
    sources_active: number;
  };
  
  // Qdrant-style vector operations
  jobDescriptionText?: string; // For JD-based matching
  
  // One-Click Apply system
  applicationData: ApplicationData | null;
  batchApplyJobs: BatchApplyJob[];
  applyProgress: ApplyProgress[];
  isApplying: boolean;
  dailyApplicationCount: number;
  lastApplicationDate?: string;
  // Compliance: 10 applies per day limit
  applicationLimit: number;
  
  // Actions
  searchJobs: (query: string) => Promise<void>;
  
  // Job Aggregation Actions
  aggregateJobs: (sources?: string[]) => Promise<void>;
  aggregateFromTwitterX: (hashtags: string[]) => Promise<JobListing[]>;
  aggregateFromLinkedIn: (keywords: string[]) => Promise<JobListing[]>;
  aggregateFromIndeed: (searchTerms: string[]) => Promise<JobListing[]>;
  aggregateFromNaukri: (keywords: string[]) => Promise<JobListing[]>;
  aggregateFromReddit: (subreddits: string[]) => Promise<JobListing[]>;
  aggregateFromCompanySites: (companies: string[]) => Promise<JobListing[]>;
  
  // Job Processing & Normalization
  normalizeJobData: (rawJob: any, source: string) => JobListing;
  detectDuplicates: (jobs: JobListing[]) => string[];
  calculateQualityScore: (job: JobListing) => number;
  embedJobDescription: (job: JobListing) => Promise<JobListing>;
  
  // Source Management
  addJobSource: (source: JobSource) => void;
  updateJobSource: (sourceId: string, updates: Partial<JobSource>) => void;
  toggleJobSource: (sourceId: string) => void;
  updateCrawlConfig: (config: Partial<CrawlConfig>) => void;
  
  // Real-time Updates
  setupWebhooks: () => Promise<void>;
  processWebhookData: (source: string, data: any[]) => Promise<void>;
  scheduleAggregation: (intervalHours: number) => void;
  findJobMatches: (resumeText?: string) => Promise<void>;
  // Qdrant-style JD matching
  findJobMatchesByJD: (jobDescriptionText: string) => Promise<void>;
  // Enhanced filtering with niche support
  applyFilters: (filters: Partial<JobSearchFilters>) => void;
  filterByNiche: (niche: string) => void; // e.g., "Google CCAI"
  clearFilters: () => void;
  bookmarkJob: (jobId: string) => Promise<void>;
  updateApplicationStatus: (matchId: string, status: string) => Promise<void>;
  getJobById: (jobId: string) => JobListing | undefined;
  getJobMatches: () => Promise<void>;
  // User preferences management
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  getPersonalizedMatches: () => JobMatch[];
  // Advanced Vector operations
  generateJobEmbedding: (jobText: string) => Promise<number[]>;
  calculateSimilarityScore: (resumeEmbedding: number[], jobEmbedding: number[]) => number;
  performAdvancedVectorSearch: (queryVector: number[], options?: {
    algorithm?: 'cosine' | 'euclidean' | 'manhattan' | 'hybrid';
    threshold?: number;
    usePersonalization?: boolean;
    clusteringEnabled?: boolean;
    maxResults?: number;
  }) => Promise<Array<{ job: JobListing; score: number; algorithm: string }>>;
  performJobClustering: (jobs?: JobListing[]) => Promise<JobListing[]>;
  performSemanticSearch: (naturalQuery: string, options?: {
    includeDescriptions?: boolean;
    focusAreas?: string[];
    experienceLevel?: string;
    maxResults?: number;
  }) => Promise<Array<{ job: JobListing; score: number; semantic_explanation: string }>>;
  clearError: () => void;
  
  // One-Click Apply actions
  setupApplicationData: (data: ApplicationData) => void;
  addToBatchApply: (jobId: string) => void;
  removeFromBatchApply: (jobId: string) => void;
  toggleBatchApplySelection: (jobId: string) => void;
  applyToJob: (jobId: string) => Promise<boolean>;
  batchApplyToJobs: () => Promise<void>;
  checkApplicationEligibility: (jobId: string) => { canApply: boolean; reason?: string };
  getApplicationProgress: () => ApplyProgress[];
  resetDailyApplicationCount: () => void;
  // Form field mapping for auto-fill
  mapResumeToFormFields: (jobRequirements: string) => Promise<Record<string, any>>;
  // Browser automation fallback
  generateApplicationUrl: (jobId: string) => string;
}

const defaultFilters: JobSearchFilters = {
  location: '',
  experience_level: '',
  job_type: '',
  skills: [],
  ai_specializations: [],
  company_niche: '',
  similarity_threshold: 0.7, // Qdrant threshold as specified
};

const defaultUserPreferences: UserPreferences = {
  preferred_locations: [],
  salary_expectations: {
    min: 0,
    max: 500000,
    currency: 'USD',
  },
  work_arrangements: [],
  company_sizes: [],
  ai_focus_areas: [],
  career_level: '',
};

export const useJobMatchingStore = create<JobMatchingState>()(
  persist(
    (set, get) => ({
      // Initial state
      jobs: [],
      filteredJobs: [],
      loading: false,
      error: null,
      matches: [],
      matchingInProgress: false,
      vectorEmbeddings: new Map(),
      searchQuery: '',
      filters: defaultFilters,
      searchHistory: [],
      userPreferences: defaultUserPreferences,
      // Job Aggregation initial state
      jobSources: [
        {
          id: 'twitter-x',
          name: 'Twitter/X',
          type: 'api',
          url: 'https://api.twitter.com/2/tweets/search/recent',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 300,
          auth_required: true
        },
        {
          id: 'linkedin',
          name: 'LinkedIn Jobs',
          type: 'api',
          url: 'https://api.linkedin.com/v2/jobs',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 1000,
          auth_required: true
        },
        {
          id: 'indeed',
          name: 'Indeed',
          type: 'api',
          url: 'https://api.indeed.com/ads/apisearch',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 1000,
          auth_required: true
        },
        {
          id: 'naukri',
          name: 'Naukri.com',
          type: 'api',
          url: 'https://www.naukri.com/jobapi',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 500,
          auth_required: true
        },
        {
          id: 'reddit',
          name: 'Reddit ML Jobs',
          type: 'scraping',
          url: 'https://www.reddit.com/r/MachineLearningJobs',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 60,
          auth_required: false
        },
        {
          id: 'google-careers',
          name: 'Google Careers',
          type: 'scraping',
          url: 'https://careers.google.com/jobs',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 100,
          auth_required: false
        },
        {
          id: 'microsoft-careers',
          name: 'Microsoft Careers',
          type: 'scraping',
          url: 'https://careers.microsoft.com',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 100,
          auth_required: false
        },
        {
          id: 'amazon-careers',
          name: 'Amazon Careers',
          type: 'scraping',
          url: 'https://www.amazon.jobs',
          is_active: true,
          last_crawled: '',
          jobs_found: 0,
          rate_limit: 100,
          auth_required: false
        }
      ],
      crawlConfig: {
        keywords: ['AI', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Data Science', 'LLM'],
        locations: ['Remote', 'San Francisco', 'New York', 'Seattle', 'Austin', 'Boston'],
        experience_levels: ['Entry Level', 'Mid Level', 'Senior', 'Staff', 'Principal'],
        companies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Tesla', 'OpenAI'],
        ai_specializations: ['Google CCAI', 'Microsoft Copilot', 'Amazon Lex', 'GPT', 'Claude', 'Gemini'],
        max_age_days: 30,
        sources: ['twitter-x', 'linkedin', 'indeed', 'naukri', 'reddit', 'google-careers', 'microsoft-careers', 'amazon-careers']
      },
      aggregationSources: ['linkedin', 'indeed', 'company_sites', 'github_jobs'],
      isAggregating: false,
      aggregationProgress: [],
      duplicateJobs: [],
      qualityMetrics: {
        total_jobs: 0,
        unique_jobs: 0,
        duplicates_removed: 0,
        low_quality_filtered: 0,
        sources_active: 8
      },
      
      // One-Click Apply initial state
      applicationData: null,
      batchApplyJobs: [],
      applyProgress: [],
      isApplying: false,
      dailyApplicationCount: 0,
      applicationLimit: 10, // Compliance: 10 applies per day limit

      // Enhanced search jobs using web search API with comprehensive aggregation
      searchJobs: async (query: string) => {
        set({ loading: true, error: null, searchQuery: query });
        
        try {
          // Add to search history
          const history = get().searchHistory;
          if (!history.includes(query)) {
            set({ searchHistory: [query, ...history.slice(0, 9)] });
          }

          const newJobs: JobListing[] = [];
          
          // Enhanced search queries for comprehensive job discovery
          const searchQueries = [
            `"${query}" AI jobs 2024`,
            `"${query}" machine learning jobs remote`,
            `"${query}" artificial intelligence careers`,
            `site:linkedin.com/jobs "${query}" AI`,
            `site:indeed.com "${query}" AI jobs`,
            `site:glassdoor.com "${query}" AI positions`,
            `site:jobs.lever.co "${query}" AI`,
            `site:boards.greenhouse.io "${query}" AI`,
            `"${query}" AI engineer jobs`,
            `"${query}" data scientist positions`,
            `"${query}" ML engineer openings`,
            `"${query}" AI researcher jobs`,
          ];

          const jobs: JobListing[] = [];
          
          for (const searchQuery of searchQueries) {
            try {
              const results = await webSearch.search({ query: searchQuery });
              
              if (results.code === 200 && results.data.length > 0) {
                // Convert search results to job listings
                const jobsFromSearch = await Promise.all(
                  results.data.map(async (result) => {
                    const job = await parseSearchResultToJob(result, 'web_search', true);
                    return job;
                  })
                );
                
                jobs.push(...jobsFromSearch.filter(Boolean));
              }
            } catch (err) {
              console.warn(`Search failed for query: ${searchQuery}`, err);
            }
          }

          // Remove duplicates and store in database
          const uniqueJobs = deduplicateJobs(jobs);
          await storeJobsInDatabase(uniqueJobs);

          set({ jobs: uniqueJobs, filteredJobs: uniqueJobs, loading: false });
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to search jobs', loading: false });
        }
      },

      // Aggregate jobs from multiple sources with rate limiting
      aggregateJobs: async (sources = get().crawlConfig.sources) => {
        const state = get();
        set({ 
          isAggregating: true, 
          error: null,
          aggregationProgress: state.jobSources
            .filter(source => sources.includes(source.id))
            .map(source => ({
              source: source.name,
              status: 'pending' as const,
              jobs_found: 0,
              message: 'Waiting to start...'
            }))
        });
        
        try {
          const allJobs: JobListing[] = [];
          const { crawlConfig } = state;
          
          // Reset global rate limiting at start
          aiExtractionCount = 0;
          lastAiCall = 0;
          
          // Process each active source
          for (const sourceId of sources) {
            const source = state.jobSources.find(s => s.id === sourceId && s.is_active);
            if (!source) continue;

            // Update progress
            set(state => ({
              aggregationProgress: state.aggregationProgress.map(p => 
                p.source === source.name 
                  ? { ...p, status: 'crawling', message: 'Starting data collection...' }
                  : p
              )
            }));

            try {
              let sourceJobs: JobListing[] = [];

              switch (sourceId) {
                case 'twitter-x':
                  sourceJobs = await get().aggregateFromTwitterX([
                    '#AIJobs', '#MachineLearningJobs', '#DataScienceJobs',
                    '#MLOps', '#NLP', '#ComputerVision', '#DeepLearning'
                  ]);
                  break;
                  
                case 'linkedin':
                  sourceJobs = await get().aggregateFromLinkedIn([
                    ...crawlConfig.keywords,
                    'Copilot developer', 'CCAI specialist', 'Lex chatbot'
                  ]);
                  break;
                  
                case 'indeed':
                  sourceJobs = await get().aggregateFromIndeed([
                    ...crawlConfig.keywords,
                    'AI Engineer', 'ML Engineer', 'Data Scientist'
                  ]);
                  break;
                  
                case 'naukri':
                  sourceJobs = await get().aggregateFromNaukri([
                    ...crawlConfig.keywords,
                    'Artificial Intelligence', 'Machine Learning'
                  ]);
                  break;
                  
                case 'reddit':
                  sourceJobs = await get().aggregateFromReddit([
                    'MachineLearningJobs', 'DataScienceJobs', 'cscareerquestions'
                  ]);
                  break;
                  
                case 'google-careers':
                case 'microsoft-careers':
                case 'amazon-careers':
                  sourceJobs = await get().aggregateFromCompanySites([
                    sourceId.split('-')[0] // Extract company name
                  ]);
                  break;
              }

              // Process and normalize jobs
              sourceJobs = sourceJobs.map(job => get().normalizeJobData(job, sourceId));
              
              // Calculate quality scores
              sourceJobs = sourceJobs.map(job => ({
                ...job,
                quality_score: get().calculateQualityScore(job)
              }));

              // Filter by quality (minimum score 0.6)
              sourceJobs = sourceJobs.filter(job => job.quality_score >= 0.6);

              allJobs.push(...sourceJobs);

              // Update progress
              set(state => ({
                aggregationProgress: state.aggregationProgress.map(p => 
                  p.source === source.name 
                    ? { 
                        ...p, 
                        status: 'completed', 
                        jobs_found: sourceJobs.length,
                        message: `Found ${sourceJobs.length} quality jobs`
                      }
                    : p
                ),
                jobSources: state.jobSources.map(s => 
                  s.id === sourceId
                    ? { 
                        ...s, 
                        last_crawled: new Date().toISOString(),
                        jobs_found: sourceJobs.length
                      }
                    : s
                )
              }));

            } catch (err) {
              console.error(`Aggregation failed for ${source.name}:`, err);
              
              // Update progress with error
              set(state => ({
                aggregationProgress: state.aggregationProgress.map(p => 
                  p.source === source.name 
                    ? { 
                        ...p, 
                        status: 'failed',
                        jobs_found: 0,
                        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
                      }
                    : p
                )
              }));
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Detect duplicates
          const duplicateIds = get().detectDuplicates(allJobs);
          
          // Remove duplicates
          const uniqueJobs = allJobs.filter(job => !duplicateIds.includes(job.id));
          
          // Store jobs with embeddings
          const jobsWithEmbeddings = await Promise.all(
            uniqueJobs.map(job => get().embedJobDescription(job))
          );

          // Store in database
          await storeJobsInDatabase(jobsWithEmbeddings);

          // Update quality metrics
          const duplicatesRemoved = allJobs.length - uniqueJobs.length;
          const lowQualityFiltered = allJobs.filter(job => job.quality_score < 0.6).length;

          set({ 
            jobs: [...state.jobs, ...uniqueJobs], 
            filteredJobs: [...state.jobs, ...uniqueJobs], 
            isAggregating: false,
            lastAggregationDate: new Date().toISOString(),
            duplicateJobs: [...state.duplicateJobs, ...duplicateIds],
            qualityMetrics: {
              total_jobs: state.qualityMetrics.total_jobs + allJobs.length,
              unique_jobs: state.qualityMetrics.unique_jobs + uniqueJobs.length,
              duplicates_removed: state.qualityMetrics.duplicates_removed + duplicatesRemoved,
              low_quality_filtered: state.qualityMetrics.low_quality_filtered + lowQualityFiltered,
              sources_active: state.jobSources.filter(s => s.is_active).length
            }
          });
          
        } catch (error: any) {
          console.error('Job aggregation failed:', error);
          
          // Check if it's a rate limiting error
          const isRateLimit = error.message?.includes('rate limit') || 
                             error.message?.includes('9001');
          
          const errorMessage = isRateLimit 
            ? 'Rate limit reached. Using fallback job parsing. Some features may be limited.'
            : error.message || 'Failed to aggregate jobs';
          
          set({ 
            error: errorMessage, 
            isAggregating: false,
            aggregationProgress: state.aggregationProgress.map(p => ({
              ...p,
              status: 'failed' as const,
              message: isRateLimit ? 'Rate limited - using fallback' : (error.message || 'Aggregation failed')
            }))
          });
          
          // Show user-friendly notification
          if (isRateLimit && typeof window !== 'undefined') {
            // Reset the global AI extraction counter to use fallback parsing
            aiExtractionCount = MAX_AI_EXTRACTIONS_PER_MINUTE;
          }
        }
      },

      // Enhanced Qdrant-style job matching with vector similarity
      findJobMatches: async (resumeText?: string) => {
        set({ matchingInProgress: true, error: null });
        
        try {
          const ai = new DevvAI();
          const jobs = get().jobs;
          const { similarity_threshold, company_niche } = get().filters;
          const userPrefs = get().userPreferences;
          const embeddings = get().vectorEmbeddings;
          
          if (jobs.length === 0) {
            throw new Error('No jobs available for matching. Please search or aggregate jobs first.');
          }

          if (!resumeText) {
            throw new Error('Resume text is required for job matching.');
          }

          // Generate or retrieve cached embeddings for resume
          let resumeEmbedding = embeddings.get(`resume_${resumeText.slice(0, 100)}`);
          if (!resumeEmbedding) {
            resumeEmbedding = await generateEnhancedEmbedding(resumeText, ai);
            embeddings.set(`resume_${resumeText.slice(0, 100)}`, resumeEmbedding);
          }
          
          const matches: JobMatch[] = [];
          
          // Filter jobs by niche if specified (e.g., "Google CCAI")
          let jobsToSearch = jobs;
          if (company_niche) {
            jobsToSearch = jobs.filter(job => 
              job.title.toLowerCase().includes(company_niche.toLowerCase()) ||
              job.description.toLowerCase().includes(company_niche.toLowerCase()) ||
              job.company.toLowerCase().includes(company_niche.toLowerCase()) ||
              job.ai_specializations.some(spec => 
                spec.toLowerCase().includes(company_niche.toLowerCase())
              )
            );
          }
          
          // Calculate similarity for each job with enhanced algorithm
          for (const job of jobsToSearch) {
            const jobKey = `job_${job.id}`;
            let jobEmbedding = embeddings.get(jobKey);
            
            if (!jobEmbedding) {
              const jobText = `${job.title} ${job.description} ${job.skills.join(' ')} ${job.ai_specializations.join(' ')}`;
              jobEmbedding = await generateEnhancedEmbedding(jobText, ai);
              embeddings.set(jobKey, jobEmbedding);
            }
            
            // Enhanced similarity calculation with personalization
            const baseSimilarity = calculateEnhancedCosineSimilarity(resumeEmbedding, jobEmbedding);
            const personalizedScore = applyPersonalizationBoost(baseSimilarity, job, userPrefs);
            
            // Apply Qdrant-style threshold filtering (default 0.7)
            if (personalizedScore >= similarity_threshold) {
              const matchReasons = await analyzeEnhancedMatchReasons(resumeText, job, ai, personalizedScore);
              
              const match: JobMatch = {
                id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                job_id: job.id,
                job_title: job.title,
                company: job.company,
                similarity_score: personalizedScore,
                match_type: 'resume_vector',
                match_reasons: matchReasons,
                is_bookmarked: false,
                application_status: 'not_applied',
                created_at: new Date().toISOString(),
              };
              
              matches.push(match);
            }
          }

          // Sort by similarity score (highest first)
          matches.sort((a, b) => b.similarity_score - a.similarity_score);
          
          // Store enhanced embeddings and matches
          set({ vectorEmbeddings: embeddings });
          await storeJobMatchesInDatabase(matches);
          
          set({ 
            matches, 
            matchingInProgress: false,
            lastMatchDate: new Date().toISOString()
          });
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to find job matches', matchingInProgress: false });
        }
      },

      // Qdrant-style Job Description matching
      findJobMatchesByJD: async (jobDescriptionText: string) => {
        set({ matchingInProgress: true, error: null, jobDescriptionText });
        
        try {
          const ai = new DevvAI();
          const jobs = get().jobs;
          const { similarity_threshold } = get().filters;
          const embeddings = get().vectorEmbeddings;
          
          if (jobs.length === 0) {
            throw new Error('No jobs available for matching. Please search or aggregate jobs first.');
          }

          // Generate embedding for input JD
          const jdEmbedding = await generateEnhancedEmbedding(jobDescriptionText, ai);
          embeddings.set(`input_jd_${Date.now()}`, jdEmbedding);
          
          const matches: JobMatch[] = [];
          
          // Find similar jobs to the input JD
          for (const job of jobs) {
            const jobKey = `job_${job.id}`;
            let jobEmbedding = embeddings.get(jobKey);
            
            if (!jobEmbedding) {
              const jobText = `${job.title} ${job.description} ${job.skills.join(' ')} ${job.ai_specializations.join(' ')}`;
              jobEmbedding = await generateEnhancedEmbedding(jobText, ai);
              embeddings.set(jobKey, jobEmbedding);
            }
            
            const similarity = calculateEnhancedCosineSimilarity(jdEmbedding, jobEmbedding);
            
            if (similarity >= similarity_threshold) {
              const matchReasons = await analyzeJDMatchReasons(jobDescriptionText, job, ai);
              
              const match: JobMatch = {
                id: `jd_match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                job_id: job.id,
                job_title: job.title,
                company: job.company,
                similarity_score: similarity,
                match_type: 'job_description',
                match_reasons: matchReasons,
                is_bookmarked: false,
                application_status: 'not_applied',
                created_at: new Date().toISOString(),
              };
              
              matches.push(match);
            }
          }

          matches.sort((a, b) => b.similarity_score - a.similarity_score);
          
          set({ 
            vectorEmbeddings: embeddings,
            matches, 
            matchingInProgress: false,
            lastMatchDate: new Date().toISOString()
          });
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to find JD matches', matchingInProgress: false });
        }
      },

      // Enhanced filters with niche support
      applyFilters: (newFilters: Partial<JobSearchFilters>) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, ...newFilters };
        
        const jobs = get().jobs;
        const filtered = jobs.filter(job => {
          // Location filter
          if (updatedFilters.location && 
              !job.location.toLowerCase().includes(updatedFilters.location.toLowerCase())) {
            return false;
          }
          
          // Experience level filter
          if (updatedFilters.experience_level && 
              job.experience_level !== updatedFilters.experience_level) {
            return false;
          }
          
          // Job type filter
          if (updatedFilters.job_type && 
              job.job_type !== updatedFilters.job_type) {
            return false;
          }
          
          // Skills filter
          if (updatedFilters.skills.length > 0) {
            const hasMatchingSkill = updatedFilters.skills.some(skill =>
              job.skills.some(jobSkill => 
                jobSkill.toLowerCase().includes(skill.toLowerCase())
              )
            );
            if (!hasMatchingSkill) return false;
          }
          
          // AI specializations filter
          if (updatedFilters.ai_specializations.length > 0) {
            const hasMatchingSpec = updatedFilters.ai_specializations.some(spec =>
              job.ai_specializations.some(jobSpec => 
                jobSpec.toLowerCase().includes(spec.toLowerCase())
              )
            );
            if (!hasMatchingSpec) return false;
          }

          // Company niche filter (e.g., "Google CCAI", "Microsoft Copilot")
          if (updatedFilters.company_niche) {
            const niche = updatedFilters.company_niche.toLowerCase();
            const matchesNiche = 
              job.title.toLowerCase().includes(niche) ||
              job.description.toLowerCase().includes(niche) ||
              job.company.toLowerCase().includes(niche) ||
              job.ai_specializations.some(spec => spec.toLowerCase().includes(niche)) ||
              job.skills.some(skill => skill.toLowerCase().includes(niche));
            
            if (!matchesNiche) return false;
          }
          
          return true;
        });
        
        set({ filters: updatedFilters, filteredJobs: filtered });
      },

      // Quick niche filtering for common AI specializations
      filterByNiche: (niche: string) => {
        const currentFilters = get().filters;
        const updatedFilters = { ...currentFilters, company_niche: niche };
        get().applyFilters(updatedFilters);
      },

      // Clear all filters
      clearFilters: () => {
        const jobs = get().jobs;
        set({ filters: defaultFilters, filteredJobs: jobs });
      },

      // Bookmark a job
      bookmarkJob: async (jobId: string) => {
        try {
          const matches = get().matches;
          const updatedMatches = matches.map(match => 
            match.job_id === jobId 
              ? { ...match, is_bookmarked: !match.is_bookmarked }
              : match
          );
          
          set({ matches: updatedMatches });
          
          // Update in database
          const match = updatedMatches.find(m => m.job_id === jobId);
          if (match) {
            await table.updateItem('ewh9fiypokqo', {
              _uid: match.id.split('_')[0], // Extract uid from match id
              _id: match.id,
              is_bookmarked: match.is_bookmarked.toString(),
              updated_at: new Date().toISOString(),
            });
          }
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to bookmark job' });
        }
      },

      // Update application status
      updateApplicationStatus: async (matchId: string, status: string) => {
        try {
          const matches = get().matches;
          const updatedMatches = matches.map(match => 
            match.id === matchId 
              ? { 
                  ...match, 
                  application_status: status,
                  applied_date: status === 'applied' ? new Date().toISOString() : match.applied_date
                }
              : match
          );
          
          set({ matches: updatedMatches });
          
          // Update in database
          const match = updatedMatches.find(m => m.id === matchId);
          if (match) {
            await table.updateItem('ewh9fiypokqo', {
              _uid: matchId.split('_')[0], // Extract uid from match id
              _id: matchId,
              application_status: status,
              applied_date: match.applied_date || '',
              updated_at: new Date().toISOString(),
            });
          }
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to update application status' });
        }
      },

      // Get job by ID
      getJobById: (jobId: string) => {
        return get().jobs.find(job => job.id === jobId);
      },

      // Get job matches from database
      getJobMatches: async () => {
        try {
          const results = await table.getItems('ewh9fiypokqo');
          
          const matches = results.items.map((item: any) => ({
            id: item._id,
            job_id: item.job_id,
            job_title: item.job_title,
            company: item.company,
            similarity_score: item.similarity_score,
            match_type: item.match_type,
            match_reasons: JSON.parse(item.match_reasons || '[]'),
            is_bookmarked: item.is_bookmarked === 'true',
            application_status: item.application_status,
            applied_date: item.applied_date,
            created_at: item.created_at,
          }));
          
          set({ matches });
          
        } catch (error: any) {
          set({ error: error.message || 'Failed to load job matches' });
        }
      },

      // User preferences management
      updateUserPreferences: (preferences: Partial<UserPreferences>) => {
        const currentPrefs = get().userPreferences;
        const updatedPrefs = { ...currentPrefs, ...preferences };
        set({ userPreferences: updatedPrefs });
      },

      // Get personalized matches based on user preferences
      getPersonalizedMatches: () => {
        const matches = get().matches;
        const userPrefs = get().userPreferences;
        
        return matches
          .map(match => {
            const job = get().getJobById(match.job_id);
            if (!job) return match;
            
            // Calculate personalization boost
            let personalizedScore = match.similarity_score;
            personalizedScore = applyPersonalizationBoost(personalizedScore, job, userPrefs);
            
            return { ...match, similarity_score: personalizedScore };
          })
          .sort((a, b) => b.similarity_score - a.similarity_score);
      },

      // Vector operations
      generateJobEmbedding: async (jobText: string) => {
        const ai = new DevvAI();
        return await generateEnhancedEmbedding(jobText, ai);
      },

      calculateSimilarityScore: (resumeEmbedding: number[], jobEmbedding: number[]) => {
        return calculateEnhancedCosineSimilarity(resumeEmbedding, jobEmbedding);
      },

      // Advanced Vector Similarity Search with multiple algorithms and clustering
      performAdvancedVectorSearch: async (queryVector: number[], options: {
        algorithm?: 'cosine' | 'euclidean' | 'manhattan' | 'hybrid';
        threshold?: number;
        usePersonalization?: boolean;
        clusteringEnabled?: boolean;
        maxResults?: number;
      } = {}) => {
        const { 
          jobs, 
          vectorEmbeddings, 
          userPreferences,
          searchHistory 
        } = get();
        
        const {
          algorithm = 'hybrid',
          threshold = 0.7,
          usePersonalization = true,
          clusteringEnabled = true,
          maxResults = 50
        } = options;
        
        const results: Array<{ 
          job: JobListing; 
          score: number; 
          algorithm: string;
          clusterInfo?: any;
        }> = [];

        // Phase 1: Calculate similarities using selected algorithm
        for (const job of jobs) {
          const jobVector = vectorEmbeddings.get(job.id);
          if (jobVector) {
            let similarity = 0;
            
            switch (algorithm) {
              case 'cosine':
                similarity = calculateEnhancedCosineSimilarity(queryVector, jobVector);
                break;
              case 'euclidean':
                similarity = calculateEuclideanSimilarity(queryVector, jobVector);
                break;
              case 'manhattan':
                similarity = calculateManhattanSimilarity(queryVector, jobVector);
                break;
              case 'hybrid':
                const cosine = calculateEnhancedCosineSimilarity(queryVector, jobVector);
                const euclidean = calculateEuclideanSimilarity(queryVector, jobVector);
                const jaccard = calculateJaccardSimilarity(queryVector, jobVector);
                similarity = (cosine * 0.5) + (euclidean * 0.3) + (jaccard * 0.2);
                break;
            }
            
            // Phase 2: Apply personalization boost
            if (usePersonalization && similarity >= threshold * 0.5) {
              similarity = applyPersonalizationBoost(similarity, job, userPreferences);
            }
            
            if (similarity >= threshold) {
              results.push({ 
                job, 
                score: similarity, 
                algorithm,
                clusterInfo: clusteringEnabled ? await analyzeJobCluster(job, jobVector) : undefined
              });
            }
          }
        }

        // Phase 3: Apply advanced ranking with learning from search history
        const rankedResults = await applyAdvancedRanking(results, searchHistory, queryVector);
        
        // Phase 4: Clustering for better result organization
        let finalResults = rankedResults;
        if (clusteringEnabled && results.length > 10) {
          finalResults = await applyClustering(rankedResults, maxResults);
        }
        
        // Update state
        set({ 
          filteredJobs: finalResults.slice(0, maxResults).map(r => ({
            ...r.job, 
            similarity_score: r.score,
            match_reasons: generateMatchReasons(r.job, queryVector, r.score)
          }))
        });
        
        // Update search analytics
        await updateSearchAnalytics(queryVector, finalResults.length, algorithm);
        
        return finalResults.slice(0, Math.min(maxResults, 20));
      },

      // Advanced clustering for job recommendations
      performJobClustering: async (jobs: JobListing[] = []) => {
        const { jobs: allJobs, vectorEmbeddings } = get();
        const jobsToCluster = jobs.length > 0 ? jobs : allJobs;
        
        if (jobsToCluster.length < 3) return jobsToCluster;
        
        // Extract vectors for clustering
        const vectors: Array<{ job: JobListing; vector: number[] }> = [];
        
        for (const job of jobsToCluster) {
          const vector = vectorEmbeddings.get(job.id);
          if (vector) {
            vectors.push({ job, vector });
          }
        }
        
        // Perform K-means clustering
        const clusters = await performKMeansClustering(vectors, Math.min(5, Math.floor(vectors.length / 3)));
        
        // Organize results by clusters
        const clusteredResults = clusters.flatMap((cluster, index) => 
          cluster.jobs.map(job => ({
            ...job,
            cluster_id: index,
            cluster_center_distance: cluster.centerDistance,
            cluster_size: cluster.jobs.length
          }))
        );
        
        return clusteredResults;
      },

      // Semantic job search with natural language queries
      performSemanticSearch: async (naturalQuery: string, options: {
        includeDescriptions?: boolean;
        focusAreas?: string[];
        experienceLevel?: string;
        maxResults?: number;
      } = {}) => {
        const {
          includeDescriptions = true,
          focusAreas = [],
          experienceLevel,
          maxResults = 20
        } = options;
        
        // Generate query embedding
        const ai = new DevvAI();
        let queryEmbedding: number[];
        
        try {
          // Enhance query with context
          const enhancedQuery = `
            Job Search Query: ${naturalQuery}
            ${focusAreas.length > 0 ? `Focus Areas: ${focusAreas.join(', ')}` : ''}
            ${experienceLevel ? `Experience Level: ${experienceLevel}` : ''}
            ${includeDescriptions ? 'Include job descriptions in matching' : 'Focus on titles and skills'}
          `;
          
          queryEmbedding = await generateEnhancedEmbedding(enhancedQuery, ai);
        } catch (error) {
          // Fallback to local embedding
          queryEmbedding = generateAdvancedLocalEmbedding(naturalQuery);
        }
        
        // Perform vector search with semantic understanding
        const results = await get().performAdvancedVectorSearch(queryEmbedding, {
          algorithm: 'hybrid',
          threshold: 0.6,
          usePersonalization: true,
          clusteringEnabled: true,
          maxResults
        });
        
        // Enhance results with semantic explanations
        const enhancedResults = results.map(result => ({
          ...result,
          semantic_explanation: generateSemanticExplanation(naturalQuery, result.job, result.score)
        }));
        
        await updateSemanticSearchHistory(naturalQuery, enhancedResults.length);
        
        return enhancedResults;
      },

      // Clear error
      clearError: () => set({ error: null }),

      // One-Click Apply actions
      setupApplicationData: (data: ApplicationData) => {
        set({ applicationData: data });
      },

      addToBatchApply: (jobId: string) => {
        const job = get().getJobById(jobId);
        if (!job) return;

        const batchJobs = get().batchApplyJobs;
        if (batchJobs.find(bj => bj.job_id === jobId)) return;

        const canAutoApply = determineApplyMethod(job.external_url) !== 'manual';
        
        const batchJob: BatchApplyJob = {
          job_id: jobId,
          title: job.title,
          company: job.company,
          apply_method: determineApplyMethod(job.external_url),
          can_auto_apply: canAutoApply,
          selected: true,
        };

        set({ batchApplyJobs: [...batchJobs, batchJob] });
      },

      removeFromBatchApply: (jobId: string) => {
        const batchJobs = get().batchApplyJobs.filter(bj => bj.job_id !== jobId);
        set({ batchApplyJobs: batchJobs });
      },

      toggleBatchApplySelection: (jobId: string) => {
        const batchJobs = get().batchApplyJobs.map(bj =>
          bj.job_id === jobId ? { ...bj, selected: !bj.selected } : bj
        );
        set({ batchApplyJobs: batchJobs });
      },

      checkApplicationEligibility: (jobId: string) => {
        const state = get();
        const today = new Date().toDateString();
        
        // Reset daily count if it's a new day
        if (state.lastApplicationDate !== today) {
          set({ dailyApplicationCount: 0, lastApplicationDate: today });
        }

        if (state.dailyApplicationCount >= state.applicationLimit) {
          return { 
            canApply: false, 
            reason: `Daily application limit reached (${state.applicationLimit} per day)` 
          };
        }

        if (!state.applicationData) {
          return { 
            canApply: false, 
            reason: 'Application data not configured. Please complete your profile.' 
          };
        }

        const match = state.matches.find(m => m.job_id === jobId);
        if (match && match.application_status === 'applied') {
          return { 
            canApply: false, 
            reason: 'Already applied to this job' 
          };
        }

        return { canApply: true };
      },

      applyToJob: async (jobId: string) => {
        const state = get();
        const eligibility = get().checkApplicationEligibility(jobId);
        
        if (!eligibility.canApply) {
          throw new Error(eligibility.reason);
        }

        const job = get().getJobById(jobId);
        if (!job) throw new Error('Job not found');

        set({ isApplying: true });

        try {
          // Add progress tracking
          const progress: ApplyProgress = {
            job_id: jobId,
            status: 'applying',
            message: 'Preparing application...',
          };
          set({ applyProgress: [...get().applyProgress, progress] });

          const applyMethod = determineApplyMethod(job.external_url);
          let success = false;

          switch (applyMethod) {
            case 'linkedin_easy':
              success = await applyViaLinkedIn(job, state.applicationData!);
              break;
            case 'indeed_api':
              success = await applyViaIndeed(job, state.applicationData!);
              break;
            case 'company_direct':
              success = await applyViaCompanyAPI(job, state.applicationData!);
              break;
            default:
              // Manual fallback
              progress.status = 'requires_manual';
              progress.message = 'Auto-apply not supported. Manual application required.';
              progress.application_url = job.external_url;
              success = false;
          }

          if (success) {
            // Update application status
            await get().updateApplicationStatus(jobId, 'applied');
            
            // Increment daily count
            set({ 
              dailyApplicationCount: state.dailyApplicationCount + 1,
              lastApplicationDate: new Date().toDateString()
            });

            // Update progress
            const updatedProgress = get().applyProgress.map(p =>
              p.job_id === jobId 
                ? { ...p, status: 'success' as const, message: 'Application submitted successfully!' }
                : p
            );
            set({ applyProgress: updatedProgress });
          }

          return success;
        } catch (error) {
          // Update progress with error
          const updatedProgress = get().applyProgress.map(p =>
            p.job_id === jobId 
              ? { 
                  ...p, 
                  status: 'failed' as const, 
                  message: 'Application failed',
                  error_details: error instanceof Error ? error.message : 'Unknown error'
                }
              : p
          );
          set({ applyProgress: updatedProgress });
          throw error;
        } finally {
          set({ isApplying: false });
        }
      },

      batchApplyToJobs: async () => {
        const state = get();
        const selectedJobs = state.batchApplyJobs.filter(bj => bj.selected);
        
        if (selectedJobs.length === 0) return;

        set({ isApplying: true, applyProgress: [] });

        for (const batchJob of selectedJobs) {
          try {
            await get().applyToJob(batchJob.job_id);
            // Small delay between applications to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to apply to ${batchJob.title}:`, error);
          }
        }

        set({ isApplying: false });
      },

      getApplicationProgress: () => {
        return get().applyProgress;
      },

      resetDailyApplicationCount: () => {
        set({ dailyApplicationCount: 0, lastApplicationDate: undefined });
      },

      mapResumeToFormFields: async (jobRequirements: string) => {
        const state = get();
        if (!state.applicationData) return {};

        try {
          const ai = new OpenRouterAI();
          
          const prompt = `
Map the following resume data to common job application form fields based on the job requirements.

Resume Data:
${JSON.stringify(state.applicationData, null, 2)}

Job Requirements:
${jobRequirements}

Return a JSON object with mapped form fields like:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "summary": "Brief professional summary...",
  "experience": "Formatted experience text...",
  "skills": "Comma-separated skills",
  "education": "Formatted education text...",
  "coverLetter": "Customized cover letter text..."
}

Focus on ATS-friendly formatting and include relevant keywords from the job requirements.
`;

          const response = await ai.chat.completions.create({
            model: 'openai/gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          });

          const mappedFields = JSON.parse(response.choices[0].message.content || '{}');
          return mappedFields;
        } catch (error) {
          console.error('Error mapping resume to form fields:', error);
          // Fallback to basic mapping
          return {
            firstName: state.applicationData.personal_info.name.split(' ')[0] || '',
            lastName: state.applicationData.personal_info.name.split(' ').slice(1).join(' ') || '',
            email: state.applicationData.personal_info.email,
            phone: state.applicationData.personal_info.phone,
            summary: state.applicationData.resume_data.summary,
            skills: state.applicationData.resume_data.skills.join(', '),
          };
        }
      },

      generateApplicationUrl: (jobId: string) => {
        const job = get().getJobById(jobId);
        return job?.external_url || '#';
      },

      // Multi-Source Job Aggregation Functions
      aggregateFromTwitterX: async (hashtags: string[]) => {
        const jobs: JobListing[] = [];
        
        try {
          // Simulate Twitter/X API search for AI job posts
          const searchQueries = hashtags.map(tag => `${tag} AND (AI OR "Machine Learning" OR "Data Science")`);
          
          for (const query of searchQueries) {
            const results = await webSearch.search({ 
              query: `site:twitter.com OR site:x.com ${query} jobs 2024` 
            });
            
            if (results.code === 200) {
              const twitterJobs = await Promise.all(
                results.data.slice(0, 10).map(async (result) => {
                  const job = await parseSearchResultToJob(result, 'twitter-x', aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE);
                  return job ? { ...job, source: 'twitter-x', source_id: `tw_${Date.now()}_${Math.random()}` } : null;
                })
              );
              
              jobs.push(...twitterJobs.filter(Boolean) as JobListing[]);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
          }
        } catch (error) {
          console.error('Twitter aggregation failed:', error);
        }
        
        return jobs;
      },

      aggregateFromLinkedIn: async (keywords: string[]) => {
        const jobs: JobListing[] = [];
        
        try {
          for (const keyword of keywords) {
            const results = await webSearch.search({ 
              query: `site:linkedin.com/jobs ${keyword} AI artificial intelligence 2024` 
            });
            
            if (results.code === 200) {
              const linkedinJobs = await Promise.all(
                results.data.slice(0, 15).map(async (result) => {
                  const job = await parseSearchResultToJob(result, 'linkedin', aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE);
                  return job ? { ...job, source: 'linkedin', source_id: `li_${Date.now()}_${Math.random()}` } : null;
                })
              );
              
              jobs.push(...linkedinJobs.filter(Boolean) as JobListing[]);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // LinkedIn rate limiting
          }
        } catch (error) {
          console.error('LinkedIn aggregation failed:', error);
        }
        
        return jobs;
      },

      aggregateFromIndeed: async (searchTerms: string[]) => {
        const jobs: JobListing[] = [];
        
        try {
          for (const term of searchTerms) {
            const results = await webSearch.search({ 
              query: `site:indeed.com ${term} "artificial intelligence" OR "machine learning" 2024` 
            });
            
            if (results.code === 200) {
              const indeedJobs = await Promise.all(
                results.data.slice(0, 20).map(async (result) => {
                  const job = await parseSearchResultToJob(result, 'indeed', aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE);
                  return job ? { ...job, source: 'indeed', source_id: `in_${Date.now()}_${Math.random()}` } : null;
                })
              );
              
              jobs.push(...indeedJobs.filter(Boolean) as JobListing[]);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error('Indeed aggregation failed:', error);
        }
        
        return jobs;
      },

      aggregateFromNaukri: async (keywords: string[]) => {
        const jobs: JobListing[] = [];
        
        try {
          for (const keyword of keywords) {
            const results = await webSearch.search({ 
              query: `site:naukri.com ${keyword} AI ML "data science" india 2024` 
            });
            
            if (results.code === 200) {
              const naukriJobs = await Promise.all(
                results.data.slice(0, 12).map(async (result) => {
                  const job = await parseSearchResultToJob(result, 'naukri', aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE);
                  return job ? { ...job, source: 'naukri', source_id: `nk_${Date.now()}_${Math.random()}` } : null;
                })
              );
              
              jobs.push(...naukriJobs.filter(Boolean) as JobListing[]);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
        } catch (error) {
          console.error('Naukri aggregation failed:', error);
        }
        
        return jobs;
      },

      aggregateFromReddit: async (subreddits: string[]) => {
        const jobs: JobListing[] = [];
        
        try {
          for (const subreddit of subreddits) {
            const results = await webSearch.search({ 
              query: `site:reddit.com/r/${subreddit} "hiring" OR "job" OR "opening" AI ML 2024` 
            });
            
            if (results.code === 200) {
              const redditJobs = await Promise.all(
                results.data.slice(0, 8).map(async (result) => {
                  const job = await parseSearchResultToJob(result, 'reddit', aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE);
                  return job ? { ...job, source: 'reddit', source_id: `rd_${Date.now()}_${Math.random()}` } : null;
                })
              );
              
              jobs.push(...redditJobs.filter(Boolean) as JobListing[]);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Reddit rate limiting
          }
        } catch (error) {
          console.error('Reddit aggregation failed:', error);
        }
        
        return jobs;
      },

      aggregateFromCompanySites: async (companies: string[]) => {
        const jobs: JobListing[] = [];
        const companyUrls: Record<string, string> = {
          'google': 'careers.google.com',
          'microsoft': 'careers.microsoft.com',
          'amazon': 'amazon.jobs',
          'meta': 'careers.meta.com',
          'apple': 'jobs.apple.com',
          'netflix': 'jobs.netflix.com',
          'openai': 'openai.com/careers',
          'anthropic': 'anthropic.com/careers'
        };
        
        try {
          for (const company of companies) {
            const companyUrl = companyUrls[company.toLowerCase()];
            if (!companyUrl) continue;
            
            const results = await webSearch.search({ 
              query: `site:${companyUrl} AI "artificial intelligence" "machine learning" jobs 2024` 
            });
            
            if (results.code === 200) {
              const companyJobs = await Promise.all(
                results.data.slice(0, 10).map(async (result) => {
                  const job = await parseSearchResultToJob(result, `${company}-careers`, aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE);
                  return job ? { 
                    ...job, 
                    source: `${company}-careers`, 
                    company: company.charAt(0).toUpperCase() + company.slice(1),
                    source_id: `${company.slice(0, 2)}_${Date.now()}_${Math.random()}`
                  } : null;
                })
              );
              
              jobs.push(...companyJobs.filter(Boolean) as JobListing[]);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Company site rate limiting
          }
        } catch (error) {
          console.error('Company sites aggregation failed:', error);
        }
        
        return jobs;
      },

      // Job Processing & Normalization Functions
      normalizeJobData: (rawJob: any, source: string) => {
        const now = new Date().toISOString();
        
        return {
          ...rawJob,
          id: rawJob.id || `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source,
          source_id: rawJob.source_id || rawJob.id || `${source}_${Date.now()}`,
          posted_date: rawJob.posted_date || now,
          crawl_timestamp: now,
          normalized_score: 1.0,
          is_duplicate: false,
          quality_score: 0.8, // Will be calculated properly
          status: 'active',
          skills: Array.isArray(rawJob.skills) ? rawJob.skills : [],
          ai_specializations: Array.isArray(rawJob.ai_specializations) ? rawJob.ai_specializations : [],
          keywords: Array.isArray(rawJob.keywords) ? rawJob.keywords : []
        } as JobListing;
      },

      detectDuplicates: (jobs: JobListing[]) => {
        const duplicates: string[] = [];
        const seen = new Map<string, JobListing>();
        
        for (const job of jobs) {
          // Create a normalized signature for duplicate detection
          const signature = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}_${job.location.toLowerCase().trim()}`;
          
          if (seen.has(signature)) {
            const existing = seen.get(signature)!;
            
            // Calculate similarity score (simplified)
            const titleSimilarity = job.title.toLowerCase() === existing.title.toLowerCase() ? 1 : 0.5;
            const companySimilarity = job.company.toLowerCase() === existing.company.toLowerCase() ? 1 : 0;
            const locationSimilarity = job.location.toLowerCase() === existing.location.toLowerCase() ? 1 : 0.5;
            
            const similarity = (titleSimilarity + companySimilarity + locationSimilarity) / 3;
            
            if (similarity > 0.8) {
              duplicates.push(job.id);
            }
          } else {
            seen.set(signature, job);
          }
        }
        
        return duplicates;
      },

      calculateQualityScore: (job: JobListing) => {
        let score = 0.5; // Base score
        
        // Title quality (20%)
        if (job.title && job.title.length > 5) score += 0.2;
        
        // Description quality (25%)
        if (job.description && job.description.length > 50) score += 0.25;
        
        // Company information (15%)
        if (job.company && job.company !== 'Unknown') score += 0.15;
        
        // Skills and specializations (20%)
        if (job.skills && job.skills.length > 0) score += 0.1;
        if (job.ai_specializations && job.ai_specializations.length > 0) score += 0.1;
        
        // External URL validity (10%)
        if (job.external_url && job.external_url.startsWith('http')) score += 0.1;
        
        // Location information (10%)
        if (job.location && job.location !== 'Unknown') score += 0.1;
        
        return Math.min(1.0, score);
      },

      embedJobDescription: async (job: JobListing) => {
        try {
          const ai = new DevvAI();
          const jobText = `${job.title} ${job.description} ${job.skills.join(' ')} ${job.ai_specializations.join(' ')}`;
          
          const embedding = await generateEnhancedEmbedding(jobText, ai);
          
          return {
            ...job,
            embedding_vector: embedding
          };
        } catch (error) {
          console.error('Failed to embed job description:', error);
          return job;
        }
      },

      // Source Management Functions
      addJobSource: (source: JobSource) => {
        set(state => ({
          jobSources: [...state.jobSources, source]
        }));
      },

      updateJobSource: (sourceId: string, updates: Partial<JobSource>) => {
        set(state => ({
          jobSources: state.jobSources.map(source => 
            source.id === sourceId ? { ...source, ...updates } : source
          )
        }));
      },

      toggleJobSource: (sourceId: string) => {
        set(state => ({
          jobSources: state.jobSources.map(source => 
            source.id === sourceId ? { ...source, is_active: !source.is_active } : source
          )
        }));
      },

      updateCrawlConfig: (config: Partial<CrawlConfig>) => {
        set(state => ({
          crawlConfig: { ...state.crawlConfig, ...config }
        }));
      },

      // Real-time Updates (Webhook simulation)
      setupWebhooks: async () => {
        console.log('Setting up webhook listeners for real-time job updates...');
        // In a real implementation, this would set up webhook endpoints
        // For now, we'll simulate with periodic checks
      },

      processWebhookData: async (source: string, data: any[]) => {
        try {
          const normalizedJobs = data.map(rawJob => get().normalizeJobData(rawJob, source));
          const duplicateIds = get().detectDuplicates(normalizedJobs);
          const uniqueJobs = normalizedJobs.filter(job => !duplicateIds.includes(job.id));
          
          // Add to existing jobs
          set(state => ({
            jobs: [...state.jobs, ...uniqueJobs],
            filteredJobs: [...state.filteredJobs, ...uniqueJobs]
          }));
          
        } catch (error) {
          console.error('Webhook processing failed:', error);
        }
      },

      scheduleAggregation: (intervalHours: number) => {
        // In a real implementation, this would set up a cron job or scheduled task
        console.log(`Scheduling job aggregation every ${intervalHours} hours`);
        
        setInterval(() => {
          console.log('Running scheduled job aggregation...');
          get().aggregateJobs();
        }, intervalHours * 60 * 60 * 1000);
      },
    }),
    {
      name: 'job-matching-store',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        filters: state.filters,
        aggregationSources: state.aggregationSources,
        userPreferences: state.userPreferences,
        applicationData: state.applicationData,
        dailyApplicationCount: state.dailyApplicationCount,
        lastApplicationDate: state.lastApplicationDate,
        // Job aggregation persistence
        jobSources: state.jobSources,
        crawlConfig: state.crawlConfig,
        lastAggregationDate: state.lastAggregationDate,
        duplicateJobs: state.duplicateJobs,
        qualityMetrics: state.qualityMetrics,
        // Don't persist vector embeddings, batch jobs, progress, or jobs due to size/temporary nature
      }),
    }
  )
);

// Global rate limiting state
let aiExtractionCount = 0;
let lastAiCall = 0;
const MAX_AI_EXTRACTIONS_PER_MINUTE = 10;
const AI_CALL_DELAY = 6000; // 6 seconds between calls

// Helper functions
async function parseSearchResultToJob(result: any, source: string, useAI: boolean = true): Promise<JobListing | null> {
  try {
    // First try AI extraction with proper rate limiting
    let jobData: any = null;
    const currentTime = Date.now();
    
    // Check if we should use AI extraction or fallback immediately
    const shouldUseAI = useAI && 
                       aiExtractionCount < MAX_AI_EXTRACTIONS_PER_MINUTE && 
                       (currentTime - lastAiCall) >= AI_CALL_DELAY;
    
    if (shouldUseAI) {
      try {
        // Wait for rate limit delay if needed
        const timeSinceLastCall = currentTime - lastAiCall;
        if (timeSinceLastCall < AI_CALL_DELAY) {
          await new Promise(resolve => setTimeout(resolve, AI_CALL_DELAY - timeSinceLastCall));
        }
        
        const ai = new DevvAI();
        
        // Use AI to extract structured job information
        const response = await ai.chat.completions.create({
          model: 'default',
          messages: [
            {
              role: 'system',
              content: `You are a job data extractor. Extract structured job information from web search results. 
              Return ONLY a JSON object with these fields:
              {
                "title": "job title",
                "company": "company name", 
                "location": "location or remote",
                "experience_level": "entry|mid|senior|principal",
                "job_type": "full-time|part-time|contract",
                "skills": ["skill1", "skill2"],
                "ai_specializations": ["ai area1", "ai area2"],
                "salary_range": "salary info if available",
                "description": "brief description"
              }
              If information is missing, use reasonable defaults or empty values.`
            },
            {
              role: 'user',
              content: `Extract job information from:
              Title: ${result.title}
              Description: ${result.description}
              URL: ${result.url}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        });

        const content = response.choices[0].message.content?.trim();
        if (content) {
          jobData = JSON.parse(content);
          aiExtractionCount++;
          lastAiCall = Date.now();
        }
      } catch (aiError: any) {
        console.warn('AI extraction failed, using fallback parsing:', aiError.message);
        
        // Reset rate limiting on certain errors
        if (aiError.message?.includes('rate limit')) {
          aiExtractionCount = MAX_AI_EXTRACTIONS_PER_MINUTE; // Disable AI for this session
        }
        
        // Fallback to rule-based parsing when AI fails
        jobData = parseJobDataFallback(result);
      }
    } else {
      // Use fallback parsing when rate limited or AI disabled
      console.log('Using fallback parsing due to rate limits or AI disabled');
      jobData = parseJobDataFallback(result);
    }

    // If both AI and fallback fail, return null
    if (!jobData) return null;
    
    const now = new Date().toISOString();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: jobId,
      title: jobData.title || 'Unknown Position',
      company: jobData.company || 'Unknown Company',
      description: jobData.description || result.description,
      location: jobData.location || 'Not specified',
      experience_level: jobData.experience_level || 'mid',
      skills: jobData.skills || [],
      ai_specializations: jobData.ai_specializations || [],
      salary_range: jobData.salary_range,
      job_type: jobData.job_type || 'full-time',
      source,
      source_id: `${source}_${Date.now()}`,
      external_url: result.url,
      keywords: extractKeywords(result.title + ' ' + result.description),
      posted_date: now,
      status: 'active',
      normalized_score: 1.0,
      quality_score: 0.8,
      is_duplicate: false,
      crawl_timestamp: now,
    };
    
  } catch (error) {
    console.warn('Failed to parse job result:', error);
    return null;
  }
}

// Fallback parsing function when AI extraction fails
function parseJobDataFallback(result: any): any {
  const title = result.title || 'Unknown Position';
  const description = result.description || '';
  const url = result.url || '';
  
  // Extract company from title or description
  let company = 'Unknown Company';
  const companyMatch = title.match(/at\s+([^-\s]+)/i) || 
                      description.match(/(?:at|@)\s+([A-Za-z0-9\s]+)/i);
  if (companyMatch) {
    company = companyMatch[1].trim();
  }
  
  // Extract location
  let location = 'Remote';
  const locationMatch = description.match(/(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*[A-Z]{2}?)/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }
  
  // Determine experience level
  let experience_level = 'mid';
  const lowerText = (title + ' ' + description).toLowerCase();
  if (lowerText.includes('senior') || lowerText.includes('sr.') || lowerText.includes('lead')) {
    experience_level = 'senior';
  } else if (lowerText.includes('junior') || lowerText.includes('jr.') || lowerText.includes('entry')) {
    experience_level = 'entry';
  } else if (lowerText.includes('principal') || lowerText.includes('staff') || lowerText.includes('architect')) {
    experience_level = 'principal';
  }
  
  // Extract job type
  let job_type = 'full-time';
  if (lowerText.includes('contract') || lowerText.includes('freelance')) {
    job_type = 'contract';
  } else if (lowerText.includes('part-time') || lowerText.includes('part time')) {
    job_type = 'part-time';
  }
  
  // Extract AI-related skills
  const skills = extractKeywords(title + ' ' + description);
  
  // Categorize AI specializations
  const ai_specializations: string[] = [];
  if (lowerText.includes('machine learning') || lowerText.includes('ml')) {
    ai_specializations.push('Machine Learning');
  }
  if (lowerText.includes('nlp') || lowerText.includes('natural language')) {
    ai_specializations.push('Natural Language Processing');
  }
  if (lowerText.includes('computer vision') || lowerText.includes('cv')) {
    ai_specializations.push('Computer Vision');
  }
  if (lowerText.includes('deep learning') || lowerText.includes('neural')) {
    ai_specializations.push('Deep Learning');
  }
  
  // Extract salary if mentioned
  let salary_range = '';
  const salaryMatch = description.match(/\$[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*(?:per\s+year|annually|\/year))?/i);
  if (salaryMatch) {
    salary_range = salaryMatch[0];
  }
  
  return {
    title,
    company,
    location,
    experience_level,
    job_type,
    skills: skills.slice(0, 10), // Limit to 10 skills
    ai_specializations,
    salary_range,
    description: description.length > 500 ? description.substring(0, 500) + '...' : description
  };
}

function extractKeywords(text: string): string[] {
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural networks', 'nlp', 'natural language processing', 'computer vision',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
    'openai', 'gpt', 'llm', 'large language model', 'transformer',
    'bert', 'hugging face', 'langchain', 'vector database',
    'chatbot', 'conversational ai', 'voice assistant',
    'ccai', 'contact center ai', 'copilot', 'lex', 'dialogflow',
    'rasa', 'watson', 'gemini', 'claude', 'anthropic'
  ];
  
  const lowerText = text.toLowerCase();
  return aiKeywords.filter(keyword => lowerText.includes(keyword));
}

function deduplicateJobs(jobs: JobListing[]): JobListing[] {
  const seen = new Set();
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function storeJobsInDatabase(jobs: JobListing[]): Promise<void> {
  for (const job of jobs) {
    try {
      await table.addItem('ewh9f12idaf4', {
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        experience_level: job.experience_level,
        skills: JSON.stringify(job.skills),
        ai_specializations: JSON.stringify(job.ai_specializations),
        salary_range: job.salary_range || '',
        job_type: job.job_type,
        source: job.source,
        external_url: job.external_url,
        keywords: JSON.stringify(job.keywords),
        posted_date: job.posted_date,
        expires_date: job.expires_date || '',
        status: job.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to store job:', job.title, error);
    }
  }
}

async function storeJobMatchesInDatabase(matches: JobMatch[]): Promise<void> {
  for (const match of matches) {
    try {
      await table.addItem('ewh9fiypokqo', {
        job_id: match.job_id,
        job_title: match.job_title,
        company: match.company,
        similarity_score: match.similarity_score,
        match_type: match.match_type,
        match_reasons: JSON.stringify(match.match_reasons),
        is_bookmarked: match.is_bookmarked.toString(),
        application_status: match.application_status,
        applied_date: match.applied_date || '',
        created_at: match.created_at,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to store match:', match.job_title, error);
    }
  }
}

async function generateTextEmbedding(text: string, ai: DevvAI): Promise<number[]> {
  try {
    // Use AI to generate a simple embedding representation
    const response = await ai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: 'Convert the following text into a numerical vector representation. Return only a JSON array of 100 numbers between -1 and 1 that represent the semantic meaning of the text.'
        },
        {
          role: 'user',
          content: text.substring(0, 1000) // Limit text length
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content?.trim();
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        // Fallback: generate simple embedding based on text features
        return generateSimpleEmbedding(text);
      }
    }
    
    return generateSimpleEmbedding(text);
    
  } catch (error) {
    return generateSimpleEmbedding(text);
  }
}

function generateSimpleEmbedding(text: string): number[] {
  // Simple hash-based embedding as fallback
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(100).fill(0);
  
  words.forEach((word, index) => {
    const hash = simpleHash(word);
    for (let i = 0; i < 10; i++) {
      const pos = (hash + i) % 100;
      embedding[pos] += 0.1 * (1 - (i * 0.1));
    }
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Advanced multi-modal embedding generation with semantic understanding
async function generateEnhancedEmbedding(text: string, ai: DevvAI): Promise<number[]> {
  try {
    // Use OpenRouter AI for more sophisticated embeddings with advanced models
    const openRouterAI = new OpenRouterAI();
    
    const response = await openRouterAI.chat.completions.create({
      model: 'google/gemini-pro-1.5',
      messages: [
        {
          role: 'system',
          content: `You are an advanced embedding generator for AI job matching. Generate a sophisticated 512-dimensional vector embedding that captures deep semantic meaning.

EMBEDDING REQUIREMENTS:
- Exactly 512 dimensions (numbers between -1 and 1)
- Focus on AI/ML semantic relationships
- Capture skill hierarchies and domain expertise
- Understand role progression and career pathways
- Encode company culture and work environment
- Consider geographic and remote work preferences

SEMANTIC ANALYSIS PRIORITIES:
1. Technical Skills (30%): AI/ML frameworks, programming languages, cloud platforms
2. Domain Expertise (25%): Computer Vision, NLP, Robotics, etc.
3. Experience Level (20%): Junior, Mid, Senior, Staff, Principal
4. Company Context (15%): Startup, Big Tech, Research, Enterprise
5. Role Type (10%): Research, Engineering, Product, Leadership

Return ONLY a JSON array of exactly 512 numbers.`
        },
        {
          role: 'user',
          content: `Generate semantic embedding for: ${text.substring(0, 3000)}`
        }
      ],
      temperature: 0.05, // Very low for consistency
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content?.trim();
    if (content) {
      try {
        const embedding = JSON.parse(content);
        if (Array.isArray(embedding) && embedding.length === 512) {
          // Normalize to unit vector for better similarity calculations
          return normalizeVector(embedding);
        }
      } catch {}
    }
    
    // Fallback to advanced local embedding
    return generateAdvancedLocalEmbedding(text);
    
  } catch (error) {
    console.warn('OpenRouter embedding failed, using local:', error.message);
    return generateAdvancedLocalEmbedding(text);
  }
}

// Advanced local embedding with hierarchical skill understanding
function generateAdvancedLocalEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = extractPhrases(text.toLowerCase());
  const embedding = new Array(512).fill(0);
  
  // Comprehensive AI/ML domain knowledge graph
  const domainWeights = {
    // Core AI/ML
    'artificial intelligence': 2.5, 'machine learning': 2.4, 'deep learning': 2.3,
    'neural networks': 2.2, 'reinforcement learning': 2.1, 'computer vision': 2.2,
    'natural language processing': 2.3, 'nlp': 2.3, 'large language models': 2.4,
    'llm': 2.4, 'generative ai': 2.3, 'transformer': 2.2, 'attention mechanism': 2.1,
    
    // Frameworks & Tools
    'tensorflow': 2.0, 'pytorch': 2.0, 'keras': 1.8, 'scikit-learn': 1.7,
    'hugging face': 1.9, 'openai': 1.8, 'anthropic': 1.8, 'langchain': 1.9,
    'llamaindex': 1.8, 'vector database': 2.0, 'pinecone': 1.7, 'weaviate': 1.7,
    'chromadb': 1.6, 'qdrant': 1.8, 'faiss': 1.7, 'elasticsearch': 1.6,
    
    // Cloud & MLOps
    'aws sagemaker': 1.9, 'azure ml': 1.9, 'google cloud ai': 1.9,
    'mlflow': 1.7, 'kubeflow': 1.7, 'docker': 1.5, 'kubernetes': 1.6,
    'mlops': 1.8, 'model deployment': 1.7, 'model monitoring': 1.6,
    
    // Programming Languages
    'python': 1.6, 'r': 1.4, 'java': 1.3, 'scala': 1.4, 'sql': 1.5,
    'javascript': 1.2, 'typescript': 1.3, 'c++': 1.4, 'rust': 1.5,
    
    // Specialized AI Applications
    'object detection': 1.9, 'image segmentation': 1.8,
    'facial recognition': 1.7, 'ocr': 1.6, 'image classification': 1.8,
    'speech recognition': 1.9, 'text to speech': 1.8, 'voice synthesis': 1.7,
    'chatbot': 1.8, 'conversational ai': 2.0, 'dialogue systems': 1.9,
    'recommendation systems': 1.9, 'search algorithms': 1.7, 'ranking': 1.6,
    
    // Industry-Specific
    'google ccai': 2.4, 'contact center ai': 2.4, 'microsoft copilot': 2.3,
    'github copilot': 2.2, 'amazon lex': 2.1, 'dialogflow': 1.9,
    'watson': 1.8, 'alexa': 1.7, 'cortana': 1.6,
    
    // Experience Levels
    'senior': 1.8, 'staff': 2.0, 'principal': 2.2, 'lead': 1.9,
    'architect': 2.1, 'director': 2.0, 'vp': 1.9, 'head of': 2.0,
    
    // Company Types
    'faang': 2.1, 'big tech': 2.0, 'startup': 1.8, 'unicorn': 1.9,
    'research': 2.0, 'academic': 1.7, 'enterprise': 1.6
  };
  
  // Process phrases first (more context)
  phrases.forEach(phrase => {
    const weight = domainWeights[phrase] || 1.0;
    const hash = advancedHash(phrase);
    
    // Distribute across multiple dimensions with semantic clustering
    for (let i = 0; i < 32; i++) {
      const pos = (hash + i * 17) % 512; // Prime number for better distribution
      const decay = Math.exp(-i * 0.1); // Exponential decay
      embedding[pos] += weight * 0.15 * decay;
    }
  });
  
  // Process individual words
  words.forEach((word, index) => {
    const weight = domainWeights[word] || 0.8;
    const hash = advancedHash(word);
    const positionWeight = 1.0 - (index / (words.length * 2)); // Early words more important
    
    for (let i = 0; i < 16; i++) {
      const pos = (hash + i * 23) % 512;
      const decay = Math.exp(-i * 0.15);
      embedding[pos] += weight * positionWeight * 0.08 * decay;
    }
  });
  
  // Add semantic clustering based on context
  addSemanticClusters(embedding, text);
  
  // Normalize to unit vector
  return normalizeVector(embedding);
}

// Extract meaningful phrases from text
function extractPhrases(text: string): string[] {
  const phrases: string[] = [];
  
  // Common AI/ML phrases
  const phrasePatterns = [
    /artificial intelligence/g, /machine learning/g, /deep learning/g,
    /neural networks?/g, /computer vision/g, /natural language processing/g,
    /large language models?/g, /generative ai/g, /reinforcement learning/g,
    /contact center ai/g, /microsoft copilot/g, /github copilot/g,
    /amazon lex/g, /google ccai/g, /vector database/g, /model deployment/g,
    /data science/g, /model training/g, /feature engineering/g,
    /hyperparameter tuning/g, /transfer learning/g, /few shot learning/g
  ];
  
  phrasePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.push(...matches);
    }
  });
  
  return [...new Set(phrases)]; // Remove duplicates
}

// Advanced hash function with better distribution
function advancedHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Add semantic clustering to enhance embeddings
function addSemanticClusters(embedding: number[], text: string): void {
  const lowerText = text.toLowerCase();
  
  // Define semantic clusters
  const clusters = {
    // Technical AI cluster (dimensions 0-63)
    technical: ['python', 'tensorflow', 'pytorch', 'machine learning', 'deep learning'],
    // Cloud/Infrastructure cluster (dimensions 64-127)
    infrastructure: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mlops'],
    // Domain applications cluster (dimensions 128-191)
    applications: ['computer vision', 'nlp', 'chatbot', 'recommendation', 'search'],
    // Industry/Company cluster (dimensions 192-255)
    industry: ['google', 'microsoft', 'amazon', 'startup', 'enterprise', 'research'],
    // Experience cluster (dimensions 256-319)
    experience: ['senior', 'staff', 'principal', 'lead', 'architect', 'director'],
    // Emerging tech cluster (dimensions 320-383)
    emerging: ['llm', 'gpt', 'claude', 'generative ai', 'multimodal', 'rag'],
    // Tools cluster (dimensions 384-447)
    tools: ['langchain', 'llamaindex', 'vector database', 'pinecone', 'chromadb'],
    // Soft skills cluster (dimensions 448-511)
    soft: ['leadership', 'communication', 'collaboration', 'mentoring', 'strategy']
  };
  
  Object.entries(clusters).forEach(([clusterName, keywords], clusterIndex) => {
    const baseOffset = clusterIndex * 64;
    let clusterScore = 0;
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        clusterScore += 1.0;
      }
    });
    
    if (clusterScore > 0) {
      // Enhance the cluster dimensions
      for (let i = 0; i < 64; i++) {
        const pos = baseOffset + i;
        if (pos < 512) {
          embedding[pos] += clusterScore * 0.1 * Math.exp(-i * 0.05);
        }
      }
    }
  });
}

// Normalize vector to unit length
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
}

// Advanced multi-metric similarity calculation with semantic understanding
function calculateEnhancedCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  // Standard cosine similarity
  const cosineSim = calculateStandardCosineSimilarity(a, b);
  
  // Enhanced with semantic clustering similarity
  const clusterSim = calculateClusterSimilarity(a, b);
  
  // Weighted combination for better matching
  const combinedSimilarity = (cosineSim * 0.7) + (clusterSim * 0.3);
  
  // Apply sigmoid normalization for better score distribution
  return sigmoidNormalization(combinedSimilarity);
}

// Standard cosine similarity calculation
function calculateStandardCosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  const similarity = dotProduct / (magnitudeA * magnitudeB);
  return Math.max(0, (similarity + 1) / 2); // Normalize to [0, 1]
}

// Calculate similarity within semantic clusters
function calculateClusterSimilarity(a: number[], b: number[]): number {
  const clusterSize = 64;
  const numClusters = Math.floor(a.length / clusterSize);
  let totalSimilarity = 0;
  
  for (let cluster = 0; cluster < numClusters; cluster++) {
    const start = cluster * clusterSize;
    const end = Math.min(start + clusterSize, a.length);
    
    const clusterA = a.slice(start, end);
    const clusterB = b.slice(start, end);
    
    const clusterSim = calculateStandardCosineSimilarity(clusterA, clusterB);
    
    // Weight clusters differently based on their semantic importance
    const clusterWeights = [1.2, 1.1, 1.15, 1.0, 1.05, 1.25, 1.1, 0.9]; // Adjust per cluster importance
    const weight = clusterWeights[cluster] || 1.0;
    
    totalSimilarity += clusterSim * weight;
  }
  
  return totalSimilarity / numClusters;
}

// Sigmoid normalization for better score distribution
function sigmoidNormalization(score: number): number {
  // Apply sigmoid function to enhance score separation
  const k = 8; // Steepness parameter
  const sigmoid = 1 / (1 + Math.exp(-k * (score - 0.5)));
  
  // Ensure minimum threshold for quality matches
  return sigmoid > 0.3 ? sigmoid : 0;
}

// Advanced euclidean distance with normalization
function calculateEuclideanSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  const distance = Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
  
  // Convert distance to similarity (inverse relationship)
  const maxDistance = Math.sqrt(a.length * 2); // Maximum possible distance
  return Math.max(0, 1 - (distance / maxDistance));
}

// Manhattan distance similarity
function calculateManhattanSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  const distance = a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
  const maxDistance = a.length * 2; // Maximum possible Manhattan distance
  
  return Math.max(0, 1 - (distance / maxDistance));
}

// Jaccard similarity for binary features
function calculateJaccardSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let intersection = 0;
  let union = 0;
  
  for (let i = 0; i < a.length; i++) {
    const binaryA = a[i] > 0 ? 1 : 0;
    const binaryB = b[i] > 0 ? 1 : 0;
    
    intersection += Math.min(binaryA, binaryB);
    union += Math.max(binaryA, binaryB);
  }
  
  return union > 0 ? intersection / union : 0;
}

// Advanced personalization with machine learning-inspired scoring
function applyPersonalizationBoost(baseSimilarity: number, job: JobListing, userPrefs: UserPreferences): number {
  let totalBoost = 0;
  let featureCount = 0;
  
  // Location preference with distance-based scoring
  if (userPrefs.preferred_locations.length > 0) {
    const locationScore = calculateLocationScore(job.location, userPrefs.preferred_locations);
    totalBoost += locationScore * 0.12; // Increased weight
    featureCount++;
  }
  
  // AI focus area with hierarchical matching
  if (userPrefs.ai_focus_areas.length > 0) {
    const aiScore = calculateAIFocusScore(job, userPrefs.ai_focus_areas);
    totalBoost += aiScore * 0.15; // Highest weight for AI specialization
    featureCount++;
  }
  
  // Career level with progressive matching
  const careerScore = calculateCareerLevelScore(job.experience_level, userPrefs.career_level);
  totalBoost += careerScore * 0.08;
  featureCount++;
  
  // Salary expectation with range matching
  if (job.salary_range && userPrefs.salary_expectations.min > 0) {
    const salaryScore = calculateSalaryScore(job.salary_range, userPrefs.salary_expectations);
    totalBoost += salaryScore * 0.06;
    featureCount++;
  }
  
  // Company preference matching
  if (userPrefs.preferred_company_types?.length > 0) {
    const companyScore = calculateCompanyTypeScore(job, userPrefs.preferred_company_types);
    totalBoost += companyScore * 0.07;
    featureCount++;
  }
  
  // Remote work preference
  if (userPrefs.remote_preference !== undefined) {
    const remoteScore = calculateRemoteScore(job, userPrefs.remote_preference);
    totalBoost += remoteScore * 0.05;
    featureCount++;
  }
  
  // Skills overlap with exponential bonus
  const skillsScore = calculateSkillsOverlapScore(job.skills, userPrefs.skills || []);
  totalBoost += skillsScore * 0.10;
  featureCount++;
  
  // Apply confidence adjustment based on feature count
  const confidenceMultiplier = Math.min(1.0, featureCount / 5.0);
  const adjustedBoost = totalBoost * confidenceMultiplier;
  
  // Use weighted harmonic mean for final score
  const alpha = 0.7; // Base similarity weight
  const beta = 0.3;  // Personalization weight
  
  return (alpha * baseSimilarity + beta * Math.min(1.0, baseSimilarity + adjustedBoost)) / (alpha + beta);
}

// Location scoring with fuzzy matching
function calculateLocationScore(jobLocation: string, preferredLocations: string[]): number {
  const normalizedJobLocation = jobLocation.toLowerCase();
  let maxScore = 0;
  
  for (const prefLocation of preferredLocations) {
    const normalizedPref = prefLocation.toLowerCase();
    
    // Exact match
    if (normalizedJobLocation.includes(normalizedPref)) {
      maxScore = Math.max(maxScore, 1.0);
    }
    // Partial city/state match
    else if (calculateStringSimilarity(normalizedJobLocation, normalizedPref) > 0.7) {
      maxScore = Math.max(maxScore, 0.8);
    }
    // Remote work bonus
    else if (normalizedJobLocation.includes('remote') && normalizedPref.includes('remote')) {
      maxScore = Math.max(maxScore, 0.9);
    }
  }
  
  return maxScore;
}

// AI focus scoring with domain hierarchy
function calculateAIFocusScore(job: JobListing, aiFocusAreas: string[]): number {
  let totalScore = 0;
  const domainHierarchy = {
    'machine learning': ['ml', 'ai', 'artificial intelligence', 'data science'],
    'deep learning': ['neural networks', 'tensorflow', 'pytorch', 'keras'],
    'computer vision': ['opencv', 'image processing', 'object detection'],
    'nlp': ['natural language processing', 'language models', 'transformers'],
    'robotics': ['ros', 'autonomous systems', 'motion planning'],
    'generative ai': ['gpt', 'llm', 'text generation', 'content creation']
  };
  
  for (const focusArea of aiFocusAreas) {
    const normalizedFocus = focusArea.toLowerCase();
    
    // Direct match in specializations
    const specMatch = job.ai_specializations.some(spec => 
      spec.toLowerCase().includes(normalizedFocus)
    );
    if (specMatch) totalScore += 1.0;
    
    // Skills match with hierarchy
    const skillsMatch = job.skills.some(skill => {
      const normalizedSkill = skill.toLowerCase();
      if (normalizedSkill.includes(normalizedFocus)) return true;
      
      // Check hierarchical relationships
      const relatedTerms = domainHierarchy[normalizedFocus] || [];
      return relatedTerms.some(term => normalizedSkill.includes(term));
    });
    if (skillsMatch) totalScore += 0.8;
    
    // Description match
    if (job.description.toLowerCase().includes(normalizedFocus)) {
      totalScore += 0.6;
    }
  }
  
  return Math.min(1.0, totalScore / aiFocusAreas.length);
}

// Career level scoring with progression understanding
function calculateCareerLevelScore(jobLevel: string, preferredLevel: string): number {
  if (!jobLevel || !preferredLevel) return 0.5;
  
  const levelHierarchy = {
    'internship': 0, 'entry': 1, 'junior': 2, 'mid': 3, 'senior': 4, 
    'staff': 5, 'principal': 6, 'director': 7, 'vp': 8, 'c-level': 9
  };
  
  const jobLevelNum = levelHierarchy[jobLevel.toLowerCase()] ?? 3;
  const prefLevelNum = levelHierarchy[preferredLevel.toLowerCase()] ?? 3;
  
  const levelDiff = Math.abs(jobLevelNum - prefLevelNum);
  
  // Perfect match
  if (levelDiff === 0) return 1.0;
  // One level difference
  if (levelDiff === 1) return 0.8;
  // Two levels difference
  if (levelDiff === 2) return 0.6;
  // Greater difference
  return Math.max(0.2, 1.0 - (levelDiff * 0.15));
}

// Salary scoring with range overlap
function calculateSalaryScore(jobSalaryRange: string, expectations: { min: number; max: number }): number {
  const salaryNumbers = jobSalaryRange.match(/\d+/g);
  if (!salaryNumbers || salaryNumbers.length === 0) return 0.5;
  
  let jobMin = parseInt(salaryNumbers[0]) * 1000;
  let jobMax = salaryNumbers.length > 1 ? parseInt(salaryNumbers[1]) * 1000 : jobMin * 1.3;
  
  // Handle different formats
  if (jobSalaryRange.toLowerCase().includes('k')) {
    jobMin = parseInt(salaryNumbers[0]) * 1000;
    jobMax = salaryNumbers.length > 1 ? parseInt(salaryNumbers[1]) * 1000 : jobMin * 1.2;
  }
  
  // Calculate overlap
  const overlapStart = Math.max(jobMin, expectations.min);
  const overlapEnd = Math.min(jobMax, expectations.max);
  
  if (overlapStart <= overlapEnd) {
    const overlapAmount = overlapEnd - overlapStart;
    const totalRange = Math.max(jobMax - jobMin, expectations.max - expectations.min);
    return overlapAmount / totalRange;
  }
  
  // No overlap - penalize based on distance
  const distance = Math.min(
    Math.abs(expectations.min - jobMax),
    Math.abs(expectations.max - jobMin)
  );
  const avgSalary = (expectations.min + expectations.max) / 2;
  
  return Math.max(0.1, 1.0 - (distance / avgSalary));
}

// Skills overlap with weighted importance
function calculateSkillsOverlapScore(jobSkills: string[], userSkills: string[]): number {
  if (userSkills.length === 0) return 0.5;
  
  let matchCount = 0;
  let totalWeight = 0;
  
  // Define skill importance weights
  const skillWeights = {
    'python': 1.2, 'tensorflow': 1.3, 'pytorch': 1.3, 'machine learning': 1.4,
    'deep learning': 1.4, 'nlp': 1.3, 'computer vision': 1.3, 'aws': 1.1,
    'kubernetes': 1.0, 'docker': 0.9, 'git': 0.8, 'sql': 1.0
  };
  
  for (const userSkill of userSkills) {
    const weight = skillWeights[userSkill.toLowerCase()] || 1.0;
    totalWeight += weight;
    
    const hasMatch = jobSkills.some(jobSkill => 
      calculateStringSimilarity(jobSkill.toLowerCase(), userSkill.toLowerCase()) > 0.8
    );
    
    if (hasMatch) matchCount += weight;
  }
  
  return totalWeight > 0 ? matchCount / totalWeight : 0;
}

// String similarity using Levenshtein distance
function calculateStringSimilarity(a: string, b: string): number {
  const matrix = [];
  const n = b.length;
  const m = a.length;
  
  if (n === 0) return m === 0 ? 1 : 0;
  if (m === 0) return 0;
  
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  return maxLength > 0 ? 1 - (matrix[m][n] / maxLength) : 0;
}

// Additional scoring functions for company type and remote work
function calculateCompanyTypeScore(job: JobListing, preferredTypes: string[]): number {
  // Implementation for company type matching
  return 0.5; // Placeholder
}

function calculateRemoteScore(job: JobListing, remotePreference: string): number {
  const isRemote = job.location.toLowerCase().includes('remote');
  if (remotePreference === 'remote' && isRemote) return 1.0;
  if (remotePreference === 'onsite' && !isRemote) return 1.0;
  if (remotePreference === 'hybrid') return 0.8;
  return 0.3;
}

async function analyzeEnhancedMatchReasons(resumeText: string, job: JobListing, ai: DevvAI, similarity: number): Promise<string[]> {
  try {
    const response = await ai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: `Analyze why a resume matches a job with enhanced reasoning. Focus on AI/ML skills, technical alignment, and career progression. Return ONLY a JSON array of 4-6 specific match reasons as strings. Be specific about technologies, skills, and experience level alignment.`
        },
        {
          role: 'user',
          content: `Resume: ${resumeText.substring(0, 800)}
          
          Job: ${job.title} at ${job.company}
          Location: ${job.location}
          Required skills: ${job.skills.join(', ')}
          AI specializations: ${job.ai_specializations.join(', ')}
          Experience level: ${job.experience_level}
          
          Similarity score: ${(similarity * 100).toFixed(1)}%
          
          Provide specific technical and experiential match reasons:`
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content?.trim();
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return content.split('\n').filter(line => line.trim()).slice(0, 6);
      }
    }
    
    return [
      'Strong AI/ML technical skills alignment',
      'Experience level matches requirements',
      'Relevant industry background',
      'Complementary skill set'
    ];
    
  } catch (error) {
    return ['Technical skills alignment', 'Experience match', 'AI specialization fit', 'Industry relevance'];
  }
}

async function analyzeJDMatchReasons(inputJD: string, job: JobListing, ai: DevvAI): Promise<string[]> {
  try {
    const response = await ai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: 'Compare two job descriptions and explain why they are similar. Return ONLY a JSON array of 3-5 specific similarity reasons as strings.'
        },
        {
          role: 'user',
          content: `Input JD: ${inputJD.substring(0, 600)}
          
          Similar Job: ${job.title} at ${job.company}
          Description: ${job.description.substring(0, 400)}
          Skills: ${job.skills.join(', ')}
          
          Why are these job descriptions similar?`
        }
      ],
      temperature: 0.2,
      max_tokens: 250,
    });

    const content = response.choices[0].message.content?.trim();
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return content.split('\n').filter(line => line.trim()).slice(0, 5);
      }
    }
    
    return ['Similar role requirements', 'Comparable skill sets', 'Industry alignment', 'Experience level match'];
    
  } catch (error) {
    return ['Role similarity', 'Skill overlap', 'Industry match', 'Experience alignment'];
  }
}

async function analyzeMatchReasons(resumeText: string, job: JobListing, ai: DevvAI): Promise<string[]> {
  return await analyzeEnhancedMatchReasons(resumeText, job, ai, 0.75);
}

// One-Click Apply Helper Functions

function determineApplyMethod(jobUrl: string): 'linkedin_easy' | 'indeed_api' | 'company_direct' | 'manual' {
  if (jobUrl.includes('linkedin.com')) {
    return 'linkedin_easy';
  } else if (jobUrl.includes('indeed.com')) {
    return 'indeed_api';
  } else if (jobUrl.includes('greenhouse.io') || jobUrl.includes('lever.co') || jobUrl.includes('workday.com')) {
    return 'company_direct';
  }
  return 'manual';
}

async function applyViaLinkedIn(job: JobListing, applicationData: ApplicationData): Promise<boolean> {
  try {
    // Simulate LinkedIn Easy Apply API integration
    console.log('Applying via LinkedIn Easy Apply:', job.title);
    
    // In real implementation, this would:
    // 1. Use LinkedIn API with OAuth credentials
    // 2. Submit application with mapped resume data
    // 3. Handle LinkedIn's specific form fields
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 85% success rate (accounts for CAPTCHA, form variations)
    const success = Math.random() > 0.15;
    
    if (!success) {
      throw new Error('LinkedIn application failed - may require manual completion');
    }
    
    return true;
  } catch (error) {
    console.error('LinkedIn application error:', error);
    throw error;
  }
}

async function applyViaIndeed(job: JobListing, applicationData: ApplicationData): Promise<boolean> {
  try {
    // Simulate Indeed API integration
    console.log('Applying via Indeed API:', job.title);
    
    // In real implementation, this would:
    // 1. Use Indeed Apply API with proper authentication
    // 2. Submit structured application data
    // 3. Handle Indeed's specific requirements
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate 80% success rate
    const success = Math.random() > 0.20;
    
    if (!success) {
      throw new Error('Indeed application failed - form validation error');
    }
    
    return true;
  } catch (error) {
    console.error('Indeed application error:', error);
    throw error;
  }
}

async function applyViaCompanyAPI(job: JobListing, applicationData: ApplicationData): Promise<boolean> {
  try {
    // Simulate company ATS integration (Greenhouse, Lever, Workday)
    console.log('Applying via company ATS:', job.title);
    
    // In real implementation, this would:
    // 1. Detect ATS system (Greenhouse, Lever, Workday, etc.)
    // 2. Use appropriate API or browser automation
    // 3. Map resume data to ATS-specific fields
    // 4. Handle file uploads (resume, cover letter)
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate 70% success rate (higher variation in company systems)
    const success = Math.random() > 0.30;
    
    if (!success) {
      throw new Error('Company ATS application failed - may require manual steps');
    }
    
    return true;
  } catch (error) {
    console.error('Company ATS application error:', error);
    throw error;
  }
}

// Advanced Vector Search Helper Functions

async function analyzeJobCluster(job: JobListing, jobVector: number[]): Promise<any> {
  // Analyze which semantic cluster this job belongs to
  const clusterAnalysis = {
    technical_cluster: calculateClusterScore(jobVector, 0, 64),
    infrastructure_cluster: calculateClusterScore(jobVector, 64, 128),
    applications_cluster: calculateClusterScore(jobVector, 128, 192),
    industry_cluster: calculateClusterScore(jobVector, 192, 256),
    experience_cluster: calculateClusterScore(jobVector, 256, 320),
    emerging_tech_cluster: calculateClusterScore(jobVector, 320, 384),
    tools_cluster: calculateClusterScore(jobVector, 384, 448),
    soft_skills_cluster: calculateClusterScore(jobVector, 448, 512)
  };
  
  const dominantCluster = Object.entries(clusterAnalysis)
    .reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 });
  
  return {
    dominant_cluster: dominantCluster.key,
    cluster_strength: dominantCluster.value,
    cluster_distribution: clusterAnalysis
  };
}

function calculateClusterScore(vector: number[], start: number, end: number): number {
  const clusterSlice = vector.slice(start, Math.min(end, vector.length));
  const magnitude = Math.sqrt(clusterSlice.reduce((sum, val) => sum + val * val, 0));
  return magnitude / Math.sqrt(clusterSlice.length); // Normalized magnitude
}

async function applyAdvancedRanking(
  results: Array<{ job: JobListing; score: number; algorithm: string }>,
  searchHistory: string[],
  queryVector: number[]
): Promise<Array<{ job: JobListing; score: number; algorithm: string }>> {
  
  // Apply learning from search history
  const historyBoost = calculateHistoryBoost(results, searchHistory);
  
  // Apply recency boost for newer jobs
  const recencyBoost = calculateRecencyBoost(results);
  
  // Apply diversity penalty to avoid too similar results
  const diversityAdjustment = calculateDiversityAdjustment(results, queryVector);
  
  return results.map((result, index) => ({
    ...result,
    score: Math.min(1.0, 
      result.score + 
      (historyBoost[index] * 0.05) + 
      (recencyBoost[index] * 0.03) - 
      (diversityAdjustment[index] * 0.02)
    ),
    algorithm: result.algorithm
  })).sort((a, b) => b.score - a.score);
}

function calculateHistoryBoost(
  results: Array<{ job: JobListing; score: number }>,
  searchHistory: string[]
): number[] {
  return results.map(result => {
    let boost = 0;
    const jobText = `${result.job.title} ${result.job.company} ${result.job.skills.join(' ')}`.toLowerCase();
    
    // Check if similar searches were performed before
    searchHistory.forEach(query => {
      const queryWords = query.toLowerCase().split(' ');
      const matchingWords = queryWords.filter(word => jobText.includes(word));
      boost += (matchingWords.length / queryWords.length) * 0.5;
    });
    
    return Math.min(1.0, boost);
  });
}

function calculateRecencyBoost(results: Array<{ job: JobListing; score: number }>): number[] {
  const now = new Date();
  
  return results.map(result => {
    const postedDate = new Date(result.job.posted_date);
    const daysDiff = (now.getTime() - postedDate.getTime()) / (1000 * 3600 * 24);
    
    // Boost recent jobs (within 7 days gets maximum boost)
    if (daysDiff <= 7) return 1.0;
    if (daysDiff <= 14) return 0.7;
    if (daysDiff <= 30) return 0.4;
    return 0.1;
  });
}

function calculateDiversityAdjustment(
  results: Array<{ job: JobListing; score: number }>,
  queryVector: number[]
): number[] {
  // Penalize jobs that are too similar to higher-ranked results
  return results.map((result, index) => {
    let penalty = 0;
    
    for (let i = 0; i < index; i++) {
      const prevJob = results[i].job;
      
      // Check for similar companies
      if (result.job.company === prevJob.company) {
        penalty += 0.3;
      }
      
      // Check for similar titles
      const titleSimilarity = calculateStringSimilarity(
        result.job.title.toLowerCase(),
        prevJob.title.toLowerCase()
      );
      if (titleSimilarity > 0.8) {
        penalty += 0.2;
      }
      
      // Check for similar skill sets
      const skillOverlap = result.job.skills.filter(skill => 
        prevJob.skills.some(prevSkill => 
          calculateStringSimilarity(skill.toLowerCase(), prevSkill.toLowerCase()) > 0.8
        )
      ).length;
      
      const skillSimilarity = skillOverlap / Math.max(result.job.skills.length, prevJob.skills.length);
      if (skillSimilarity > 0.7) {
        penalty += 0.15;
      }
    }
    
    return Math.min(1.0, penalty);
  });
}

async function applyClustering(
  results: Array<{ job: JobListing; score: number; algorithm: string }>,
  maxResults: number
): Promise<Array<{ job: JobListing; score: number; algorithm: string }>> {
  
  if (results.length <= maxResults) return results;
  
  // Group results by company and role type for clustering
  const clusters = new Map<string, Array<{ job: JobListing; score: number; algorithm: string }>>();
  
  results.forEach(result => {
    const clusterKey = `${result.job.company}_${getJobCategory(result.job.title)}`;
    
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    
    clusters.get(clusterKey)!.push(result);
  });
  
  // Select best representative from each cluster
  const clusteredResults: Array<{ job: JobListing; score: number; algorithm: string }> = [];
  const maxPerCluster = Math.ceil(maxResults / clusters.size);
  
  clusters.forEach(cluster => {
    // Sort cluster by score and take top N
    const sortedCluster = cluster.sort((a, b) => b.score - a.score);
    clusteredResults.push(...sortedCluster.slice(0, maxPerCluster));
  });
  
  return clusteredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

function getJobCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('engineer') || lowerTitle.includes('developer')) return 'engineering';
  if (lowerTitle.includes('scientist') || lowerTitle.includes('researcher')) return 'research';
  if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) return 'management';
  if (lowerTitle.includes('analyst') || lowerTitle.includes('consultant')) return 'analytics';
  if (lowerTitle.includes('architect') || lowerTitle.includes('principal')) return 'senior';
  
  return 'general';
}

async function performKMeansClustering(
  vectors: Array<{ job: JobListing; vector: number[] }>,
  k: number
): Promise<Array<{ jobs: JobListing[]; centerDistance: number }>> {
  
  if (vectors.length < k) {
    return vectors.map(v => ({ jobs: [v.job], centerDistance: 0 }));
  }
  
  // Initialize centroids randomly
  let centroids = initializeRandomCentroids(vectors, k);
  let assignments = new Array(vectors.length).fill(0);
  let changed = true;
  let iterations = 0;
  const maxIterations = 20;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    
    // Assign each vector to nearest centroid
    vectors.forEach((vector, index) => {
      let minDistance = Infinity;
      let bestCluster = 0;
      
      centroids.forEach((centroid, clusterIndex) => {
        const distance = calculateEuclideanDistance(vector.vector, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = clusterIndex;
        }
      });
      
      if (assignments[index] !== bestCluster) {
        assignments[index] = bestCluster;
        changed = true;
      }
    });
    
    // Update centroids
    centroids = updateCentroids(vectors, assignments, k);
    iterations++;
  }
  
  // Group results by cluster
  const clusters: Array<{ jobs: JobListing[]; centerDistance: number }> = [];
  
  for (let cluster = 0; cluster < k; cluster++) {
    const clusterJobs: JobListing[] = [];
    let totalDistance = 0;
    let count = 0;
    
    vectors.forEach((vector, index) => {
      if (assignments[index] === cluster) {
        clusterJobs.push(vector.job);
        totalDistance += calculateEuclideanDistance(vector.vector, centroids[cluster]);
        count++;
      }
    });
    
    clusters.push({
      jobs: clusterJobs,
      centerDistance: count > 0 ? totalDistance / count : 0
    });
  }
  
  return clusters.filter(cluster => cluster.jobs.length > 0);
}

function initializeRandomCentroids(
  vectors: Array<{ job: JobListing; vector: number[] }>,
  k: number
): number[][] {
  const centroids: number[][] = [];
  const vectorDim = vectors[0].vector.length;
  
  for (let i = 0; i < k; i++) {
    const centroid = new Array(vectorDim);
    for (let j = 0; j < vectorDim; j++) {
      centroid[j] = Math.random() * 2 - 1; // Random value between -1 and 1
    }
    centroids.push(normalizeVector(centroid));
  }
  
  return centroids;
}

function updateCentroids(
  vectors: Array<{ job: JobListing; vector: number[] }>,
  assignments: number[],
  k: number
): number[][] {
  const centroids: number[][] = [];
  const vectorDim = vectors[0].vector.length;
  
  for (let cluster = 0; cluster < k; cluster++) {
    const centroid = new Array(vectorDim).fill(0);
    let count = 0;
    
    vectors.forEach((vector, index) => {
      if (assignments[index] === cluster) {
        for (let j = 0; j < vectorDim; j++) {
          centroid[j] += vector.vector[j];
        }
        count++;
      }
    });
    
    if (count > 0) {
      for (let j = 0; j < vectorDim; j++) {
        centroid[j] /= count;
      }
    }
    
    centroids.push(normalizeVector(centroid));
  }
  
  return centroids;
}

function calculateEuclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

function generateMatchReasons(job: JobListing, queryVector: number[], score: number): string[] {
  const reasons: string[] = [];
  
  // Analyze high-scoring clusters to generate reasons
  if (score > 0.8) {
    reasons.push('Exceptional technical skills alignment');
  }
  if (score > 0.7) {
    reasons.push('Strong experience level match');
  }
  if (job.ai_specializations.length > 0) {
    reasons.push('Relevant AI specialization');
  }
  if (job.skills.some(skill => skill.toLowerCase().includes('python'))) {
    reasons.push('Python expertise required');
  }
  
  return reasons.slice(0, 4); // Limit to top 4 reasons
}

function generateSemanticExplanation(query: string, job: JobListing, score: number): string {
  const queryWords = query.toLowerCase().split(' ');
  const jobText = `${job.title} ${job.description} ${job.skills.join(' ')}`.toLowerCase();
  
  const matchingConcepts = queryWords.filter(word => jobText.includes(word));
  const matchPercentage = Math.round(score * 100);
  
  return `This role shows ${matchPercentage}% semantic similarity to your query. Key matches include: ${matchingConcepts.slice(0, 3).join(', ')}. The position aligns well with your requirements for ${job.ai_specializations.join(', ') || 'AI/ML roles'}.`;
}

async function updateSearchAnalytics(queryVector: number[], resultCount: number, algorithm: string): Promise<void> {
  // Analytics tracking for search performance
  const analytics = {
    query_embedding_norm: Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0)),
    results_found: resultCount,
    algorithm_used: algorithm,
    timestamp: new Date().toISOString()
  };
  
  // Store analytics (in real implementation, this would save to database)
  console.log('Search Analytics:', analytics);
}

async function updateSemanticSearchHistory(query: string, resultCount: number): Promise<void> {
  // Track semantic search patterns for learning
  const searchEntry = {
    query,
    result_count: resultCount,
    timestamp: new Date().toISOString()
  };
  
  console.log('Semantic Search Entry:', searchEntry);
}