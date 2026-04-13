'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StageProgressBar } from '../components/StageProgressBar';
import type { Project } from '../lib/babok-client';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <p>Loading projects…</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h1>Projects</h1>
      {projects.length === 0 && (
        <p>No projects yet. <Link href="/projects/new">Create one</Link>.</p>
      )}
      <div style={{ display: 'grid', gap: 16 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #0001' }}>
            <Link href={`/projects/${p.id}`} style={{ fontWeight: 'bold', fontSize: 18 }}>{p.name}</Link>
            <p style={{ color: '#666', fontSize: 13 }}>{p.id}</p>
            <StageProgressBar stages={p.stages ?? []} />
          </div>
        ))}
      </div>
    </div>
  );
}
