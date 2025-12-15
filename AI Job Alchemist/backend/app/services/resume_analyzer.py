"""AI-powered resume analysis service."""

import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

from app.services.document_parser import ParsedResume


@dataclass
class ATSAnalysis:
    """ATS (Applicant Tracking System) analysis results."""
    overall_score: float
    format_score: float
    keyword_score: float
    experience_score: float
    education_score: float
    
    keyword_matches: List[str] = field(default_factory=list)
    missing_keywords: List[str] = field(default_factory=list)
    
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    
    section_analysis: Dict[str, Any] = field(default_factory=dict)


@dataclass
class JobMatchAnalysis:
    """Job-specific match analysis."""
    match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    experience_match: str
    recommendations: List[str]


class ResumeAnalyzer:
    """
    AI-powered resume analyzer for ATS optimization and job matching.
    
    Provides comprehensive analysis including:
    - ATS compatibility scoring
    - Keyword optimization
    - Format analysis
    - Job-specific matching
    """
    
    # Industry-standard ATS keywords by category
    ATS_KEYWORDS = {
        'ai_ml': [
            'machine learning', 'deep learning', 'neural networks', 'nlp',
            'computer vision', 'tensorflow', 'pytorch', 'scikit-learn',
            'data science', 'ai', 'artificial intelligence', 'llm',
            'transformers', 'bert', 'gpt', 'langchain', 'rag'
        ],
        'cloud': [
            'aws', 'azure', 'gcp', 'cloud', 'ec2', 's3', 'lambda',
            'kubernetes', 'docker', 'terraform', 'serverless', 'microservices'
        ],
        'programming': [
            'python', 'javascript', 'java', 'c++', 'go', 'rust',
            'typescript', 'sql', 'api', 'rest', 'graphql'
        ],
        'soft_skills': [
            'leadership', 'communication', 'teamwork', 'problem-solving',
            'analytical', 'project management', 'agile', 'scrum', 'collaboration'
        ],
        'data': [
            'sql', 'nosql', 'mongodb', 'postgresql', 'data analysis',
            'etl', 'data pipeline', 'spark', 'hadoop', 'kafka'
        ],
        'devops': [
            'ci/cd', 'jenkins', 'github actions', 'devops', 'automation',
            'monitoring', 'logging', 'infrastructure as code'
        ]
    }
    
    # Action verbs that ATS systems look for
    ACTION_VERBS = [
        'achieved', 'improved', 'developed', 'created', 'implemented',
        'designed', 'led', 'managed', 'increased', 'reduced', 'optimized',
        'built', 'launched', 'delivered', 'established', 'streamlined',
        'automated', 'architected', 'engineered', 'spearheaded', 'transformed'
    ]
    
    def analyze_ats(
        self, 
        parsed_resume: ParsedResume,
        target_keywords: Optional[List[str]] = None
    ) -> ATSAnalysis:
        """
        Perform comprehensive ATS analysis on a parsed resume.
        """
        text_lower = parsed_resume.raw_text.lower()
        
        # Calculate individual scores
        format_score = self._analyze_format(parsed_resume)
        keyword_score, matches, missing = self._analyze_keywords(text_lower, target_keywords)
        experience_score = self._analyze_experience(parsed_resume)
        education_score = self._analyze_education(parsed_resume)
        
        # Calculate overall score (weighted average)
        overall_score = (
            format_score * 0.2 +
            keyword_score * 0.35 +
            experience_score * 0.30 +
            education_score * 0.15
        )
        
        # Generate insights
        strengths = self._identify_strengths(parsed_resume, matches)
        weaknesses = self._identify_weaknesses(parsed_resume, missing)
        suggestions = self._generate_suggestions(parsed_resume, missing, format_score)
        
        # Section-by-section analysis
        section_analysis = self._analyze_sections(parsed_resume)
        
        return ATSAnalysis(
            overall_score=round(overall_score, 1),
            format_score=round(format_score, 1),
            keyword_score=round(keyword_score, 1),
            experience_score=round(experience_score, 1),
            education_score=round(education_score, 1),
            keyword_matches=matches,
            missing_keywords=missing[:15],
            strengths=strengths,
            weaknesses=weaknesses,
            suggestions=suggestions,
            section_analysis=section_analysis,
        )
    
    def _analyze_format(self, parsed_resume: ParsedResume) -> float:
        """Analyze resume format for ATS compatibility."""
        score = 50.0  # Base score
        
        # Check for essential sections
        essential_sections = ['experience', 'education', 'skills']
        for section in essential_sections:
            if section in parsed_resume.sections:
                score += 10
        
        # Check contact info completeness
        if parsed_resume.contact_info.get('email'):
            score += 5
        if parsed_resume.contact_info.get('phone'):
            score += 5
        if parsed_resume.contact_info.get('linkedin'):
            score += 5
        
        # Check text length (not too short, not too long)
        word_count = len(parsed_resume.raw_text.split())
        if 300 <= word_count <= 1500:
            score += 10
        elif word_count < 200:
            score -= 10
        
        # Check for bullet points (good for ATS)
        bullet_count = len(re.findall(r'[•\-\*]', parsed_resume.raw_text))
        if bullet_count >= 5:
            score += 5
        
        return min(score, 100)
    
    def _analyze_keywords(
        self, 
        text: str, 
        target_keywords: Optional[List[str]] = None
    ) -> tuple:
        """Analyze keyword presence and relevance."""
        matches = []
        missing = []
        
        # Use target keywords if provided, otherwise use default ATS keywords
        if target_keywords:
            keywords_to_check = target_keywords
        else:
            keywords_to_check = []
            for category_keywords in self.ATS_KEYWORDS.values():
                keywords_to_check.extend(category_keywords)
        
        for keyword in keywords_to_check:
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            if re.search(pattern, text):
                matches.append(keyword)
            else:
                missing.append(keyword)
        
        # Check for action verbs
        action_verb_count = sum(1 for verb in self.ACTION_VERBS if verb in text)
        
        # Calculate score
        if keywords_to_check:
            keyword_ratio = len(matches) / len(keywords_to_check)
        else:
            keyword_ratio = 0.5
        
        action_verb_bonus = min(action_verb_count * 2, 20)
        score = (keyword_ratio * 80) + action_verb_bonus
        
        return min(score, 100), matches, missing
    
    def _analyze_experience(self, parsed_resume: ParsedResume) -> float:
        """Analyze work experience section."""
        score = 40.0  # Base score
        
        experience_text = parsed_resume.sections.get('experience', '')
        
        if not experience_text:
            return 30.0
        
        # Check for quantifiable achievements
        numbers = re.findall(r'\d+%|\$\d+|\d+\+', experience_text)
        score += min(len(numbers) * 5, 20)
        
        # Check for action verbs
        text_lower = experience_text.lower()
        action_count = sum(1 for verb in self.ACTION_VERBS if verb in text_lower)
        score += min(action_count * 3, 15)
        
        # Check for multiple entries
        entry_count = len(parsed_resume.experience_entries)
        if entry_count >= 2:
            score += 10
        if entry_count >= 4:
            score += 5
        
        # Check for date ranges
        date_patterns = re.findall(r'\d{4}', experience_text)
        if len(date_patterns) >= 2:
            score += 10
        
        return min(score, 100)
    
    def _analyze_education(self, parsed_resume: ParsedResume) -> float:
        """Analyze education section."""
        score = 50.0  # Base score
        
        education_text = parsed_resume.sections.get('education', '')
        
        if not education_text:
            return 40.0
        
        # Check for degree mentions
        degree_patterns = [
            r"bachelor'?s?|b\.?s\.?|b\.?a\.?",
            r"master'?s?|m\.?s\.?|m\.?a\.?|mba",
            r"ph\.?d\.?|doctorate"
        ]
        
        for pattern in degree_patterns:
            if re.search(pattern, education_text.lower()):
                score += 15
                break
        
        # Check for relevant fields
        relevant_fields = ['computer science', 'engineering', 'data science', 'mathematics', 'physics', 'information technology']
        for field in relevant_fields:
            if field in education_text.lower():
                score += 10
                break
        
        # Check for graduation year
        if re.search(r'\b(19|20)\d{2}\b', education_text):
            score += 10
        
        # Check for GPA (if high)
        gpa_match = re.search(r'gpa[:\s]*([0-9]\.[0-9]+)', education_text.lower())
        if gpa_match:
            gpa = float(gpa_match.group(1))
            if gpa >= 3.5:
                score += 10
        
        return min(score, 100)
    
    def _identify_strengths(self, parsed_resume: ParsedResume, matches: List[str]) -> List[str]:
        """Identify resume strengths."""
        strengths = []
        
        if len(matches) >= 10:
            strengths.append(f"Strong keyword presence with {len(matches)} relevant skills identified")
        
        if len(parsed_resume.skills) >= 8:
            strengths.append(f"Comprehensive skills section with {len(parsed_resume.skills)} technical skills")
        
        if parsed_resume.contact_info.get('linkedin'):
            strengths.append("Professional LinkedIn profile included")
        
        if parsed_resume.contact_info.get('github'):
            strengths.append("GitHub profile demonstrates coding activity")
        
        experience_text = parsed_resume.sections.get('experience', '')
        if re.search(r'\d+%', experience_text):
            strengths.append("Quantifiable achievements with metrics")
        
        if len(parsed_resume.experience_entries) >= 3:
            strengths.append("Solid work history with multiple positions")
        
        if parsed_resume.certifications:
            strengths.append(f"{len(parsed_resume.certifications)} professional certifications")
        
        return strengths[:6]
    
    def _identify_weaknesses(self, parsed_resume: ParsedResume, missing: List[str]) -> List[str]:
        """Identify areas for improvement."""
        weaknesses = []
        
        if len(missing) > 20:
            weaknesses.append("Missing many industry-standard keywords")
        
        if not parsed_resume.contact_info.get('linkedin'):
            weaknesses.append("No LinkedIn profile URL")
        
        if len(parsed_resume.skills) < 5:
            weaknesses.append("Skills section could be more comprehensive")
        
        experience_text = parsed_resume.sections.get('experience', '')
        if not re.search(r'\d+%|\$\d+', experience_text):
            weaknesses.append("Lack of quantifiable achievements and metrics")
        
        word_count = len(parsed_resume.raw_text.split())
        if word_count < 300:
            weaknesses.append("Resume may be too brief - consider adding more detail")
        elif word_count > 1500:
            weaknesses.append("Resume may be too long - consider condensing")
        
        if 'summary' not in parsed_resume.sections:
            weaknesses.append("Missing professional summary section")
        
        return weaknesses[:5]
    
    def _generate_suggestions(
        self, 
        parsed_resume: ParsedResume, 
        missing_keywords: List[str],
        format_score: float
    ) -> List[str]:
        """Generate actionable improvement suggestions."""
        suggestions = []
        
        # Keyword suggestions
        if missing_keywords:
            top_missing = missing_keywords[:5]
            suggestions.append(f"Add these high-impact keywords: {', '.join(top_missing)}")
        
        # Format suggestions
        if format_score < 70:
            suggestions.append("Improve formatting with clear section headers and bullet points")
        
        # Contact info suggestions
        if not parsed_resume.contact_info.get('linkedin'):
            suggestions.append("Add your LinkedIn profile URL to increase credibility")
        
        if not parsed_resume.contact_info.get('github'):
            suggestions.append("Include GitHub profile to showcase your code")
        
        # Experience suggestions
        experience_text = parsed_resume.sections.get('experience', '')
        if not re.search(r'\d+%', experience_text):
            suggestions.append("Add quantifiable achievements (e.g., 'Improved performance by 40%')")
        
        # Action verb suggestions
        text_lower = parsed_resume.raw_text.lower()
        action_count = sum(1 for verb in self.ACTION_VERBS if verb in text_lower)
        if action_count < 5:
            suggestions.append("Use more action verbs like 'achieved', 'implemented', 'optimized'")
        
        # Skills suggestions
        if len(parsed_resume.skills) < 8:
            suggestions.append("Expand your skills section with more technical competencies")
        
        # Summary suggestion
        if 'summary' not in parsed_resume.sections:
            suggestions.append("Add a professional summary at the top highlighting your key qualifications")
        
        return suggestions[:8]
    
    def _analyze_sections(self, parsed_resume: ParsedResume) -> Dict[str, Any]:
        """Provide section-by-section analysis."""
        analysis = {}
        
        for section_name, content in parsed_resume.sections.items():
            word_count = len(content.split())
            analysis[section_name] = {
                'present': True,
                'word_count': word_count,
                'quality': 'good' if word_count > 50 else 'needs_improvement'
            }
        
        # Check for missing essential sections
        essential = ['experience', 'education', 'skills']
        for section in essential:
            if section not in analysis:
                analysis[section] = {
                    'present': False,
                    'word_count': 0,
                    'quality': 'missing'
                }
        
        return analysis
    
    def analyze_job_match(
        self,
        parsed_resume: ParsedResume,
        job_title: str,
        job_description: str,
        required_skills: List[str]
    ) -> JobMatchAnalysis:
        """Analyze how well a resume matches a specific job."""
        resume_skills = set(s.lower() for s in parsed_resume.skills)
        required_skills_lower = set(s.lower() for s in required_skills)
        
        # Find matching and missing skills
        matching = list(resume_skills & required_skills_lower)
        missing = list(required_skills_lower - resume_skills)
        
        # Calculate match score
        if required_skills_lower:
            skill_match_ratio = len(matching) / len(required_skills_lower)
        else:
            skill_match_ratio = 0.5
        
        # Check job description keywords in resume
        job_keywords = set(re.findall(r'\b\w+\b', job_description.lower()))
        resume_keywords = set(re.findall(r'\b\w+\b', parsed_resume.raw_text.lower()))
        keyword_overlap = len(job_keywords & resume_keywords) / len(job_keywords) if job_keywords else 0
        
        # Combined score
        match_score = (skill_match_ratio * 60) + (keyword_overlap * 40)
        
        # Experience match assessment
        if match_score >= 80:
            experience_match = "Excellent match - your experience aligns well with this role"
        elif match_score >= 60:
            experience_match = "Good match - you have most required qualifications"
        elif match_score >= 40:
            experience_match = "Partial match - consider highlighting transferable skills"
        else:
            experience_match = "Limited match - this role may require additional skills"
        
        # Generate recommendations
        recommendations = []
        if missing:
            recommendations.append(f"Consider gaining experience in: {', '.join(missing[:3])}")
        if match_score < 70:
            recommendations.append("Tailor your resume to highlight relevant experience for this role")
        if skill_match_ratio < 0.5:
            recommendations.append("Focus on acquiring the missing technical skills")
        
        return JobMatchAnalysis(
            match_score=round(match_score, 1),
            matching_skills=[s.title() for s in matching],
            missing_skills=[s.title() for s in missing],
            experience_match=experience_match,
            recommendations=recommendations,
        )
