import type {
  AIStatus,
  Article,
  AttemptResult,
  Bookmark,
  ChatMessage,
  Conversation,
  DashboardData,
  HistoryAttempt,
  LessonDetail,
  MainsFeedback,
  MainsQuestion,
  MainsSubmission,
  Mistake,
  ProfileOverview,
  PublicQuestion,
  StudyTask,
  Subject,
  SubjectDetail,
  User,
  UserStats,
  WeakTopic,
} from './types';

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  errors: FieldError[];
  retryable?: boolean;

  constructor(
    message: string,
    status: number,
    options: { code?: string; errors?: FieldError[]; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code;
    this.errors = options.errors ?? [];
    this.retryable = options.retryable;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError('Cannot reach the StudyMentor server. Check your connection and retry.', 0);
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status}). Please try again.`, response.status, {
      code: data?.code,
      errors: data?.errors,
      retryable: data?.retryable,
    });
  }
  return data as T;
}

const body = (payload: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(payload) });
const put = (payload: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(payload) });
const qs = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const api = {
  auth: {
    signup: (payload: { name: string; email: string; password: string }) =>
      request<{ user: User }>('/auth/signup', body(payload)),
    login: (payload: { email: string; password: string }) =>
      request<{ user: User }>('/auth/login', body(payload)),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: User }>('/auth/me'),
    onboarding: (payload: {
      examYear: number;
      preparationLevel: string;
      dailyGoalMinutes: number;
    }) => request<{ user: User }>('/auth/onboarding', put(payload)),
    forgotPassword: (email: string) =>
      request<{ message: string; devResetToken?: string }>(
        '/auth/forgot-password',
        body({ email }),
      ),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', body({ token, password })),
  },
  aiStatus: () => request<AIStatus>('/ai/status'),
  dashboard: () => request<DashboardData>('/dashboard'),
  subjects: () => request<{ subjects: Subject[] }>('/subjects'),
  subject: (id: string) => request<{ subject: SubjectDetail }>(`/subjects/${id}`),
  lesson: (id: string) => request<{ lesson: LessonDetail }>(`/lessons/${id}`),
  completeLesson: (id: string) =>
    request<{ completed: boolean; completedAt: string; message: string; stats: UserStats }>(
      `/lessons/${id}/complete`,
      { method: 'POST' },
    ),
  uncompleteLesson: (id: string) =>
    request<{ completed: boolean; stats: UserStats }>(`/lessons/${id}/complete`, {
      method: 'DELETE',
    }),
  toggleTask: (id: string) =>
    request<{ task: StudyTask; dashboard: DashboardData }>(`/study-tasks/${id}/toggle`, {
      method: 'POST',
    }),
  filters: () =>
    request<{
      subjects: Array<{ id: string; name: string; count: number }>;
      topics: Array<{ subjectId: string; topic: string; count: number }>;
      years: number[];
      difficulties: Array<{ value: string; count: number }>;
      total: number;
    }>('/practice/filters'),
  questions: (params: {
    subject?: string;
    topic?: string;
    year?: string;
    difficulty?: string;
    bookmarked?: boolean;
    limit?: number;
    offset?: number;
  }) => request<{ questions: PublicQuestion[]; total: number; hasMore: boolean }>(`/practice/questions${qs(params)}`),
  submitAttempt: (questionId: string, selectedAnswer: number) =>
    request<AttemptResult>('/practice/attempt', body({ questionId, selectedAnswer })),
  history: (limit = 50) =>
    request<{ attempts: HistoryAttempt[] }>(`/practice/history${qs({ limit })}`),
  mistakes: () => request<{ mistakes: Mistake[] }>('/practice/mistakes'),
  practiceStats: () =>
    request<{
      overall: { attempts: number; correct: number; accuracy: number };
      bySubject: Array<{ id: string; name: string; attempts: number; correct: number; accuracy: number }>;
    }>('/practice/stats'),
  bookmarks: (type?: string) => request<{ bookmarks: Bookmark[] }>(`/bookmarks${qs({ type })}`),
  toggleBookmark: (itemType: string, itemId: string) =>
    request<{ bookmarked: boolean; id: string }>('/bookmarks', body({ itemType, itemId })),
  affairs: (params: { search?: string; subject?: string }) =>
    request<{ articles: Article[] }>(`/affairs${qs(params)}`),
  article: (id: string) =>
    request<{ article: Article; relatedQuestions: PublicQuestion[] }>(`/affairs/${id}`),
  conversations: () => request<{ conversations: Conversation[] }>('/mentor/conversations'),
  conversation: (id: string) =>
    request<{ conversation: Conversation; messages: ChatMessage[]; mode: AIStatus }>(
      `/mentor/conversations/${id}`,
    ),
  createConversation: () =>
    request<{ conversation: Conversation }>('/mentor/conversations', body({})),
  deleteConversation: (id: string) =>
    request<{ ok: true }>(`/mentor/conversations/${id}`, { method: 'DELETE' }),
  sendMessage: (message: string, conversationId?: string) =>
    request<{
      conversationId: string;
      mode: 'demo' | 'live';
      provider: string;
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }>('/mentor/messages', body({ message, conversationId })),
  saveExplanation: (messageId: string) =>
    request<{ bookmarked: boolean }>(`/mentor/messages/${messageId}/save`, { method: 'POST' }),
  mainsQuestions: () =>
    request<{ questions: MainsQuestion[]; status: AIStatus }>('/mains/questions'),
  evaluateMains: (payload: {
    questionText: string;
    answerText: string;
    subjectId: string;
    marks: number;
  }) => request<{ submission: MainsSubmission }>('/mains/evaluate', body(payload)),
  mainsSubmissions: () => request<{ submissions: MainsSubmission[] }>('/mains/submissions'),
  mainsSubmission: (id: string) => request<{ submission: MainsSubmission }>(`/mains/submissions/${id}`),
  deleteMainsSubmission: (id: string) =>
    request<{ ok: true }>(`/mains/submissions/${id}`, { method: 'DELETE' }),
  profile: () => request<ProfileOverview>('/profile'),
  updateProfile: (payload: {
    name: string;
    examYear: number;
    preparationLevel: string;
    dailyGoalMinutes: number;
  }) => request<{ user: User; message: string }>('/profile', put(payload)),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/profile/password', put({ currentPassword, newPassword })),
};

export type { WeakTopic, MainsFeedback };
