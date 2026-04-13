'use client';
import { useEffect, useRef, useState } from 'react';

interface Props { chart: string; }

export function MermaidDiagram({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setError(null);
      }).catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    });

    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <pre style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: 12, overflowX: 'auto', fontSize: 13 }}>
        {chart}
        {'\n\n⚠ Mermaid parse error: '}{error}
      </pre>
    );
  }

  return <div ref={ref} style={{ overflowX: 'auto', margin: '16px 0' }} />;
}
