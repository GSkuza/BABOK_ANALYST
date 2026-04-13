'use client';
import { useParams } from 'next/navigation';

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <a href={`/projects/${id}`} style={{ color: '#666' }}>← Back to project</a>
      <h1>Export</h1>
      <p>Download all stage deliverables as a ZIP archive.</p>
      <a
        href={`/api/projects/${id}/export`}
        download
        style={{ padding: '10px 20px', background: '#0070f3', color: 'white', borderRadius: 4, textDecoration: 'none', display: 'inline-block' }}
      >
        Download ZIP
      </a>
    </div>
  );
}
