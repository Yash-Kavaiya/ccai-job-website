# Dynamic Jobs Implementation - Quick Start Guide

## ✅ What Was Changed

The candidate job search page now fetches jobs **dynamically from Firebase Firestore** instead of using hardcoded data. When recruiters publish jobs, they automatically appear in the candidate job search.

## 🎯 Key Changes

### 1. New Job Service (`src/services/jobService.ts`)
- Handles all Firebase Firestore operations for jobs
- Methods: `getAllJobs()`, `searchJobs()`, `getJobsWithFilters()`, etc.
- Direct integration with Firebase

### 2. Updated Job Store (`src/store/job-matching-store.ts`)
- `searchJobs()` - Now fetches from Firebase instead of web scraping
- `aggregateJobs()` - Loads all jobs from Firebase
- Removed hardcoded mock data

### 3. Job Search Page (`src/pages/JobSearchPage.tsx`)
- Already configured to use the store
- Automatically loads jobs on page mount
- No changes needed - works out of the box!

## 🚀 How to Use

### For Testing (Add Sample Jobs)

Run the seed script to add 10 sample jobs:

```bash
cd "AI Job Alchemist/backend"
python seed_jobs.py
```

This adds jobs from Google, Microsoft, OpenAI, Amazon, Meta, Netflix, Tesla, Apple, Anthropic, and Hugging Face.

### For Production (Recruiter Posts Jobs)

1. **Recruiter logs in** → Goes to "Post Job" page
2. **Fills job details** → Title, description, salary, skills, etc.
3. **Submits job** → Saved to Firestore `jobs` collection
4. **Job appears instantly** → Candidates see it in `/jobs` page

## 📊 Data Flow

```
Recruiter Dashboard
       ↓
   POST /api/v1/jobs
       ↓
   Firestore (jobs collection)
       ↓
   jobService.getAllJobs()
       ↓
   Job Matching Store
       ↓
   Candidate Job Search Page
```

## 🔍 Features

### Candidate Side
- ✅ View all active jobs from Firebase
- ✅ Search jobs by keywords
- ✅ Filter by location, type, experience
- ✅ Real-time job listings
- ✅ No hardcoded data

### Recruiter Side
- ✅ Post jobs via dashboard
- ✅ Jobs auto-appear in candidate search
- ✅ Manage job listings
- ✅ Track applications

## 📝 Job Data Structure

```typescript
{
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  job_type: string; // 'full_time', 'part_time', 'contract', 'remote'
  skills_required: string[];
  experience_level: string;
  source: string;
  source_url: string;
  company_logo_url: string;
  posted_at: Timestamp;
  is_active: boolean;
}
```

## 🧪 Testing Steps

1. **Seed sample jobs**:
   ```bash
   python backend/seed_jobs.py
   ```

2. **Start frontend**:
   ```bash
   npm run dev
   ```

3. **Open job search page**:
   - Navigate to `http://localhost:5173/jobs`
   - Jobs should load automatically
   - Try searching for "AI Engineer" or "Machine Learning"

4. **Test filters**:
   - Filter by location (e.g., "Remote")
   - Filter by job type (e.g., "Full Time")
   - Filter by experience level

## 🔧 Configuration

### Firebase Setup
Ensure your `.env` file has Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firestore Indexes
Required indexes (defined in `firestore.indexes.json`):
- `is_active` + `posted_at` (descending)
- `company` + `is_active`
- `location` + `is_active` + `posted_at`

## 🐛 Troubleshooting

### No jobs appearing?
1. Check Firestore console - verify jobs exist in `jobs` collection
2. Check browser console for errors
3. Verify Firebase config in `.env`
4. Run seed script: `python backend/seed_jobs.py`

### Jobs not updating?
1. Clear browser cache
2. Check `is_active` field is `true`
3. Verify `posted_at` timestamp exists

### Search not working?
1. Ensure jobs have descriptions
2. Check `skills_required` array is populated
3. Verify search query is not empty

## 📚 Files Modified

- ✅ `src/services/jobService.ts` - NEW
- ✅ `src/store/job-matching-store.ts` - UPDATED
- ✅ `backend/seed_jobs.py` - NEW
- ✅ `JOBS_SETUP.md` - NEW (detailed docs)
- ✅ `DYNAMIC_JOBS_GUIDE.md` - NEW (this file)

## 🎉 Summary

**Before**: Jobs were hardcoded in the frontend
**After**: Jobs are fetched dynamically from Firebase

**Result**: 
- Recruiters can post jobs → Candidates see them immediately
- No more hardcoded data
- Real-time job listings
- Scalable and production-ready

## 📞 Support

If you encounter issues:
1. Check the detailed documentation in `JOBS_SETUP.md`
2. Verify Firebase connection
3. Run the seed script for testing
4. Check browser console for errors
