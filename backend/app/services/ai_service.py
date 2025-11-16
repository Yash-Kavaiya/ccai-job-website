"""
Google Gemini AI service for various AI-powered features.
Handles resume analysis, job matching, chatbot, and more.
"""
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.core.config import settings

# Configure Gemini API
genai.configure(api_key=settings.GOOGLE_API_KEY)

# Safety settings
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


class GeminiAIService:
    """Service for Google Gemini AI operations."""

    def __init__(self):
        """Initialize Gemini models."""
        self.pro_model = genai.GenerativeModel(
            model_name="gemini-1.5-pro-latest",
            safety_settings=SAFETY_SETTINGS
        )
        self.flash_model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            safety_settings=SAFETY_SETTINGS
        )

    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Analyze resume text and extract structured information.

        Args:
            resume_text: Full text extracted from resume

        Returns:
            Dictionary with parsed resume data
        """
        prompt = f"""
        Analyze the following resume and extract structured information in JSON format.

        Extract:
        1. Personal Information (name, email, phone, location)
        2. Professional Summary or Objective
        3. Work Experience (company, title, dates, responsibilities, achievements)
        4. Education (degree, institution, dates, GPA if mentioned)
        5. Skills (technical skills, soft skills, languages, tools, frameworks)
        6. Certifications and Licenses
        7. Projects (if any)
        8. Awards and Achievements

        Resume Text:
        {resume_text}

        Return ONLY valid JSON without any markdown formatting or code blocks.
        Use this structure:
        {{
            "name": "Full Name",
            "email": "email@example.com",
            "phone": "phone number",
            "location": "City, State",
            "summary": "Professional summary...",
            "experience": [
                {{
                    "company": "Company Name",
                    "title": "Job Title",
                    "dates": "Start Date - End Date",
                    "description": "Job description and achievements"
                }}
            ],
            "education": [
                {{
                    "degree": "Degree Name",
                    "institution": "School Name",
                    "dates": "Graduation Date",
                    "gpa": "GPA if mentioned"
                }}
            ],
            "skills": ["skill1", "skill2", "skill3"],
            "certifications": ["cert1", "cert2"],
            "projects": [
                {{
                    "name": "Project Name",
                    "description": "Description",
                    "technologies": ["tech1", "tech2"]
                }}
            ],
            "awards": ["award1", "award2"]
        }}
        """

        try:
            response = self.pro_model.generate_content(prompt)
            result_text = response.text.strip()

            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            parsed_data = json.loads(result_text.strip())
            return parsed_data

        except Exception as e:
            print(f"Error analyzing resume: {e}")
            return {}

    def calculate_ats_score(self, resume_text: str, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate ATS (Applicant Tracking System) score for a resume.

        Args:
            resume_text: Full resume text
            parsed_data: Parsed resume data

        Returns:
            Dictionary with ATS score and analysis
        """
        prompt = f"""
        You are an ATS (Applicant Tracking System) expert. Analyze this resume and provide an ATS compatibility score from 0-100.

        Evaluate based on:
        1. Formatting and Structure (20 points)
           - Clear sections and headings
           - Consistent formatting
           - No complex tables or graphics
           - Standard fonts

        2. Keywords and Skills (30 points)
           - Relevant technical skills
           - Industry keywords
           - Action verbs
           - Measurable achievements

        3. Content Quality (25 points)
           - Clear job titles and dates
           - Quantified accomplishments
           - Relevant experience
           - Education details

        4. Contact Information (10 points)
           - Name, email, phone present
           - LinkedIn/portfolio links
           - Professional email address

        5. Overall Presentation (15 points)
           - Length appropriate (1-2 pages)
           - No spelling/grammar errors
           - Chronological order
           - Recent and relevant

        Resume Data:
        {parsed_data}

        Resume Text:
        {resume_text[:2000]}

        Provide analysis in JSON format:
        {{
            "overall_score": 85,
            "category_scores": {{
                "formatting": 18,
                "keywords": 25,
                "content": 22,
                "contact": 9,
                "presentation": 13
            }},
            "strengths": ["strength 1", "strength 2", "strength 3"],
            "weaknesses": ["weakness 1", "weakness 2"],
            "missing_elements": ["element 1", "element 2"],
            "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
        }}

        Return ONLY valid JSON without markdown formatting.
        """

        try:
            response = self.pro_model.generate_content(prompt)
            result_text = response.text.strip()

            # Clean markdown if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            ats_analysis = json.loads(result_text.strip())
            return ats_analysis

        except Exception as e:
            print(f"Error calculating ATS score: {e}")
            return {
                "overall_score": 0,
                "category_scores": {},
                "strengths": [],
                "weaknesses": [],
                "missing_elements": [],
                "recommendations": []
            }

    def generate_resume_suggestions(self, resume_text: str, parsed_data: Dict[str, Any], ats_analysis: Dict[str, Any]) -> List[str]:
        """
        Generate improvement suggestions for resume.

        Args:
            resume_text: Full resume text
            parsed_data: Parsed resume data
            ats_analysis: ATS score analysis

        Returns:
            List of actionable suggestions
        """
        prompt = f"""
        Based on this resume analysis, provide 5-10 specific, actionable improvement suggestions.

        Resume Data: {parsed_data}
        ATS Analysis: {ats_analysis}

        Focus on:
        - Specific changes to improve ATS score
        - Better keyword usage
        - Quantifying achievements
        - Improving formatting
        - Adding missing critical information

        Return suggestions as a JSON array of strings:
        ["Suggestion 1", "Suggestion 2", "Suggestion 3", ...]

        Each suggestion should be specific and actionable.
        Return ONLY the JSON array without markdown formatting.
        """

        try:
            response = self.flash_model.generate_content(prompt)
            result_text = response.text.strip()

            # Clean markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            suggestions = json.loads(result_text.strip())
            return suggestions if isinstance(suggestions, list) else []

        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return []

    def calculate_job_match_score(self, resume_data: Dict[str, Any], job_description: str, job_requirements: str) -> Dict[str, Any]:
        """
        Calculate how well a resume matches a job posting.

        Args:
            resume_data: Parsed resume data
            job_description: Job description text
            job_requirements: Job requirements text

        Returns:
            Dictionary with match score and analysis
        """
        prompt = f"""
        Analyze how well this candidate's resume matches the job requirements.
        Provide a match score from 0-100 and detailed analysis.

        Resume Skills: {resume_data.get('skills', [])}
        Resume Experience: {resume_data.get('experience', [])}
        Resume Education: {resume_data.get('education', [])}

        Job Description: {job_description}
        Job Requirements: {job_requirements}

        Evaluate:
        1. Skills Match (40 points) - How many required skills does the candidate have?
        2. Experience Match (30 points) - Does experience level and type align?
        3. Education Match (15 points) - Does education meet requirements?
        4. Overall Fit (15 points) - Cultural fit, career trajectory, etc.

        Return JSON:
        {{
            "match_score": 78,
            "category_scores": {{
                "skills": 32,
                "experience": 24,
                "education": 12,
                "overall_fit": 10
            }},
            "matching_skills": ["skill1", "skill2"],
            "missing_skills": ["skill3", "skill4"],
            "matching_experience": ["experience point 1", "experience point 2"],
            "concerns": ["concern 1", "concern 2"],
            "strengths": ["strength 1", "strength 2"],
            "recommendation": "highly_recommended | recommended | maybe | not_recommended",
            "reasoning": "Brief explanation of the match score and recommendation"
        }}

        Return ONLY valid JSON without markdown.
        """

        try:
            response = self.pro_model.generate_content(prompt)
            result_text = response.text.strip()

            # Clean markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            match_analysis = json.loads(result_text.strip())
            return match_analysis

        except Exception as e:
            print(f"Error calculating job match: {e}")
            return {"match_score": 0}

    def chat(self, message: str, conversation_history: List[Dict[str, str]] = None) -> str:
        """
        Chat with AI assistant about career-related topics.

        Args:
            message: User's message
            conversation_history: Previous conversation messages

        Returns:
            AI assistant's response
        """
        system_prompt = """
        You are a helpful AI career assistant for CCAI Jobs platform. You help users with:
        - Resume writing and improvement
        - Job search strategies
        - Interview preparation
        - Career advice and guidance
        - Skill development recommendations
        - AI and technology career paths

        Be professional, encouraging, and provide specific, actionable advice.
        Keep responses concise but helpful (2-4 paragraphs max).
        """

        # Build conversation context
        context = system_prompt + "\n\n"

        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                context += f"{role.title()}: {content}\n"

        context += f"User: {message}\nAssistant:"

        try:
            response = self.flash_model.generate_content(context)
            return response.text.strip()

        except Exception as e:
            print(f"Error in chat: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again."

    def generate_interview_questions(self, job_title: str, job_description: str, interview_type: str = "technical") -> List[Dict[str, str]]:
        """
        Generate interview questions based on job description.

        Args:
            job_title: Job title
            job_description: Job description
            interview_type: Type of interview (technical, behavioral, situational)

        Returns:
            List of interview questions with suggested answers
        """
        prompt = f"""
        Generate 10 {interview_type} interview questions for a {job_title} position.

        Job Description: {job_description}

        For each question, include:
        - The question itself
        - Type (technical, behavioral, situational)
        - Difficulty level (easy, medium, hard)
        - Key points to cover in answer

        Return JSON array:
        [
            {{
                "question": "Interview question text",
                "type": "technical",
                "difficulty": "medium",
                "key_points": ["point 1", "point 2", "point 3"]
            }}
        ]

        Make questions relevant to the job description.
        Return ONLY valid JSON array without markdown.
        """

        try:
            response = self.pro_model.generate_content(prompt)
            result_text = response.text.strip()

            # Clean markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            questions = json.loads(result_text.strip())
            return questions if isinstance(questions, list) else []

        except Exception as e:
            print(f"Error generating interview questions: {e}")
            return []

    def evaluate_interview_answer(self, question: str, answer: str, question_type: str) -> Dict[str, Any]:
        """
        Evaluate an interview answer and provide feedback.

        Args:
            question: Interview question
            answer: User's answer
            question_type: Type of question

        Returns:
            Dictionary with score and feedback
        """
        prompt = f"""
        Evaluate this interview answer on a scale of 0-10.

        Question ({question_type}): {question}
        Answer: {answer}

        Evaluate based on:
        - Completeness (addresses all parts of question)
        - Clarity and structure (STAR method for behavioral)
        - Technical accuracy (for technical questions)
        - Examples and specifics
        - Communication skills

        Return JSON:
        {{
            "score": 8,
            "strengths": ["strength 1", "strength 2"],
            "areas_for_improvement": ["area 1", "area 2"],
            "feedback": "Detailed constructive feedback",
            "suggested_improvements": "How to improve the answer"
        }}

        Return ONLY valid JSON without markdown.
        """

        try:
            response = self.flash_model.generate_content(prompt)
            result_text = response.text.strip()

            # Clean markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            evaluation = json.loads(result_text.strip())
            return evaluation

        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return {"score": 0, "feedback": "Unable to evaluate at this time."}

    def generate_project_ideas(self, user_skills: List[str], experience_level: str, interests: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Generate project ideas based on user's skills and interests.

        Args:
            user_skills: List of user's skills
            experience_level: User's experience level (beginner, intermediate, advanced)
            interests: Optional list of user's interests

        Returns:
            List of project ideas
        """
        interests_text = f"Interests: {', '.join(interests)}" if interests else ""

        prompt = f"""
        Generate 5 project ideas for someone with these skills and experience level.

        Skills: {', '.join(user_skills)}
        Experience Level: {experience_level}
        {interests_text}

        For each project, provide:
        - Project name
        - Description (2-3 sentences)
        - Technologies to use
        - Difficulty level
        - Estimated time to complete
        - Learning outcomes
        - Potential portfolio impact

        Return JSON array:
        [
            {{
                "name": "Project Name",
                "description": "Project description",
                "technologies": ["tech1", "tech2", "tech3"],
                "difficulty": "intermediate",
                "estimated_time": "2-3 weeks",
                "learning_outcomes": ["outcome1", "outcome2"],
                "portfolio_impact": "How this helps your portfolio"
            }}
        ]

        Make projects challenging but achievable for the experience level.
        Return ONLY valid JSON array without markdown.
        """

        try:
            response = self.pro_model.generate_content(prompt)
            result_text = response.text.strip()

            # Clean markdown
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            import json
            projects = json.loads(result_text.strip())
            return projects if isinstance(projects, list) else []

        except Exception as e:
            print(f"Error generating projects: {e}")
            return []


# Create singleton instance
gemini_service = GeminiAIService()
