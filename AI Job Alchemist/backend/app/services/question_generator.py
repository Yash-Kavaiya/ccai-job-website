"""Interview question generator with job-specific and skill-based questions."""

import random
import uuid
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class GeneratedQuestion:
    """Generated interview question."""
    id: str
    question: str
    category: str
    difficulty: str
    expected_topics: List[str]
    sample_answer: str
    tips: List[str]


class QuestionGenerator:
    """
    Interview question generator supporting multiple interview types
    and job-specific customization.
    """
    
    # Comprehensive question bank by category
    QUESTION_BANK = {
        "behavioral": {
            "teamwork": [
                {
                    "question": "Tell me about a time you had to work with a difficult team member. How did you handle it?",
                    "difficulty": "medium",
                    "expected_topics": ["conflict resolution", "communication", "collaboration", "outcome"],
                    "sample_answer": "In my previous role, I worked with a colleague who often missed deadlines. I scheduled a private conversation to understand their challenges, discovered they were overwhelmed with tasks, and proposed a workload redistribution to our manager. This improved team dynamics and project delivery.",
                    "tips": ["Focus on your actions, not blame", "Show empathy and problem-solving", "Highlight positive outcome"]
                },
                {
                    "question": "Describe a successful team project you contributed to. What was your role?",
                    "difficulty": "easy",
                    "expected_topics": ["collaboration", "contribution", "team dynamics", "success metrics"],
                    "sample_answer": "I led the frontend development for our company's new customer portal. I coordinated with 3 backend developers, conducted code reviews, and implemented the React components. We delivered 2 weeks early and reduced customer support tickets by 30%.",
                    "tips": ["Quantify your contribution", "Mention specific responsibilities", "Share measurable results"]
                },
                {
                    "question": "How do you handle disagreements with team members about technical decisions?",
                    "difficulty": "medium",
                    "expected_topics": ["communication", "data-driven", "compromise", "respect"],
                    "sample_answer": "I believe in data-driven discussions. When disagreeing about architecture choices, I present benchmarks and research. Recently, I disagreed about using microservices vs monolith. I created a comparison document with pros/cons, and we reached a hybrid solution that satisfied both concerns.",
                    "tips": ["Show you value others' opinions", "Demonstrate logical approach", "Focus on best outcome for project"]
                },
            ],
            "leadership": [
                {
                    "question": "Tell me about a time you took initiative without being asked.",
                    "difficulty": "medium",
                    "expected_topics": ["proactivity", "impact", "ownership", "results"],
                    "sample_answer": "I noticed our deployment process took 4 hours manually. Without being asked, I spent weekends building a CI/CD pipeline with GitHub Actions. After presenting it to my manager, we adopted it company-wide, reducing deployment time to 15 minutes.",
                    "tips": ["Show self-motivation", "Highlight business impact", "Demonstrate follow-through"]
                },
                {
                    "question": "Describe a situation where you had to lead a team through a challenging project.",
                    "difficulty": "hard",
                    "expected_topics": ["leadership", "challenge", "strategy", "team motivation", "outcome"],
                    "sample_answer": "I led a team of 5 to migrate our legacy system to cloud within 3 months. I created a detailed roadmap, held daily standups, and personally mentored junior developers. Despite initial resistance, we completed on time with zero downtime.",
                    "tips": ["Show leadership style", "Address challenges faced", "Highlight team development"]
                },
                {
                    "question": "How do you motivate team members who are struggling?",
                    "difficulty": "medium",
                    "expected_topics": ["empathy", "support", "mentoring", "communication"],
                    "sample_answer": "I first have a private conversation to understand their challenges. For a struggling junior developer, I discovered they felt overwhelmed. I paired them with a senior mentor, broke tasks into smaller pieces, and celebrated small wins. Their confidence and productivity improved significantly.",
                    "tips": ["Show empathy first", "Provide concrete support", "Track improvement"]
                },
            ],
            "problem_solving": [
                {
                    "question": "Describe a complex problem you solved at work. What was your approach?",
                    "difficulty": "hard",
                    "expected_topics": ["analysis", "methodology", "solution", "impact"],
                    "sample_answer": "Our API response times degraded to 5 seconds. I used profiling tools to identify N+1 query issues, implemented database indexing, added Redis caching, and optimized ORM queries. Response times dropped to 200ms, improving user satisfaction scores by 40%.",
                    "tips": ["Walk through your methodology", "Show technical depth", "Quantify the improvement"]
                },
                {
                    "question": "Tell me about a time you had to make a decision with incomplete information.",
                    "difficulty": "hard",
                    "expected_topics": ["decision-making", "risk assessment", "adaptability", "outcome"],
                    "sample_answer": "During a production outage, I had to decide between rolling back or pushing a hotfix with limited debugging time. I assessed the risk, chose the hotfix based on log patterns, and prepared a rollback plan. The fix worked, and I later implemented better monitoring to prevent similar issues.",
                    "tips": ["Show risk assessment", "Explain your reasoning", "Mention contingency planning"]
                },
            ],
            "achievement": [
                {
                    "question": "What's your proudest professional achievement?",
                    "difficulty": "easy",
                    "expected_topics": ["accomplishment", "impact", "skills demonstrated", "recognition"],
                    "sample_answer": "Building an ML-powered recommendation engine that increased user engagement by 45%. I led the project from research to production, coordinating with data scientists and backend engineers. It became a key differentiator for our product and I received the company's innovation award.",
                    "tips": ["Choose impactful achievement", "Show your specific contribution", "Include metrics"]
                },
                {
                    "question": "Describe a time you exceeded expectations on a project.",
                    "difficulty": "medium",
                    "expected_topics": ["initiative", "quality", "going above", "recognition"],
                    "sample_answer": "Tasked with building a basic admin dashboard, I noticed inefficiencies in our support workflow. I added real-time analytics, automated reporting, and a ticket prioritization system. This reduced support response time by 60% and was adopted by other departments.",
                    "tips": ["Show initiative beyond requirements", "Highlight additional value", "Mention recognition received"]
                },
            ],
            "failure": [
                {
                    "question": "Tell me about a time you failed. What did you learn?",
                    "difficulty": "hard",
                    "expected_topics": ["honesty", "accountability", "learning", "improvement"],
                    "sample_answer": "I once deployed code without proper testing, causing a 2-hour outage. I took full responsibility, led the incident response, and afterward implemented mandatory code reviews and staging environment testing. This failure taught me the importance of process over speed.",
                    "tips": ["Be honest about the failure", "Take accountability", "Focus on lessons learned"]
                },
                {
                    "question": "Describe a project that didn't go as planned. How did you handle it?",
                    "difficulty": "medium",
                    "expected_topics": ["adaptability", "problem-solving", "communication", "recovery"],
                    "sample_answer": "A feature I estimated at 2 weeks took 6 weeks due to unforeseen API limitations. I communicated delays early, proposed alternative solutions, and worked extra hours to minimize impact. I now include buffer time and technical spikes in my estimates.",
                    "tips": ["Show transparency", "Highlight recovery actions", "Share process improvements"]
                },
            ],
        },
        "technical": {
            "system_design": [
                {
                    "question": "How would you design a URL shortening service like bit.ly?",
                    "difficulty": "medium",
                    "expected_topics": ["scalability", "database design", "hashing", "caching", "analytics"],
                    "sample_answer": "I'd use a base62 encoding for short URLs, store mappings in a distributed database like Cassandra for scalability, implement Redis caching for popular URLs, and use a load balancer for traffic distribution. For analytics, I'd use Kafka for event streaming.",
                    "tips": ["Start with requirements", "Discuss trade-offs", "Consider scale"]
                },
                {
                    "question": "Design a real-time chat application architecture.",
                    "difficulty": "hard",
                    "expected_topics": ["websockets", "message queue", "database", "scalability", "presence"],
                    "sample_answer": "I'd use WebSockets for real-time communication, Redis Pub/Sub for message distribution across servers, MongoDB for message persistence, and implement presence tracking with heartbeats. For scale, I'd use horizontal scaling with sticky sessions.",
                    "tips": ["Address real-time requirements", "Consider message ordering", "Plan for offline handling"]
                },
            ],
            "coding": [
                {
                    "question": "Explain how you would optimize a slow database query.",
                    "difficulty": "medium",
                    "expected_topics": ["indexing", "query analysis", "caching", "denormalization"],
                    "sample_answer": "First, I'd analyze the query execution plan using EXPLAIN. Common optimizations include adding appropriate indexes, avoiding SELECT *, using query caching, denormalizing for read-heavy operations, and implementing pagination for large result sets.",
                    "tips": ["Show systematic approach", "Mention specific techniques", "Consider trade-offs"]
                },
                {
                    "question": "What are the SOLID principles and why are they important?",
                    "difficulty": "medium",
                    "expected_topics": ["single responsibility", "open-closed", "liskov", "interface segregation", "dependency inversion"],
                    "sample_answer": "SOLID principles guide maintainable code: Single Responsibility (one reason to change), Open-Closed (extend without modifying), Liskov Substitution (subtypes replaceable), Interface Segregation (specific interfaces), Dependency Inversion (depend on abstractions). They reduce coupling and improve testability.",
                    "tips": ["Explain each principle", "Give practical examples", "Discuss benefits"]
                },
            ],
            "api_design": [
                {
                    "question": "How would you design a RESTful API for a job board application?",
                    "difficulty": "medium",
                    "expected_topics": ["REST principles", "endpoints", "authentication", "pagination", "versioning"],
                    "sample_answer": "I'd design resources like /jobs, /applications, /users with standard HTTP methods. Include JWT authentication, cursor-based pagination, API versioning in URL (/v1/), rate limiting, and comprehensive error responses with proper HTTP status codes.",
                    "tips": ["Follow REST conventions", "Consider security", "Plan for versioning"]
                },
            ],
        },
        "situational": {
            "pressure": [
                {
                    "question": "How do you handle tight deadlines and pressure?",
                    "difficulty": "medium",
                    "expected_topics": ["prioritization", "communication", "stress management", "delivery"],
                    "sample_answer": "I prioritize tasks by impact, communicate proactively about constraints, and focus on delivering MVP first. During a critical launch, I created a priority matrix, delegated effectively, and delivered core features on time while scheduling nice-to-haves for the next sprint.",
                    "tips": ["Show concrete strategies", "Give specific example", "Highlight successful delivery"]
                },
            ],
            "conflict": [
                {
                    "question": "How would you handle a situation where you disagree with your manager's decision?",
                    "difficulty": "hard",
                    "expected_topics": ["professionalism", "communication", "data-driven", "respect"],
                    "sample_answer": "I'd request a private meeting to understand their perspective, then present my concerns with data and alternative solutions. If they still disagree, I'd commit to their decision while documenting my concerns. I've done this successfully, and sometimes my manager reconsidered after seeing the data.",
                    "tips": ["Show respect for hierarchy", "Be data-driven", "Demonstrate commitment either way"]
                },
            ],
        },
    }
    
    # Job-specific question templates
    JOB_SPECIFIC_TEMPLATES = {
        "ai_engineer": [
            "Describe your experience with large language models and how you've implemented them in production.",
            "How do you approach model evaluation and monitoring in production ML systems?",
            "Tell me about a time you had to optimize an ML model for latency or cost.",
        ],
        "frontend": [
            "How do you approach state management in large React applications?",
            "Describe your experience with performance optimization in web applications.",
            "How do you ensure accessibility in your frontend implementations?",
        ],
        "backend": [
            "How do you design APIs for scalability and maintainability?",
            "Describe your experience with microservices architecture.",
            "How do you approach database design for high-traffic applications?",
        ],
        "devops": [
            "Describe your experience implementing CI/CD pipelines.",
            "How do you approach infrastructure as code?",
            "Tell me about a time you handled a production incident.",
        ],
    }
    
    def generate_questions(
        self,
        interview_type: str,
        num_questions: int = 5,
        difficulty: Optional[str] = None,
        categories: Optional[List[str]] = None,
        job_title: Optional[str] = None,
        required_skills: Optional[List[str]] = None
    ) -> List[GeneratedQuestion]:
        """
        Generate interview questions based on parameters.
        
        Args:
            interview_type: behavioral, technical, or situational
            num_questions: Number of questions to generate
            difficulty: easy, medium, hard, or None for mixed
            categories: Specific categories to include
            job_title: Job title for customization
            required_skills: Skills to focus on
        
        Returns:
            List of GeneratedQuestion objects
        """
        questions = []
        
        # Get question pool based on interview type
        type_questions = self.QUESTION_BANK.get(interview_type, self.QUESTION_BANK["behavioral"])
        
        # Filter by categories if specified
        if categories:
            filtered = {k: v for k, v in type_questions.items() if k in categories}
            if filtered:
                type_questions = filtered
        
        # Collect all questions from selected categories
        all_questions = []
        for category, q_list in type_questions.items():
            for q in q_list:
                q_copy = q.copy()
                q_copy["category"] = category
                all_questions.append(q_copy)
        
        # Filter by difficulty if specified
        if difficulty:
            all_questions = [q for q in all_questions if q["difficulty"] == difficulty]
        
        # Shuffle and select
        random.shuffle(all_questions)
        selected = all_questions[:num_questions]
        
        # Add job-specific questions if applicable
        if job_title and len(selected) < num_questions:
            job_questions = self._get_job_specific_questions(job_title, required_skills)
            selected.extend(job_questions[:num_questions - len(selected)])
        
        # Convert to GeneratedQuestion objects
        for q in selected:
            questions.append(GeneratedQuestion(
                id=str(uuid.uuid4()),
                question=q["question"],
                category=q.get("category", "general"),
                difficulty=q.get("difficulty", "medium"),
                expected_topics=q.get("expected_topics", []),
                sample_answer=q.get("sample_answer", ""),
                tips=q.get("tips", []),
            ))
        
        return questions
    
    def _get_job_specific_questions(
        self,
        job_title: str,
        required_skills: Optional[List[str]] = None
    ) -> List[Dict]:
        """Get job-specific questions based on title and skills."""
        questions = []
        job_lower = job_title.lower()
        
        # Match job type
        if any(term in job_lower for term in ['ai', 'ml', 'machine learning', 'data scientist']):
            templates = self.JOB_SPECIFIC_TEMPLATES.get("ai_engineer", [])
        elif any(term in job_lower for term in ['frontend', 'react', 'vue', 'angular', 'ui']):
            templates = self.JOB_SPECIFIC_TEMPLATES.get("frontend", [])
        elif any(term in job_lower for term in ['backend', 'api', 'server', 'python', 'java']):
            templates = self.JOB_SPECIFIC_TEMPLATES.get("backend", [])
        elif any(term in job_lower for term in ['devops', 'sre', 'infrastructure', 'cloud']):
            templates = self.JOB_SPECIFIC_TEMPLATES.get("devops", [])
        else:
            templates = []
        
        for template in templates:
            questions.append({
                "question": template,
                "category": "job_specific",
                "difficulty": "medium",
                "expected_topics": required_skills or [],
                "sample_answer": "",
                "tips": ["Relate to your specific experience", "Use concrete examples", "Show depth of knowledge"],
            })
        
        return questions
    
    def get_follow_up_question(
        self,
        original_question: str,
        response: str,
        category: str
    ) -> Optional[GeneratedQuestion]:
        """Generate a follow-up question based on the response."""
        follow_ups = {
            "teamwork": "Can you elaborate on how you communicated with the team during this situation?",
            "leadership": "What specific feedback did you receive from your team after this experience?",
            "problem_solving": "What alternative solutions did you consider, and why did you choose this approach?",
            "achievement": "How did this achievement impact your career growth or the organization?",
            "failure": "How have you applied these lessons in subsequent projects?",
            "technical": "Can you walk me through the technical implementation in more detail?",
        }
        
        follow_up_text = follow_ups.get(category)
        if not follow_up_text:
            return None
        
        return GeneratedQuestion(
            id=str(uuid.uuid4()),
            question=follow_up_text,
            category=category,
            difficulty="medium",
            expected_topics=[],
            sample_answer="",
            tips=["Build on your previous answer", "Provide additional context"],
        )
