'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DeliverableViewer } from '../../../../../components/DeliverableViewer';
import { ApproveRejectButtons } from '../../../../../components/ApproveRejectButtons';

export default function StagePage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const [stage, setStage] = useState<{ stage: number; name: string; status: string; deliverable?: string; score?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !n) return;
    fetch(`/api/projects/${id}/stages/${n}`)
      .then(r => r.json())
      .then(d => { setStage(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, n]);

  async function handleApprove() {
    await fetch(`/api/projects/${id}/stages/${n}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) });
    setStage(s => s ? { ...s, status: 'approved' } : s);
  }

  async function handleReject(reason: string) {
    await fetch(`/api/projects/${id}/stages/${n}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', reason }) });
    setStage(s => s ? { ...s, status: 'rejected' } : s);
  }

  if (loading) return <p>Loading…</p>;
  if (!stage) return <p>Stage not found.</p>;

  return (
    <div>
      <a href={`/projects/${id}`} style={{ color: '#666' }}>← Back to project</a>
      <h1>Stage {stage.stage}: {stage.name}</h1>
      {stage.score !== undefined && <p>Quality score: <strong>{stage.score}/100</strong></p>}
      <ApproveRejectButtons status={stage.status} onApprove={handleApprove} onReject={handleReject} />
      <DeliverableViewer content={stage.deliverable ?? '*No deliverable yet.*'} />
    </div>
  );
}
