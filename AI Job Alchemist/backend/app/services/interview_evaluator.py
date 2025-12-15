"""AI-powered interview response evaluator."""

import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class ResponseEvaluation:
    """Evaluation result for an interview response."""
    score: float  # 0-100
    feedback: str
    strengths: List[str] = field(default_factory=list)
    improvements: List[str] = field(default_factory=list)
    key_points_covered: List[str] = field(default_factory=list)
    missing_points: List[str] = field(default_factory=list)
    communication_score: float = 0.0
    relevance_score: float = 0.0
    depth_score: float = 0.0


@dataclass
class OverallEvaluation:
    """Overall interview evaluation."""
    overall_score: float
    overall_feedback: str
    category_scores: Dict[str, float] = field(default_factory=dict)
    top_strengths: List[str] = field(default_factory=list)
    areas_to_improve: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    performance_level: str = ""  # Excellent, Good, Average, Needs Improvement


class InterviewEvaluator:
    """
    AI-powered interview response evaluator.
    
    Evaluates responses based on:
    - STAR method usage (Situation, Task, Action, Result)
    - Relevance to question
    - Communication clarity
    - Depth and specificity
    - Key concepts coverage
    """
    
    # STAR method indicators
    STAR_INDICATORS = {
        'situation': ['situation', 'context', 'background', 'scenario', 'when', 'while working'],
        'task': ['task', 'goal', 'objective', 'responsible', 'challenge', 'needed to', 'had to'],
        'action': ['action', 'decided', 'implemented', 'created', 'developed', 'led', 'initiated', 'took'],
        'result': ['result', 'outcome', 'achieved', 'improved', 'increased', 'reduced', 'successfully', 'learned']
    }
    
    # Positive communication indicators
    POSITIVE_INDICATORS = [
        'achieved', 'accomplished', 'improved', 'increased', 'reduced', 'saved',
        'led', 'managed', 'developed', 'created', 'implemented', 'designed',
        'collaborated', 'coordinated', 'delivered', 'exceeded', 'optimized'
    ]
    
    # Technical depth indicators
    TECHNICAL_INDICATORS = [
        'algorithm', 'architecture', 'database', 'api', 'framework', 'library',
        'performance', 'scalability', 'security', 'testing', 'deployment',
        'optimization', 'integration', 'automation', 'monitoring'
    ]
    
    # Question-specific expected topics
    EXPECTED_TOPICS = {
        'teamwork': ['collaboration', 'team', 'together', 'communication', 'support', 'helped'],
        'leadership': ['led', 'managed', 'directed', 'mentored', 'guided', 'decision', 'responsibility'],
        'problem_solving': ['problem', 'solution', 'analyzed', 'identified', 'resolved', 'fixed', 'approach'],
        'time_management': ['deadline', 'prioritized', 'organized', 'schedule', 'time', 'efficient'],
        'conflict': ['disagreement', 'resolved', 'compromise', 'mediated', 'understood', 'perspective'],
        'achievement': ['achieved', 'accomplished', 'proud', 'success', 'impact', 'result'],
        'failure': ['failed', 'mistake', 'learned', 'improved', 'changed', 'growth'],
        'technical': ['implemented', 'designed', 'built', 'developed', 'architecture', 'system'],
        'communication': ['explained', 'presented', 'communicated', 'stakeholder', 'audience'],
    }
    
    def evaluate_response(
        self,
        question: str,
        response: str,
        category: str,
        difficulty: str = "medium"
    ) -> ResponseEvaluation:
        """
        Evaluate a single interview response.
        """
        response_lower = response.lower()
        word_count = len(response.split())
        
        # Calculate component scores
        star_score = self._evaluate_star_method(response_lower)
        relevance_score = self._evaluate_relevance(response_lower, category)
        communication_score = self._evaluate_communication(response, word_count)
        depth_score = self._evaluate_depth(response_lower, word_count, difficulty)
        
        # Calculate overall score (weighted)
        overall_score = (
            star_score * 0.30 +
            relevance_score * 0.25 +
            communication_score * 0.20 +
            depth_score * 0.25
        )
        
        # Adjust for difficulty
        if difficulty == "hard" and overall_score >= 60:
            overall_score = min(overall_score + 5, 100)
        elif difficulty == "easy" and overall_score >= 80:
            overall_score = min(overall_score - 5, 100)
        
        # Generate feedback
        strengths = self._identify_strengths(response_lower, star_score, word_count)
        improvements = self._identify_improvements(response_lower, star_score, word_count, category)
        key_points = self._identify_key_points(response_lower, category)
        missing_points = self._identify_missing_points(response_lower, category)
        
        feedback = self._generate_feedback(overall_score, strengths, improvements)
        
        return ResponseEvaluation(
            score=round(overall_score, 1),
            feedback=feedback,
            strengths=strengths,
            improvements=improvements,
            key_points_covered=key_points,
            missing_points=missing_points,
            communication_score=round(communication_score, 1),
            relevance_score=round(relevance_score, 1),
            depth_score=round(depth_score, 1),
        )
    
    def _evaluate_star_method(self, response: str) -> float:
        """Evaluate STAR method usage."""
        score = 0
        components_found = []
        
        for component, indicators in self.STAR_INDICATORS.items():
            for indicator in indicators:
                if indicator in response:
                    score += 25
                    components_found.append(component)
                    break
        
        return min(score, 100)
    
    def _evaluate_relevance(self, response: str, category: str) -> float:
        """Evaluate response relevance to question category."""
        expected = self.EXPECTED_TOPICS.get(category, [])
        
        if not expected:
            return 70  # Default score if category not found
        
        matches = sum(1 for topic in expected if topic in response)
        relevance_ratio = matches / len(expected)
        
        return min(relevance_ratio * 100 + 30, 100)
    
    def _evaluate_communication(self, response: str, word_count: int) -> float:
        """Evaluate communication quality."""
        score = 50  # Base score
        
        # Length check (ideal: 100-300 words)
        if 100 <= word_count <= 300:
            score += 20
        elif 50 <= word_count < 100 or 300 < word_count <= 400:
            score += 10
        elif word_count < 50:
            score -= 10
        
        # Sentence structure (check for varied sentence lengths)
        sentences = re.split(r'[.!?]+', response)
        if len(sentences) >= 3:
            score += 10
        
        # Positive language
        positive_count = sum(1 for word in self.POSITIVE_INDICATORS if word in response.lower())
        score += min(positive_count * 3, 15)
        
        # Check for filler words (negative)
        filler_words = ['um', 'uh', 'like', 'basically', 'actually', 'literally']
        filler_count = sum(1 for word in filler_words if word in response.lower())
        score -= filler_count * 2
        
        return max(min(score, 100), 0)
    
    def _evaluate_depth(self, response: str, word_count: int, difficulty: str) -> float:
        """Evaluate response depth and specificity."""
        score = 40  # Base score
        
        # Check for specific numbers/metrics
        numbers = re.findall(r'\d+%|\$\d+|\d+\s*(people|team|months|years|days)', response)
        score += min(len(numbers) * 10, 25)
        
        # Check for technical depth
        tech_count = sum(1 for term in self.TECHNICAL_INDICATORS if term in response)
        score += min(tech_count * 5, 20)
        
        # Check for specific examples
        example_indicators = ['for example', 'specifically', 'in particular', 'such as', 'instance']
        example_count = sum(1 for ind in example_indicators if ind in response)
        score += min(example_count * 5, 15)
        
        # Adjust for difficulty expectations
        if difficulty == "hard":
            # Higher expectations for hard questions
            if word_count < 100:
                score -= 10
            if tech_count < 2:
                score -= 5
        
        return max(min(score, 100), 0)
    
    def _identify_strengths(self, response: str, star_score: float, word_count: int) -> List[str]:
        """Identify response strengths."""
        strengths = []
        
        if star_score >= 75:
            strengths.append("Excellent use of the STAR method to structure your response")
        elif star_score >= 50:
            strengths.append("Good structure with clear situation and actions described")
        
        if 100 <= word_count <= 300:
            strengths.append("Well-balanced response length with appropriate detail")
        
        # Check for quantifiable results
        if re.search(r'\d+%|\$\d+', response):
            strengths.append("Strong use of quantifiable metrics to demonstrate impact")
        
        # Check for action verbs
        action_verbs = ['led', 'managed', 'developed', 'created', 'implemented', 'achieved']
        if sum(1 for verb in action_verbs if verb in response) >= 2:
            strengths.append("Effective use of action verbs to describe your contributions")
        
        # Check for specific examples
        if 'example' in response or 'specifically' in response:
            strengths.append("Good use of specific examples to illustrate points")
        
        return strengths[:4]
    
    def _identify_improvements(
        self, 
        response: str, 
        star_score: float, 
        word_count: int,
        category: str
    ) -> List[str]:
        """Identify areas for improvement."""
        improvements = []
        
        if star_score < 50:
            improvements.append("Structure your response using the STAR method (Situation, Task, Action, Result)")
        
        if word_count < 75:
            improvements.append("Provide more detail and context in your response")
        elif word_count > 400:
            improvements.append("Consider being more concise while keeping key points")
        
        if not re.search(r'\d+%|\$\d+|\d+\s*(people|team)', response):
            improvements.append("Include quantifiable metrics to demonstrate your impact")
        
        # Check for missing STAR components
        missing_star = []
        for component, indicators in self.STAR_INDICATORS.items():
            if not any(ind in response for ind in indicators):
                missing_star.append(component.capitalize())
        
        if missing_star and len(missing_star) <= 2:
            improvements.append(f"Add more detail about the {' and '.join(missing_star)} in your response")
        
        # Category-specific improvements
        expected = self.EXPECTED_TOPICS.get(category, [])
        if expected:
            missing = [t for t in expected if t not in response]
            if len(missing) > len(expected) // 2:
                improvements.append(f"Address the core aspects of {category.replace('_', ' ')} more directly")
        
        return improvements[:4]
    
    def _identify_key_points(self, response: str, category: str) -> List[str]:
        """Identify key points covered in the response."""
        key_points = []
        expected = self.EXPECTED_TOPICS.get(category, [])
        
        for topic in expected:
            if topic in response:
                key_points.append(topic.replace('_', ' ').title())
        
        # Add STAR components found
        for component, indicators in self.STAR_INDICATORS.items():
            if any(ind in response for ind in indicators):
                key_points.append(f"Clear {component}")
        
        return list(set(key_points))[:6]
    
    def _identify_missing_points(self, response: str, category: str) -> List[str]:
        """Identify missing key points."""
        missing = []
        expected = self.EXPECTED_TOPICS.get(category, [])
        
        for topic in expected:
            if topic not in response:
                missing.append(topic.replace('_', ' ').title())
        
        return missing[:4]
    
    def _generate_feedback(
        self, 
        score: float, 
        strengths: List[str], 
        improvements: List[str]
    ) -> str:
        """Generate overall feedback text."""
        if score >= 85:
            opening = "Excellent response!"
        elif score >= 70:
            opening = "Good response with solid content."
        elif score >= 55:
            opening = "Decent response, but there's room for improvement."
        else:
            opening = "This response needs more development."
        
        feedback_parts = [opening]
        
        if strengths:
            feedback_parts.append(f"Strengths: {strengths[0].lower()}.")
        
        if improvements:
            feedback_parts.append(f"To improve: {improvements[0].lower()}.")
        
        return " ".join(feedback_parts)
    
    def evaluate_overall(
        self,
        responses: List[ResponseEvaluation],
        interview_type: str
    ) -> OverallEvaluation:
        """
        Generate overall interview evaluation from all responses.
        """
        if not responses:
            return OverallEvaluation(
                overall_score=0,
                overall_feedback="No responses to evaluate.",
                performance_level="Incomplete"
            )
        
        # Calculate average scores
        avg_score = sum(r.score for r in responses) / len(responses)
        avg_communication = sum(r.communication_score for r in responses) / len(responses)
        avg_relevance = sum(r.relevance_score for r in responses) / len(responses)
        avg_depth = sum(r.depth_score for r in responses) / len(responses)
        
        # Determine performance level
        if avg_score >= 85:
            performance_level = "Excellent"
        elif avg_score >= 70:
            performance_level = "Good"
        elif avg_score >= 55:
            performance_level = "Average"
        else:
            performance_level = "Needs Improvement"
        
        # Aggregate strengths and improvements
        all_strengths = []
        all_improvements = []
        for r in responses:
            all_strengths.extend(r.strengths)
            all_improvements.extend(r.improvements)
        
        # Get most common strengths/improvements
        top_strengths = list(set(all_strengths))[:5]
        areas_to_improve = list(set(all_improvements))[:5]
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            avg_score, avg_communication, avg_depth, interview_type
        )
        
        # Generate overall feedback
        overall_feedback = self._generate_overall_feedback(
            avg_score, performance_level, len(responses), interview_type
        )
        
        return OverallEvaluation(
            overall_score=round(avg_score, 1),
            overall_feedback=overall_feedback,
            category_scores={
                "communication": round(avg_communication, 1),
                "relevance": round(avg_relevance, 1),
                "depth": round(avg_depth, 1),
            },
            top_strengths=top_strengths,
            areas_to_improve=areas_to_improve,
            recommendations=recommendations,
            performance_level=performance_level,
        )
    
    def _generate_recommendations(
        self,
        avg_score: float,
        avg_communication: float,
        avg_depth: float,
        interview_type: str
    ) -> List[str]:
        """Generate personalized recommendations."""
        recommendations = []
        
        if avg_score < 70:
            recommendations.append("Practice more mock interviews to build confidence and improve response quality")
        
        if avg_communication < 65:
            recommendations.append("Focus on clear, structured communication using the STAR method")
        
        if avg_depth < 65:
            recommendations.append("Prepare specific examples with quantifiable results for common questions")
        
        if interview_type == "technical":
            recommendations.append("Review technical concepts and practice explaining them clearly")
        elif interview_type == "behavioral":
            recommendations.append("Prepare 5-7 strong stories that demonstrate different competencies")
        
        if avg_score >= 80:
            recommendations.append("You're well-prepared! Focus on refining your delivery and confidence")
        
        return recommendations[:4]
    
    def _generate_overall_feedback(
        self,
        avg_score: float,
        performance_level: str,
        num_questions: int,
        interview_type: str
    ) -> str:
        """Generate overall feedback summary."""
        feedback_templates = {
            "Excellent": f"Outstanding performance on this {interview_type} interview! You demonstrated strong communication skills, provided detailed examples, and structured your responses effectively. You're well-prepared for real interviews.",
            "Good": f"Good performance on this {interview_type} interview. You showed solid understanding and provided relevant examples. With some refinement in structure and specificity, you'll be even more impressive.",
            "Average": f"Decent performance on this {interview_type} interview. You covered the basics but could benefit from more specific examples and better use of the STAR method. Keep practicing!",
            "Needs Improvement": f"This {interview_type} interview highlighted some areas for growth. Focus on preparing specific examples, structuring responses with STAR, and practicing your delivery. You'll improve with practice!",
        }
        
        return feedback_templates.get(performance_level, "Interview completed.")
