'use client';
import { useState } from 'react';
import { Check, X, Loader } from 'lucide-react';

interface Props {
  status: string;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export function ApproveRejectButtons({ status, onApprove, onReject }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleApprove = async () => {
    setBusy(true);
    try {
      await onApprove();
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await onReject(reason);
      setRejecting(false);
      setReason('');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'approved') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
        <Check className="w-5 h-5" />
        <span className="font-medium">Stage approved</span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
        <X className="w-5 h-5" />
        <span className="font-medium">Stage rejected</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!rejecting ? (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleApprove}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Approving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve Stage
              </>
            )}
          </button>

          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Reject Stage
          </button>
        </div>
      ) : (
        <div className="card-base space-y-3 p-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Rejection Reason *
          </label>
          
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this stage is being rejected…"
            disabled={busy}
            rows={4}
            className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 transition-colors placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-red-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
          />

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setRejecting(false);
                setReason('');
              }}
              disabled={busy}
              className="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirmReject}
              disabled={busy || !reason.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Confirm Rejection
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
