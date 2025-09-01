// Curated AI interview questions database for different roles and difficulty levels

export interface InterviewQuestion {
  id: string;
  role: string[];
  company?: string[];
  difficulty: 'entry' | 'mid' | 'senior' | 'principal';
  category: 'technical' | 'behavioral' | 'system-design' | 'case-study';
  question: string;
  followups: string[];
  keywords: string[];
  expectedTopics: string[];
}

export const AI_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Google CCAI Questions
  {
    id: 'ccai-01',
    role: ['Google CCAI Developer', 'Conversational AI Developer'],
    company: ['Google'],
    difficulty: 'mid',
    category: 'technical',
    question: 'Explain how Amazon Lex intent fulfillment works and how it differs from Google Dialogflow CX.',
    followups: [
      'How would you handle context switching between intents?',
      'What are the best practices for managing conversation state?'
    ],
    keywords: ['intent', 'fulfillment', 'NLU', 'context', 'conversation state'],
    expectedTopics: ['Natural Language Understanding', 'Intent Recognition', 'Context Management']
  },
  {
    id: 'ccai-02',
    role: ['Google CCAI Developer'],
    company: ['Google'],
    difficulty: 'senior',
    category: 'system-design',
    question: 'Design a multi-channel conversational AI system for customer service that handles voice, chat, and email.',
    followups: [
      'How would you ensure consistent responses across channels?',
      'What metrics would you track for conversation quality?'
    ],
    keywords: ['multi-channel', 'conversation design', 'omnichannel', 'scalability'],
    expectedTopics: ['System Architecture', 'Conversation Design', 'Channel Integration']
  },

  // Microsoft Copilot Questions
  {
    id: 'copilot-01',
    role: ['Microsoft Copilot Developer'],
    company: ['Microsoft'],
    difficulty: 'mid',
    category: 'technical',
    question: 'How would you implement a custom Microsoft 365 Copilot plugin for project management?',
    followups: [
      'What APIs would you use to integrate with Microsoft Graph?',
      'How would you handle user authentication and permissions?'
    ],
    keywords: ['Microsoft Graph', 'plugin development', 'Microsoft 365', 'authentication'],
    expectedTopics: ['Microsoft Graph API', 'Plugin Architecture', 'OAuth Integration']
  },
  {
    id: 'copilot-02',
    role: ['Microsoft Copilot Developer'],
    company: ['Microsoft'],
    difficulty: 'senior',
    category: 'case-study',
    question: 'A company wants to deploy GitHub Copilot enterprise-wide but is concerned about code security. How would you address these concerns?',
    followups: [
      'What governance policies would you recommend?',
      'How would you measure ROI and developer productivity?'
    ],
    keywords: ['code security', 'enterprise deployment', 'governance', 'productivity'],
    expectedTopics: ['Security Best Practices', 'Enterprise Architecture', 'Change Management']
  },

  // Amazon Lex Questions
  {
    id: 'lex-01',
    role: ['Amazon Lex Developer'],
    company: ['Amazon'],
    difficulty: 'mid',
    category: 'technical',
    question: 'Walk me through building a multi-turn conversation in Amazon Lex that handles booking appointments.',
    followups: [
      'How would you handle slot validation and error recovery?',
      'What would you do if the user provides conflicting information?'
    ],
    keywords: ['multi-turn conversation', 'slots', 'validation', 'error handling'],
    expectedTopics: ['Conversation Flow', 'Slot Management', 'Error Recovery']
  },

  // Machine Learning Engineer Questions
  {
    id: 'ml-01',
    role: ['Machine Learning Engineer', 'AI Research Scientist'],
    difficulty: 'mid',
    category: 'technical',
    question: 'Explain the difference between BERT and GPT architectures. When would you choose one over the other?',
    followups: [
      'How would you fine-tune BERT for a domain-specific task?',
      'What are the computational trade-offs between these models?'
    ],
    keywords: ['BERT', 'GPT', 'transformer', 'fine-tuning', 'bidirectional'],
    expectedTopics: ['Transformer Architecture', 'Model Selection', 'Fine-tuning Strategies']
  },
  {
    id: 'ml-02',
    role: ['Machine Learning Engineer'],
    difficulty: 'senior',
    category: 'system-design',
    question: 'Design an end-to-end ML pipeline for real-time fraud detection.',
    followups: [
      'How would you handle concept drift in your model?',
      'What monitoring and alerting would you implement?'
    ],
    keywords: ['ML pipeline', 'real-time', 'fraud detection', 'concept drift', 'monitoring'],
    expectedTopics: ['MLOps', 'Real-time Systems', 'Model Monitoring']
  },

  // Computer Vision Questions
  {
    id: 'cv-01',
    role: ['Computer Vision Engineer'],
    difficulty: 'mid',
    category: 'technical',
    question: 'Compare YOLO and R-CNN architectures for object detection. What are the trade-offs?',
    followups: [
      'How would you optimize inference speed for mobile deployment?',
      'What data augmentation techniques would you use?'
    ],
    keywords: ['YOLO', 'R-CNN', 'object detection', 'inference speed', 'mobile'],
    expectedTopics: ['Object Detection', 'Model Optimization', 'Mobile Deployment']
  },

  // NLP Engineer Questions
  {
    id: 'nlp-01',
    role: ['NLP Engineer'],
    difficulty: 'mid',
    category: 'technical',
    question: 'How would you build a named entity recognition system for a new domain with limited labeled data?',
    followups: [
      'What transfer learning approaches would you consider?',
      'How would you handle multilingual requirements?'
    ],
    keywords: ['NER', 'limited data', 'transfer learning', 'multilingual'],
    expectedTopics: ['Named Entity Recognition', 'Transfer Learning', 'Low-resource NLP']
  },

  // Behavioral Questions
  {
    id: 'behavioral-01',
    role: ['Machine Learning Engineer', 'AI Research Scientist', 'Data Scientist'],
    difficulty: 'mid',
    category: 'behavioral',
    question: 'Tell me about a time when your ML model performed poorly in production. How did you debug and fix it?',
    followups: [
      'What monitoring tools did you use?',
      'How did you communicate the issue to stakeholders?'
    ],
    keywords: ['debugging', 'production issues', 'monitoring', 'stakeholder communication'],
    expectedTopics: ['Problem Solving', 'Production ML', 'Communication Skills']
  },

  // Entry Level Questions
  {
    id: 'entry-01',
    role: ['Machine Learning Engineer', 'Data Scientist'],
    difficulty: 'entry',
    category: 'technical',
    question: 'Explain the bias-variance tradeoff in machine learning with an example.',
    followups: [
      'How would you identify if your model has high bias or high variance?',
      'What techniques can help reduce overfitting?'
    ],
    keywords: ['bias-variance', 'overfitting', 'underfitting', 'model complexity'],
    expectedTopics: ['ML Fundamentals', 'Model Evaluation', 'Overfitting Prevention']
  },

  // Principal/Staff Level Questions
  {
    id: 'principal-01',
    role: ['AI Research Scientist', 'Machine Learning Engineer'],
    difficulty: 'principal',
    category: 'system-design',
    question: 'Design the AI infrastructure for a company transitioning from traditional software to AI-first products.',
    followups: [
      'How would you build a center of excellence for AI?',
      'What governance frameworks would you establish?'
    ],
    keywords: ['AI infrastructure', 'AI transformation', 'governance', 'center of excellence'],
    expectedTopics: ['Strategic Planning', 'Organizational Design', 'Technology Leadership']
  }
];

export function getQuestionsForRole(
  role: string, 
  difficulty: string, 
  company?: string,
  category?: string
): InterviewQuestion[] {
  return AI_INTERVIEW_QUESTIONS.filter(q => {
    const roleMatch = q.role.some(r => r.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(r.toLowerCase()));
    const difficultyMatch = q.difficulty === difficulty;
    const companyMatch = !company || !q.company || q.company.includes(company);
    const categoryMatch = !category || q.category === category;
    
    return roleMatch && difficultyMatch && companyMatch && categoryMatch;
  });
}

export function getRandomQuestion(
  role: string,
  difficulty: string,
  company?: string,
  excludeIds: string[] = []
): InterviewQuestion | null {
  const questions = getQuestionsForRole(role, difficulty, company)
    .filter(q => !excludeIds.includes(q.id));
  
  if (questions.length === 0) return null;
  
  return questions[Math.floor(Math.random() * questions.length)];
}