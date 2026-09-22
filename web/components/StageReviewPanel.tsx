'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { ApproveRejectButtons } from '@/components/ApproveRejectButtons';

interface Props {
  projectId: string;
  stageNumber: number;
  status: string;
  hasDeliverable: boolean;
  submittedForReview: boolean;
}

export function StageReviewPanel({
  projectId,
  stageNumber,
  status,
  hasDeliverable,
  submittedForReview,
}: Props) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function postAction(payload: { action: 'approve' } | { action: 'reject'; reason: string }) {
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
    </div>
  );
}
