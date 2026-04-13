'use client';
import { useState } from 'react';

interface Props {
  status: string;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export function ApproveRejectButtons({ status, onApprove, onReject }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'approved') return <p style={{ color: '#22c55e' }}>✅ Stage approved</p>;
  if (status === 'rejected') return <p style={{ color: '#ef4444' }}>❌ Stage rejected</p>;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
      <button onClick={async () => { setBusy(true); await onApprove(); setBusy(false); }}
        disabled={busy}
        style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        {busy ? '…' : '✅ Approve'}
      </button>
      {!rejecting ? (
        <button onClick={() => setRejecting(true)}
          style={{ padding: '8px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          ❌ Reject
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Reason…" value={reason} onChange={e => setReason(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <button onClick={async () => { setBusy(true); await onReject(reason); setBusy(false); setRejecting(false); }}
            disabled={busy || !reason.trim()}
            style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Confirm
          </button>
          <button onClick={() => setRejecting(false)} style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
