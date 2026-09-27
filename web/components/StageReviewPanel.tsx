'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, LockOpen } from 'lucide-react';
import { ApproveRejectButtons } from '@/components/ApproveRejectButtons';

interface Props {
  projectId: string;
  stageNumber: number;
  status: string;
  hasDeliverable: boolean;
  submittedForReview: boolean;
  revisionOpen: boolean;
}

export function StageReviewPanel({
  projectId,
  stageNumber,
  status,
  hasDeliverable,
  submittedForReview,
  revisionOpen,
}: Props) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentRevisionOpen, setCurrentRevisionOpen] = useState(revisionOpen);
  const [error, setError] = useState<string | null>(null);
  const [openingRevision, setOpeningRevision] = useState(false);
  const [, startTransition] = useTransition();

  async function postAction(payload: { action: 'approve' } | { action: 'reject'; reason: string } | { action: 'open_revision' }) {
    const response = await fetch(`/api/projects/${projectId}/stages/${stageNumber}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `Request failed with status ${response.status}`);
    }
  }

  async function handleApprove() {
    setError(null);
    try {
      await postAction({ action: 'approve' });
      setCurrentStatus('approved');
      setCurrentRevisionOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve stage');
    }
  }

  async function handleReject(reason: string) {
    setError(null);
    try {
      await postAction({ action: 'reject', reason });
      setCurrentStatus('rejected');
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject stage');
    }
  }

  async function handleOpenRevision() {
    setError(null);
    setOpeningRevision(true);
    try {
      await postAction({ action: 'open_revision' });
      setCurrentStatus('in_progress');
      setCurrentRevisionOpen(true);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open revision');
    } finally {
      setOpeningRevision(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {!hasDeliverable ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Complete the interview, then use <strong>Generate and save draft</strong> before review.</span>
        </div>
      ) : !submittedForReview && currentStatus !== 'approved' && currentStatus !== 'rejected' ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>This is an unsubmitted draft. Generate it again from the interview to submit it for review.</span>
        </div>
      ) : (
        <ApproveRejectButtons status={currentStatus} onApprove={handleApprove} onReject={handleReject} />
      )}

      {currentStatus === 'approved' && !currentRevisionOpen ? (
        <button
          onClick={handleOpenRevision}
          disabled={openingRevision}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <LockOpen className="h-4 w-4" />
          {openingRevision ? 'Opening revision…' : 'Open revision to edit'}
        </button>
      ) : null}
    </div>
  );
}
