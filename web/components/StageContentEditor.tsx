'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Edit3, LoaderCircle, Save } from 'lucide-react';

interface Props {
  projectId: string;
  stageNumber: number;
  initialContent: string;
  locked: boolean;
}

export function StageContentEditor({ projectId, stageNumber, initialContent, locked }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dirty = content !== savedContent;

  async function handleSave() {
    setError(null);
    setSaved(false);
    const response = await fetch(`/api/projects/${projectId}/stages/${stageNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? `Save failed with status ${response.status}`);
      return;
    }

    setSavedContent(content);
    setSaved(true);
    startTransition(() => router.refresh());
  }

  return (
    <section className="card-base overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Edit deliverable</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Markdown is saved as a draft in the canonical project storage.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={locked || !dirty || isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save draft
        </button>
      </div>

      <div className="space-y-4 p-6">
        {locked ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>This approved stage is locked. Open a revision before editing its content.</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {saved ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            Draft saved
          </div>
        ) : dirty ? (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Unsaved changes</p>
        ) : null}

        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setSaved(false);
          }}
          disabled={locked}
          aria-label={`Stage ${stageNumber} deliverable content`}
          placeholder="# Add stage content here..."
          className="min-h-[420px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 font-mono text-sm leading-6 text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/10 dark:disabled:bg-slate-900"
        />
      </div>
    </section>
  );
}
