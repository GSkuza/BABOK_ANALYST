interface Stage { stage: number; status: string; }

export function StageProgressBar({ stages }: { stages: Stage[] }) {
  const total = stages.length || 8;
  const approved = stages.filter(s => s.status === 'approved').length;
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
        <span>{approved}/{total} stages approved</span><span>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, marginTop: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#22c55e', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
