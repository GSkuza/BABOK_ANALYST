interface Props { score: number; label?: string; }
export function QualityScoreCard({ score, label = 'Quality Score' }: Props) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', background: 'white', borderRadius: 8, border: `2px solid ${color}` }}>
      <span style={{ fontSize: 28, fontWeight: 'bold', color }}>{score}</span>
      <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
    </div>
  );
}
