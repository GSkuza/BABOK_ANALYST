'use client';

import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Bot, FilePenLine, LoaderCircle, Send, UserRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeAgentMarkdown } from '@/lib/chat-markdown';
import type { StageChatMessage } from '@/lib/stage-chat';

interface Props {
  projectId: string;
  stageNumber: number;
  initialMessages: StageChatMessage[];
  locked: boolean;
}

function textOf(message: StageChatMessage) {
  return message.parts.map((part) => part.text).join('');
}

const chatMarkdownComponents: Components = {
  p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-950 dark:text-white">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-brand-400 pl-3 text-slate-600 dark:text-slate-300">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-brand-700 dark:bg-slate-800 dark:text-brand-300">
      {children}
    </code>
  ),
};

export function StageAgentChat({ projectId, stageNumber, initialMessages, locked }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const busy = isLoading || isPending;

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  async function post(payload: { message: string } | { action: 'start' | 'generate_draft' }) {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stages/${stageNumber}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: StageChatMessage;
        provider?: string;
      } | null;
      if (!response.ok || !body?.message) {
        throw new Error(body?.error ?? `Agent request failed with status ${response.status}`);
      }
      setMessages((current) => [...current, body.message!]);
      setProvider(body.provider || null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    const userMessage: StageChatMessage = { role: 'user', parts: [{ text: message }] };
    setMessages((current) => [...current, userMessage]);
    try {
      await post({ message });
    } catch (err) {
      setMessages((current) => current.filter((entry) => entry !== userMessage));
      setInput(message);
      setError(err instanceof Error ? err.message : 'AI agent request failed');
    }
  }

  async function handleStart() {
    try {
      await post({ action: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI agent request failed');
    }
  }

  async function handleGenerateDraft() {
    try {
      await post({ action: 'generate_draft' });
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft generation failed');
    }
  }

  return (
    <section className="card-base overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">AI analyst interview</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The agent gathers evidence one question at a time and remembers this stage conversation.
            </p>
          </div>
        </div>
        {provider ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {provider}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-6">
        {locked ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>The interview remains available, but generating a new draft requires opening a revision.</span>
          </div>
        ) : null}
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div
          ref={chatContainerRef}
          className="max-h-[560px] min-h-72 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
              <Bot className="h-10 w-10 text-brand-500" />
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">Start the stage interview</p>
                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                  The analyst will use the project profile and stage instructions to ask focused questions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                disabled={busy}
                className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Start interview
              </button>
            </div>
          ) : messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'model' ? <Bot className="mt-2 h-5 w-5 shrink-0 text-brand-500" /> : null}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}>
                {message.role === 'model' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={chatMarkdownComponents}>
                    {normalizeAgentMarkdown(textOf(message))}
                  </ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap">{textOf(message)}</span>
                )}
              </div>
              {message.role === 'user' ? <UserRound className="mt-2 h-5 w-5 shrink-0 text-slate-400" /> : null}
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin text-brand-500" />
              Analyst is thinking…
            </div>
          ) : null}
        </div>

        {messages.length > 0 ? (
          <>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Answer the analyst…"
                aria-label="Message to AI analyst"
                className="min-h-14 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-500/10"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={locked || busy}
                className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
              >
                <FilePenLine className="h-4 w-4" />
                Generate and save draft
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
