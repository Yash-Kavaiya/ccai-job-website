import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  QueryConstraint 
} from 'firebase/firestore';

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  job_type: string;
  skills_required: string[];
  experience_level: string;
  source: string;
  source_url: string;
  company_logo_url: string;
  posted_at: any;
  expires_at?: any;
  is_active: boolean;
  embedding_id?: string;
}

export interface JobFilters {
  location?: string;
  job_type?: string;
  experience_level?: string;
  company?: string;
  skills?: string[];
}

class JobService {
  private readonly COLLECTION_NAME = 'jobs';

  /**
   * Fetch all active jobs from Firestore
   */
  async getAllJobs(limitCount: number = 100, offset: number = 0): Promise<Job[]> {
    try {
      const jobsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [
        where('is_active', '==', true),
        orderBy('posted_at', 'desc'),
        limit(limitCount)
      ];

      const q = query(jobsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error('Failed to fetch jobs from database');
    }
  }

  /**
   * Fetch jobs with filters
   */
  async getJobsWithFilters(filters: JobFilters, limitCount: number = 100): Promise<Job[]> {
    try {
      const jobsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [
        where('is_active', '==', true)
      ];

      // Add filters
      if (filters.location) {
        constraints.push(where('location', '==', filters.location));
      }
      if (filters.job_type) {
        constraints.push(where('job_type', '==', filters.job_type));
      }
      if (filters.experience_level) {
        constraints.push(where('experience_level', '==', filters.experience_level));
      }
      if (filters.company) {
        constraints.push(where('company', '==', filters.company));
      }

      constraints.push(orderBy('posted_at', 'desc'));
      constraints.push(limit(limitCount));

      const q = query(jobsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      let jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));

      // Filter by skills if provided (array-contains-any limitation workaround)
      if (filters.skills && filters.skills.length > 0) {
        jobs = jobs.filter(job => 
          filters.skills!.some(skill => 
            job.skills_required.some(jobSkill => 
              jobSkill.toLowerCase().includes(skill.toLowerCase())
            )
          )
        );
      }

      return jobs;
    } catch (error) {
      console.error('Error fetching filtered jobs:', error);
      throw new Error('Failed to fetch filtered jobs');
    }
  }

  /**
   * Get a single job by ID
   */
  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const jobRef = doc(db, this.COLLECTION_NAME, jobId);
      const jobDoc = await getDoc(jobRef);

      if (jobDoc.exists()) {
        return {
          id: jobDoc.id,
          ...jobDoc.data()
        } as Job;
      }

      return null;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw new Error('Failed to fetch job');
    }
  }

  /**
   * Get jobs by company
   */
  async getJobsByCompany(company: string, limitCount: number = 20): Promise<Job[]> {
    try {
      const jobsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        jobsRef,
        where('company', '==', company),
        where('is_active', '==', true),
        orderBy('posted_at', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
    } catch (error) {
      console.error('Error fetching jobs by company:', error);
      throw new Error('Failed to fetch company jobs');
    }
  }

  /**
   * Search jobs by text (basic search in title, company, description)
   */
  async searchJobs(searchText: string, limitCount: number = 50): Promise<Job[]> {
    try {
      // Fetch all active jobs and filter client-side
      // Note: For production, consider using Algolia or similar for full-text search
      const jobs = await this.getAllJobs(limitCount);
      
      const searchLower = searchText.toLowerCase();
      return jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills_required.some(skill => skill.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  /**
   * Get recent jobs (last 30 days)
   */
  async getRecentJobs(limitCount: number = 50): Promise<Job[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const jobsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        jobsRef,
        where('is_active', '==', true),
        where('posted_at', '>=', thirtyDaysAgo),
        orderBy('posted_at', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Job));
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      // Fallback to all jobs if date filtering fails
      return this.getAllJobs(limitCount);
    }
  }
}

export const jobService = new JobService();
