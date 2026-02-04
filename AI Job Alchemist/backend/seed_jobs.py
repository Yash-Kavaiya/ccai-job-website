"""
Script to seed sample jobs into Firestore for testing.
Run this to populate the database with sample job listings.
"""

import sys
import os
from datetime import datetime, timedelta
import uuid

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.dependencies import get_firestore_client
from app.models.job import Job, JobType, JobSource

def seed_jobs():
    """Seed sample jobs into Firestore."""
    db = get_firestore_client()
    jobs_collection = db.collection('jobs')
    
    sample_jobs = [
        {
            "title": "Senior AI Engineer",
            "company": "Google",
            "description": "Join our AI team to build cutting-edge machine learning solutions. Work with Google CCAI and develop conversational AI systems.",
            "location": "Mountain View, CA",
            "salary_min": 150000,
            "salary_max": 250000,
            "job_type": "full_time",
            "skills_required": ["Python", "TensorFlow", "Machine Learning", "NLP", "Google CCAI"],
            "experience_level": "Senior",
            "source": "manual",
            "source_url": "https://careers.google.com/jobs/ai-engineer",
            "company_logo_url": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
        },
        {
            "title": "Machine Learning Engineer",
            "company": "Microsoft",
            "description": "Build intelligent applications using Microsoft Copilot and Azure AI services. Work on cutting-edge ML models.",
            "location": "Redmond, WA",
            "salary_min": 140000,
            "salary_max": 220000,
            "job_type": "full_time",
            "skills_required": ["Python", "Azure", "Machine Learning", "Microsoft Copilot", "PyTorch"],
            "experience_level": "Mid-Senior",
            "source": "manual",
            "source_url": "https://careers.microsoft.com/ml-engineer",
            "company_logo_url": "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b",
        },
        {
            "title": "AI Research Scientist",
            "company": "OpenAI",
            "description": "Conduct research in large language models and contribute to GPT development. Push the boundaries of AI.",
            "location": "San Francisco, CA",
            "salary_min": 180000,
            "salary_max": 300000,
            "job_type": "full_time",
            "skills_required": ["Python", "Deep Learning", "NLP", "Research", "GPT", "Transformers"],
            "experience_level": "Senior",
            "source": "manual",
            "source_url": "https://openai.com/careers/ai-research-scientist",
            "company_logo_url": "https://openai.com/favicon.ico",
        },
        {
            "title": "Conversational AI Developer",
            "company": "Amazon",
            "description": "Develop conversational AI solutions using Amazon Lex. Build voice and chat interfaces for AWS customers.",
            "location": "Seattle, WA",
            "salary_min": 130000,
            "salary_max": 200000,
            "job_type": "full_time",
            "skills_required": ["Python", "AWS", "Amazon Lex", "NLP", "Conversational AI"],
            "experience_level": "Mid-Level",
            "source": "manual",
            "source_url": "https://amazon.jobs/en/jobs/conversational-ai",
            "company_logo_url": "https://m.media-amazon.com/images/G/01/gc/designs/livepreview/amazon_dkblue_noto_email_v2016_us-main._CB468775337_.png",
        },
        {
            "title": "Data Scientist - AI/ML",
            "company": "Meta",
            "description": "Apply machine learning to solve complex problems at scale. Work on recommendation systems and AI products.",
            "location": "Menlo Park, CA",
            "salary_min": 145000,
            "salary_max": 230000,
            "job_type": "full_time",
            "skills_required": ["Python", "Machine Learning", "Statistics", "Deep Learning", "PyTorch"],
            "experience_level": "Mid-Senior",
            "source": "manual",
            "source_url": "https://www.metacareers.com/jobs/data-scientist",
            "company_logo_url": "https://about.meta.com/media/facebooklogo.png",
        },
        {
            "title": "MLOps Engineer",
            "company": "Netflix",
            "description": "Build and maintain ML infrastructure. Deploy and monitor machine learning models at scale.",
            "location": "Los Gatos, CA",
            "salary_min": 150000,
            "salary_max": 240000,
            "job_type": "full_time",
            "skills_required": ["Python", "Kubernetes", "Docker", "MLOps", "CI/CD", "AWS"],
            "experience_level": "Senior",
            "source": "manual",
            "source_url": "https://jobs.netflix.com/jobs/mlops-engineer",
            "company_logo_url": "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png",
        },
        {
            "title": "Computer Vision Engineer",
            "company": "Tesla",
            "description": "Develop computer vision algorithms for autonomous driving. Work on cutting-edge perception systems.",
            "location": "Palo Alto, CA",
            "salary_min": 160000,
            "salary_max": 260000,
            "job_type": "full_time",
            "skills_required": ["Python", "Computer Vision", "Deep Learning", "PyTorch", "Autonomous Driving"],
            "experience_level": "Senior",
            "source": "manual",
            "source_url": "https://www.tesla.com/careers/computer-vision",
            "company_logo_url": "https://www.tesla.com/themes/custom/tesla_frontend/assets/favicons/favicon-196x196.png",
        },
        {
            "title": "NLP Engineer",
            "company": "Apple",
            "description": "Build natural language processing systems for Siri and other Apple products. Work on speech recognition and understanding.",
            "location": "Cupertino, CA",
            "salary_min": 155000,
            "salary_max": 245000,
            "job_type": "full_time",
            "skills_required": ["Python", "NLP", "Machine Learning", "Speech Recognition", "Deep Learning"],
            "experience_level": "Mid-Senior",
            "source": "manual",
            "source_url": "https://www.apple.com/careers/nlp-engineer",
            "company_logo_url": "https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png",
        },
        {
            "title": "AI Product Manager",
            "company": "Anthropic",
            "description": "Lead AI product development for Claude. Bridge technical and business teams to deliver AI solutions.",
            "location": "San Francisco, CA",
            "salary_min": 170000,
            "salary_max": 280000,
            "job_type": "full_time",
            "skills_required": ["Product Management", "AI/ML", "Strategy", "Communication", "Claude"],
            "experience_level": "Senior",
            "source": "manual",
            "source_url": "https://www.anthropic.com/careers/ai-product-manager",
            "company_logo_url": "https://www.anthropic.com/favicon.ico",
        },
        {
            "title": "Remote AI Engineer",
            "company": "Hugging Face",
            "description": "Work remotely on open-source AI tools and models. Contribute to transformers library and model hub.",
            "location": "Remote",
            "salary_min": 120000,
            "salary_max": 200000,
            "job_type": "remote",
            "skills_required": ["Python", "Transformers", "NLP", "Open Source", "PyTorch"],
            "experience_level": "Mid-Level",
            "source": "manual",
            "source_url": "https://huggingface.co/jobs/ai-engineer",
            "company_logo_url": "https://huggingface.co/front/assets/huggingface_logo.svg",
        },
    ]
    
    print("Seeding jobs into Firestore...")
    
    for job_data in sample_jobs:
        job_id = str(uuid.uuid4())
        
        # Create job document
        job_doc = {
            "id": job_id,
            "title": job_data["title"],
            "company": job_data["company"],
            "description": job_data["description"],
            "location": job_data["location"],
            "salary_min": job_data["salary_min"],
            "salary_max": job_data["salary_max"],
            "job_type": job_data["job_type"],
            "skills_required": job_data["skills_required"],
            "experience_level": job_data["experience_level"],
            "source": job_data["source"],
            "source_url": job_data["source_url"],
            "company_logo_url": job_data["company_logo_url"],
            "posted_at": datetime.utcnow() - timedelta(days=2),  # Posted 2 days ago
            "expires_at": datetime.utcnow() + timedelta(days=28),  # Expires in 28 days
            "is_active": True,
            "embedding_id": None,
        }
        
        # Add to Firestore
        jobs_collection.document(job_id).set(job_doc)
        print(f"✓ Added: {job_data['title']} at {job_data['company']}")
    
    print(f"\n✅ Successfully seeded {len(sample_jobs)} jobs into Firestore!")
    print("Jobs are now available in the candidate job search page.")

if __name__ == "__main__":
    try:
        seed_jobs()
    except Exception as e:
        print(f"❌ Error seeding jobs: {e}")
        sys.exit(1)
