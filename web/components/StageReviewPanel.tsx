'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { ApproveRejectButtons } from '@/components/ApproveRejectButtons';

interface Props {
  projectId: string;
  stageNumber: number;
  status: string;
}

export function StageReviewPanel({ projectId, stageNumber, status }: Props) {
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

      <ApproveRejectButtons status={currentStatus} onApprove={handleApprove} onReject={handleReject} />
    </div>
  );
}
