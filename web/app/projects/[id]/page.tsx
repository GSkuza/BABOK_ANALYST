'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StageProgressBar } from '../../../components/StageProgressBar';
import type { Project } from '../../../lib/babok-client';

// Index 0 unused; stages are 1-8 per BABOK framework
const STAGE_NAMES: Record<number, string> = {
  1: 'Project Initialization',
  2: 'Current State (AS-IS)',
  3: 'Problem Domain',
  4: 'Solution Requirements',
  5: 'Future State (TO-BE)',
  6: 'Gap Analysis & Roadmap',
  7: 'Risk Assessment',
  8: 'Business Case & ROI',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(d => { setProject(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p style={{ color: '#666' }}>{project.id}</p>
      <StageProgressBar stages={project.stages ?? []} />
      <h2>Stages</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {(project.stages ?? []).map(s => (
          <div key={s.stage} style={{ background: 'white', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>Stage {s.stage}: {STAGE_NAMES[s.stage] ?? s.name}</strong>
              <span style={{ marginLeft: 12, fontSize: 12, padding: '2px 8px', borderRadius: 12, background: s.status === 'approved' ? '#d4edda' : s.status === 'rejected' ? '#f8d7da' : '#fff3cd' }}>
                {s.status}
              </span>
            </div>
            <Link href={`/projects/${id}/stages/${s.stage}`}>View →</Link>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Link href={`/projects/${id}/export`} style={{ padding: '8px 16px', background: '#0070f3', color: 'white', borderRadius: 4, textDecoration: 'none' }}>
          Export
        </Link>
      </div>
    </div>
  );
}
