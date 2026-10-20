import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  History,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { AIStatus, ChatMessage, Conversation } from '../lib/types';
import { cx, formatDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  TextArea,
} from '../components/ui';
import { Markdown } from '../components/Markdown';

const suggestedPrompts = [
  'Explain the basic structure doctrine in simple language.',
  'How does fiscal deficit differ from revenue deficit?',
  'Why does the monsoon break matter for farmers?',
  'Give me a 3-step framework for an ethics case study.',
];

export function MentorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(searchParams.get('prompt') ?? '');
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastAttempt, setLastAttempt] = useState('');
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [threadError, setThreadError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = async () => {
    try {
      const result = await api.conversations();
      setConversations(result.conversations);
    } catch {
      /* The thread remains usable even if history fails to load. */
    }
  };

  useEffect(() => {
    api.aiStatus().then(setStatus).catch(() => setStatus(null));
    void loadConversations();
    api
      .bookmarks('explanation')
      .then((result) => {
        setSaved(Object.fromEntries(result.bookmarks.map((item) => [item.itemId, true])));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (activeId) {
      setLoadingThread(true);
      setThreadError('');
      api
        .conversation(activeId)
        .then((result) => {
          setMessages(result.messages);
          setStatus(result.mode);
        })
        .catch((caught) =>
          setThreadError(caught instanceof ApiError ? caught.message : 'Could not load this chat.'),
        )
        .finally(() => setLoadingThread(false));
    } else {
      setMessages([]);
    }
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, sending]);

  const startNew = () => {
    setActiveId(null);
    setMessages([]);
    setError('');
    setInput('');
    setHistoryOpen(false);
    inputRef.current?.focus();
    setSearchParams({}, { replace: true });
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    if (text.length > 2000) {
      setError('Keep your question under 2,000 characters.');
      return;
    }
    setError('');
    setLastAttempt(text);
    setSending(true);
    setInput('');
    setSearchParams({}, { replace: true });
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      sourceMetadata: {},
    };
    setMessages((current) => [...current, optimistic]);

    try {
      const result = await api.sendMessage(text, activeId ?? undefined);
      setActiveId(result.conversationId);
      setMessages((current) => [
        ...current.filter((message) => message.id !== tempId),
        result.userMessage,
        result.assistantMessage,
      ]);
      await loadConversations();
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : 'The mentor could not answer right now. Please retry.';
      setMessages((current) => current.filter((message) => message.id !== tempId));
      setInput(text);
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const copy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(message.id);
      window.setTimeout(() => setCopied(null), 1800);
      toast('Answer copied to clipboard.');
    } catch {
      toast('Copying is not available in this browser. Select the text instead.', 'error');
    }
  };

  const saveNote = async (message: ChatMessage) => {
    try {
      const result = await api.saveExplanation(message.id);
      setSaved((current) => ({ ...current, [message.id]: result.bookmarked }));
      toast(
        result.bookmarked ? 'Explanation saved to your notes.' : 'Removed from saved notes.',
        'info',
      );
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not save this explanation.', 'error');
    }
  };

  const removeConversation = async (id: string) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await api.deleteConversation(id);
      setConversations((current) => current.filter((item) => item.id !== id));
      if (activeId === id) startNew();
      toast('Conversation deleted.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not delete the conversation.', 'error');
    }
  };

  const openConversation = (id: string) => {
    setActiveId(id);
    setError('');
    setHistoryOpen(false);
  };

  const modeBadge = status?.mode === 'live' ? (
    <Badge tone="success">Live · {status.provider}</Badge>
  ) : (
    <Badge tone="accent">Demo mode</Badge>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI mentor"
        title="Think it through, together"
        description="Ask about any UPSC concept. Answers are structured for revision, tied to your syllabus where possible, and clearly labelled when AI-generated."
        actions={
          <>
            {modeBadge}
            <Button variant="secondary" size="sm" icon={MessageSquarePlus} onClick={startNew}>
              New chat
            </Button>
          </>
        }
      />

      {status && status.mode === 'demo' ? (
        <Alert tone="warning" title="Demo mode — no external AI model is being called">
          Responses are generated from StudyMentor&apos;s built-in sample library so you can explore the
          full experience. {status.reason} To enable live answers, set a provider key on the server
          (see the README) and restart.
        </Alert>
      ) : status ? (
        <Alert tone="info" title="AI-generated guidance — verify before you rely on it">
          Connected to {status.provider} ({status.model}). Outputs can be incomplete or wrong. Check
          facts, dates and judgments against the Constitution, official sources or your standard
          texts.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <div className={cx('lg:block', historyOpen ? 'block' : 'hidden')}>
          <Card className="flex max-h-[calc(100dvh-220px)] flex-col p-3">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Conversations
              </h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-md p-1 text-muted hover:bg-paper lg:hidden"
                aria-label="Close conversation history"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {conversations.length ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cx(
                      'group flex items-start gap-1 rounded-xl px-2.5 py-2',
                      activeId === conversation.id ? 'bg-brand-50' : 'hover:bg-paper',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {conversation.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted">
                        {conversation.messageCount} messages · {formatDate(conversation.updatedAt, { year: undefined })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeConversation(conversation.id)}
                      className="mt-0.5 rounded-md p-1 text-muted opacity-0 transition-opacity hover:bg-danger-50 hover:text-danger-600 focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label={`Delete conversation ${conversation.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="px-2.5 py-6 text-center text-xs leading-relaxed text-muted">
                  No saved conversations yet. Your chats will appear here.
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={MessageSquarePlus}
              onClick={startNew}
              className="mt-2 w-full"
            >
              Start a new chat
            </Button>
          </Card>
        </div>

        {/* Thread */}
        <Card className={cx('min-h-[540px] flex-col overflow-hidden lg:flex', historyOpen ? 'hidden' : 'flex')}>
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">StudyMentor</p>
                <p className="text-[10px] text-muted">AI study assistant · UPSC GS</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHistoryOpen((open) => !open)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-paper hover:text-ink lg:hidden"
              >
                <History className="h-4 w-4" aria-hidden="true" /> History
              </button>
              {modeBadge}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 lg:max-h-[calc(100dvh-330px)]">
            {loadingThread ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : threadError ? (
              <Alert tone="danger" onRetry={() => activeId && openConversation(activeId)}>
                {threadError}
              </Alert>
            ) : messages.length === 0 ? (
              <div className="mx-auto max-w-xl py-4">
                <div className="text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-3 font-display text-xl text-brand-900">
                    What would you like to understand?
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    Ask a syllabus question, request a revision recap, or paste a Mains question for a
                    step-by-step approach.
                  </p>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="rounded-xl border border-line bg-surface p-3 text-left text-[12.5px] leading-relaxed text-ink transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) =>
                  message.role === 'user' ? (
                    <div key={message.id} className="flex justify-end gap-2.5">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-700 px-4 py-2.5 text-[13.5px] leading-relaxed text-white">
                        {message.content}
                      </div>
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-muted">
                        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  ) : (
                    <div key={message.id} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 max-w-[92%]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-ink">StudyMentor</span>
                          <Badge tone={message.sourceMetadata.mode === 'live' ? 'success' : 'accent'}>
                            {message.sourceMetadata.mode === 'live' ? 'AI-generated' : 'Demo answer'}
                          </Badge>
                          <span className="text-[10px] text-muted">
                            {formatDate(message.createdAt, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-1.5 rounded-2xl rounded-tl-sm border border-line bg-paper/50 px-4 py-3">
                          <Markdown content={message.content} className="text-[13.5px]" />
                          {message.sourceMetadata.sources?.length ? (
                            <div className="mt-3 border-t border-line pt-2.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                Sources used
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {message.sourceMetadata.sources.map((source) => (
                                  <span
                                    key={`${source.type}-${source.id}`}
                                    className="rounded-lg border border-line bg-surface px-2 py-1 text-[10px] text-muted"
                                  >
                                    {source.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void copy(message)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-paper hover:text-ink"
                          >
                            {copied === message.id ? (
                              <Check className="h-3 w-3 text-success-600" aria-hidden="true" />
                            ) : (
                              <Copy className="h-3 w-3" aria-hidden="true" />
                            )}
                            {copied === message.id ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveNote(message)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-paper hover:text-ink"
                          >
                            {saved[message.id] ? (
                              <BookmarkCheck className="h-3 w-3 text-accent-600" aria-hidden="true" />
                            ) : (
                              <Bookmark className="h-3 w-3" aria-hidden="true" />
                            )}
                            {saved[message.id] ? 'Saved' : 'Save to notes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
                {sending ? (
                  <div className="flex gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper/50 px-4 py-3 text-xs text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Thinking through the syllabus…
                      <span className="typing-dot h-1 w-1 rounded-full bg-brand-600" />
                      <span className="typing-dot h-1 w-1 rounded-full bg-brand-600" style={{ animationDelay: '0.15s' }} />
                      <span className="typing-dot h-1 w-1 rounded-full bg-brand-600" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-line bg-surface p-3 sm:p-4">
            {error ? (
              <div className="mb-3">
                <Alert tone="danger" onRetry={() => void send(lastAttempt)}>
                  {error}
                </Alert>
              </div>
            ) : null}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <label htmlFor="mentor-input" className="sr-only">
                Ask the AI mentor a question
              </label>
              <div className="flex items-end gap-2">
                <TextArea
                  id="mentor-input"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ask about a concept, a judgment, a scheme or a Mains question…"
                  className="min-h-[52px] max-h-40 py-3 text-[13.5px]"
                  rows={2}
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="primary"
                  className="mb-0.5 h-11 w-11 shrink-0"
                  loading={sending}
                  disabled={!input.trim()}
                  aria-label="Send question"
                >
                  {sending ? null : <ArrowUp className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
                <span>
                  Enter to send · Shift + Enter for a new line · {input.length}/2000
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInput(lastAttempt);
                    inputRef.current?.focus();
                  }}
                  disabled={!lastAttempt}
                  className="inline-flex items-center gap-1 hover:text-ink disabled:opacity-40"
                >
                  <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" /> Restore last question
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" aria-hidden="true" />
        AI answers are study aids, not official guidance. The mentor will not invent citations; when
        no source is available, it says so. For Mains marks and syllabus authority, always rely on
        official UPSC material.
      </div>

      {messages.length === 0 && !sending ? (
        <div className="lg:hidden">
          <EmptyState
            icon={History}
            title="Where are my old chats?"
            description="Tap History above to reopen a saved conversation. Chats are stored privately against your account."
          />
        </div>
      ) : null}
    </div>
  );
}
