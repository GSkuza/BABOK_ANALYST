'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [lang, setLang] = useState('EN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, language: lang }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>New Project</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Project Name
          <input
            value={name} onChange={e => setName(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </label>
        <label>
          Language
          <select value={lang} onChange={e => setLang(e.target.value)} style={{ display: 'block', marginTop: 4, padding: 8 }}>
            <option value="EN">English</option>
            <option value="PL">Polish</option>
          </select>
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {submitting ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}
