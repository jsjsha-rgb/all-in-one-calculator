export interface User {
  id: string;
  name: string;
  email: string;
  examYear: number | null;
  preparationLevel: string | null;
  dailyGoalMinutes: number;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface UserStats {
  lessonsCompleted: number;
  lessonsTotal: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  streak: number;
  bookmarks: number;
  savedExplanations: number;
  mainsSubmissions: number;
  studyMinutes: number;
}

export interface WeakTopic {
  topic: string;
  subjectId: string;
  subjectName: string;
  attempts: number;
  accuracy: number;
}

export interface StudyTask {
  id: string;
  title: string;
  kind: 'lesson' | 'practice' | 'current-affairs' | string;
  lessonId: string | null;
  dueDate: string;
  status: 'pending' | 'completed';
  completedAt: string | null;
  estimatedMinutes: number;
}

export interface DashboardData {
  greetingName: string;
  date: string;
  dailyGoalMinutes: number;
  tasks: StudyTask[];
  tasksCompleted: number;
  tasksTotal: number;
  streak: number;
  stats: UserStats;
  weakTopics: WeakTopic[];
  attemptsToday: number;
  continueLearning: {
    id: string;
    title: string;
    summary: string;
    subjectId: string;
    subjectName: string;
    estimatedMinutes: number;
  } | null;
  latestArticle: {
    id: string;
    title: string;
    summary: string;
    publishedAt: string;
    subjectId: string;
  } | null;
}

export interface Subject {
  id: string;
  name: string;
  syllabusSection: string;
  description: string;
  accent: string;
  lessonCount: number;
  completedCount: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  completed: boolean;
  objectives: number;
}

export interface SubjectDetail {
  id: string;
  name: string;
  syllabusSection: string;
  description: string;
  accent: string;
  lessons: LessonSummary[];
  completedCount: number;
  lessonCount: number;
}

export interface LessonDetail {
  id: string;
  subjectId: string;
  subjectName: string;
  syllabusSection: string;
  accent: string;
  title: string;
  summary: string;
  content: string;
  objectives: string[];
  estimatedMinutes: number;
  completed: boolean;
  bookmarked: boolean;
  quizCount: number;
  nextLesson: { id: string; title: string } | null;
  previousLesson: { id: string; title: string } | null;
}

export interface PublicQuestion {
  id: string;
  subjectId: string;
  topic: string;
  examYear: number | null;
  questionText: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  questionType: 'mcq' | 'pyq-style';
  bookmarked?: boolean;
}

export interface AttemptResult {
  attemptId: string;
  isCorrect: boolean;
  selectedAnswer: number;
  correctAnswer: number;
  explanation: string;
  source: string;
  question: PublicQuestion;
}

export interface HistoryAttempt {
  id: string;
  questionId: string;
  questionText: string;
  topic: string;
  subjectId: string;
  subjectName: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
  options: string[];
  difficulty: string;
  source: string;
  createdAt: string;
}

export interface Mistake {
  id: string;
  questionText: string;
  options: string[];
  topic: string;
  subjectId: string;
  subjectName: string;
  selectedAnswer: number;
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  source: string;
  attemptedAt: string;
  attemptCount: number;
}

export interface SourceRef {
  title: string;
  type: string;
  id: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  sourceMetadata: { mode?: string; provider?: string; sources?: SourceRef[] };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

export interface AIStatus {
  mode: 'demo' | 'live';
  provider: 'gemini' | 'openai' | 'demo';
  model: string;
  reason?: string;
}

export interface EvaluationSection {
  score: number;
  maxScore: number;
  feedback: string;
}

export interface MainsFeedback {
  overall: { score: number; maxScore: number; band: string; summary: string };
  understanding: EvaluationSection;
  relevanceAccuracy: EvaluationSection;
  introduction: EvaluationSection;
  body: EvaluationSection;
  examples: EvaluationSection;
  conclusion: EvaluationSection;
  missingDimensions: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  modelAnswer?: string;
  disclaimer: string;
  mode: 'demo' | 'live';
  generatedAt: string;
}

export interface MainsQuestion {
  id: string;
  subjectId: string;
  subjectName: string;
  question: string;
  marks: number;
  guidance: string;
  modelAnswer: string;
  isSample: boolean;
}

export interface MainsSubmission {
  id: string;
  questionText: string;
  subjectId: string | null;
  subjectName: string | null;
  answerText?: string;
  wordCount: number;
  mode: string;
  createdAt: string;
  overall: MainsFeedback['overall'] | null;
  feedback?: MainsFeedback;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  subjectId: string;
  subjectName: string;
  syllabusSection: string;
  sourceUrl: string;
  sourceLabel: string;
  publishedAt: string;
  prelimsFacts: string[];
  mainsRelevance: string;
  relatedTopic: string | null;
  isDemo: boolean;
  bookmarked: boolean;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  subjectId: string | null;
  createdAt: string;
}

export interface ProfileOverview {
  user: User;
  stats: UserStats;
  weakTopics: WeakTopic[];
  weeklyActivity: Array<{ date: string; attempts: number; tasks: number }>;
  bookmarks: Bookmark[];
}
