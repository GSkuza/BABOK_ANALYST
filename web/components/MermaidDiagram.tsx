'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface Props { chart: string; }

let mermaidLoader: Promise<typeof import('mermaid')['default']> | null = null;

function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then(({ default: mermaid }) => mermaid);
  }

  return mermaidLoader;
}

export function MermaidDiagram({ chart }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const diagramId = useId().replace(/:/g, '-');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    setLoading(true);

    loadMermaid().then((mermaid) => {
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: resolvedTheme === 'dark' ? 'dark' : 'default' });
      mermaid.render(`mermaid-${diagramId}`, chart).then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setError(null);
        setLoading(false);
      }).catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    });

    return () => { cancelled = true; };
  }, [chart, diagramId, resolvedTheme]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-500/10 dark:text-amber-200">
        {chart}
        {'\n\n⚠ Mermaid parse error: '}{error}
      </pre>
    );
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Rendering diagram...
        </div>
      ) : null}
      <div ref={ref} className="overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full" />
    </div>
  );
}
