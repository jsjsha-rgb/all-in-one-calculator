import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ExternalLink,
  Info,
  ListChecks,
  Newspaper,
  Search,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Article, PublicQuestion, Subject } from '../lib/types';
import { formatDate, pluralize } from '../lib/format';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingBlock,
  PageHeader,
  TextInput,
} from '../components/ui';
import { Markdown } from '../components/Markdown';

export function AffairsPage() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.subjects().then((result) => setSubjects(result.subjects)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const timeout = window.setTimeout(() => {
      api
        .affairs({ search: query, subject })
        .then((result) => {
          if (active) setArticles(result.articles);
        })
        .catch((caught) => {
          if (active) setError(caught instanceof ApiError ? caught.message : 'Could not load briefs.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query, subject, reloadKey]);

  const toggleBookmark = async (article: Article) => {
    try {
      const result = await api.toggleBookmark('article', article.id);
      setArticles(
        (current) =>
          current?.map((item) =>
            item.id === article.id ? { ...item, bookmarked: result.bookmarked } : item,
          ) ?? null,
      );
      toast(result.bookmarked ? 'Brief saved for revision.' : 'Bookmark removed.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update bookmark.', 'error');
    }
  };

  const visibleSubjects = useMemo(
    () => subjects.filter((item) => ['polity', 'history', 'geography', 'economy', 'environment', 'science-tech', 'ethics'].includes(item.id)),
    [subjects],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Current affairs"
        title="Context, not just headlines"
        description="Dated briefs written for exam relevance: a short summary, the prelims facts worth remembering and the Mains angle."
        actions={<Badge tone="accent" icon={Info}>Sample content</Badge>}
      />

      <Alert tone="warning" title="These are original sample briefs, not live news">
        Every entry is clearly labelled demo content created for this prototype. No real publisher is
        quoted or scraped, and no date-sensitive factual claims are presented as current events. The
        data layer is structured so an authorised content provider or editorial workflow can be
        connected later.
      </Alert>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <label htmlFor="affairs-search" className="sr-only">
            Search current affairs
          </label>
          <TextInput
            id="affairs-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setQuery(event.target.value);
            }}
            placeholder="Search briefs by keyword"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSubject('')}
            aria-pressed={subject === ''}
            className={
              subject === ''
                ? 'rounded-full border border-brand-700 bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white'
                : 'rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-muted hover:border-brand-200 hover:text-ink'
            }
          >
            All subjects
          </button>
          {visibleSubjects.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubject(subject === item.id ? '' : item.id)}
              aria-pressed={subject === item.id}
              className={
                subject === item.id
                  ? 'rounded-full border border-brand-700 bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white'
                  : 'rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-muted hover:border-brand-200 hover:text-ink'
              }
            >
              {item.name.replace(' & Governance', '').replace('Indian ', '').replace(' & Culture', '')}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert tone="danger" onRetry={() => setReloadKey((key) => key + 1)}>{error}</Alert> : null}

      {loading ? (
        <LoadingBlock label="Loading briefs…" />
      ) : articles && articles.length ? (
        <>
          <p className="text-xs text-muted">{pluralize(articles.length, 'brief')} found</p>
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <Card key={article.id} className="flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{article.subjectName}</Badge>
                  {article.syllabusSection ? <Badge tone="neutral">{article.syllabusSection}</Badge> : null}
                  <Badge tone="accent">Demo brief</Badge>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted">
                    <CalendarDays className="h-3 w-3" aria-hidden="true" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <Link to={`/affairs/${article.id}`} className="group mt-3">
                  <h2 className="font-display text-lg leading-snug text-brand-900 group-hover:underline">
                    {article.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">
                    {article.summary}
                  </p>
                </Link>
                <div className="mt-3 rounded-xl bg-paper px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                  <span className="font-semibold text-ink">Mains angle: </span>
                  {article.mainsRelevance}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <Link
                    to={`/affairs/${article.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Read brief <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void toggleBookmark(article)}
                    aria-pressed={article.bookmarked}
                    icon={article.bookmarked ? BookmarkCheck : Bookmark}
                  >
                    {article.bookmarked ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No briefs match that search"
          description="Try another keyword or clear the subject filter. New sample briefs are added through the seed script."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setQuery('');
                setSubject('');
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
}

export function ArticlePage() {
  const { articleId = '' } = useParams();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<PublicQuestion[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .article(articleId)
      .then((result) => {
        setArticle(result.article);
        setRelated(result.relatedQuestions);
      })
      .catch((caught) =>
        setError(caught instanceof ApiError ? caught.message : 'Could not open this brief.'),
      )
      .finally(() => setLoading(false));
  }, [articleId]);

  const toggleBookmark = async () => {
    if (!article) return;
    try {
      const result = await api.toggleBookmark('article', article.id);
      setArticle({ ...article, bookmarked: result.bookmarked });
      toast(result.bookmarked ? 'Brief saved for revision.' : 'Bookmark removed.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update bookmark.', 'error');
    }
  };

  if (loading) return <LoadingBlock label="Opening brief…" />;
  if (error || !article) {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title="Brief unavailable">{error || 'This article could not be found.'}</Alert>
        <LinkButton to="/affairs" variant="secondary" size="sm" icon={ArrowLeft}>
          Back to current affairs
        </LinkButton>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
        <Link to="/affairs" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Current affairs
        </Link>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{article.subjectName}</Badge>
          {article.syllabusSection ? <Badge tone="outline">{article.syllabusSection}</Badge> : null}
          <Badge tone="accent">Sample brief</Badge>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h1 className="mt-3 max-w-3xl font-display text-[28px] leading-tight text-brand-900 sm:text-[36px]">
          {article.title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">{article.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant={article.bookmarked ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => void toggleBookmark()}
            icon={article.bookmarked ? BookmarkCheck : Bookmark}
            aria-pressed={article.bookmarked}
          >
            {article.bookmarked ? 'Saved for revision' : 'Save for revision'}
          </Button>
          <LinkButton to={`/practice?subject=${article.subjectId}`} variant="secondary" size="sm" icon={ListChecks}>
            Related practice
          </LinkButton>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-5 sm:p-8">
            <Markdown content={article.content} />
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Related practice questions</h2>
            {related.length ? (
              <ul className="mt-3 space-y-2">
                {related.map((question) => (
                  <li key={question.id} className="rounded-xl border border-line p-3.5">
                    <p className="text-[13px] font-medium leading-relaxed text-ink">
                      {question.questionText.split('\n')[0]}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted">
                        {question.topic} · {question.difficulty}
                      </span>
                      <Link
                        to={`/practice?subject=${article.subjectId}&topic=${encodeURIComponent(question.topic)}`}
                        className="text-[11px] font-semibold text-brand-700 hover:underline"
                      >
                        Practise this topic
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                No linked questions yet. Use the Practice tab to browse this subject.
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-brand-100 bg-brand-50/60 p-5">
            <h2 className="text-sm font-semibold text-brand-900">Why it matters for UPSC</h2>
            <p className="mt-2 text-xs leading-relaxed text-brand-800">{article.mainsRelevance}</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Prelims facts to remember</h2>
            <ul className="mt-3 space-y-2.5">
              {article.prelimsFacts.map((fact) => (
                <li key={fact} className="flex gap-2 text-xs leading-relaxed text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                  {fact}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Source & provenance</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {article.sourceLabel}
            </p>
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-all text-[11px] font-medium text-brand-700 underline underline-offset-2"
            >
              Source reference <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              This URL points to a demo path, not a real publication. No third-party article has been
              copied, scraped or attributed.
            </p>
          </Card>

          <div className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-[11px] leading-relaxed text-accent-700">
            <span className="font-semibold">Demo content. </span>
            Check any date-sensitive facts against official sources before using them in an answer.
          </div>
        </aside>
      </div>
    </article>
  );
}
