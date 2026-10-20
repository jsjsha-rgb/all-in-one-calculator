export interface SeedSubject {
  id: string;
  name: string;
  syllabusSection: string;
  description: string;
  accent: string;
  sortOrder: number;
}

export interface SeedLesson {
  id: string;
  subjectId: string;
  title: string;
  summary: string;
  content: string;
  objectives: string[];
  estimatedMinutes: number;
  sortOrder: number;
}

export interface SeedQuestion {
  id: string;
  subjectId: string;
  topic: string;
  examYear: number | null;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  questionType: 'mcq' | 'pyq-style';
}

export interface SeedArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  subjectId: string;
  sourceUrl: string;
  sourceLabel: string;
  publishedAt: string;
  prelimsFacts: string[];
  mainsRelevance: string;
  relatedTopic: string;
}

export interface SeedMainsQuestion {
  id: string;
  subjectId: string;
  question: string;
  marks: number;
  guidance: string;
  modelAnswer: string;
}

export const SAMPLE_LABEL = 'StudyMentor sample bank (original practice question, not an official UPSC paper)';
export const PYQ_STYLE_LABEL =
  'PYQ-style sample written by StudyMentor. Not a verbatim official UPSC question.';
export const DEMO_ARTICLE_SOURCE = 'StudyMentor sample newsroom (demo content, not live news)';
