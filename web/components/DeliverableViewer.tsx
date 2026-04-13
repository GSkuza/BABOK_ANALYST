'use client';
import ReactMarkdown from 'react-markdown';
import { MermaidDiagram } from './MermaidDiagram';

interface Props { content: string; }

export function DeliverableViewer({ content }: Props) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 24, marginTop: 16, lineHeight: 1.7 }}>
      <ReactMarkdown
        components={{
          code({ className, children }) {
            const lang = (className ?? '').replace('language-', '');
            const code = String(children).replace(/\n$/, '');
            if (lang === 'mermaid') {
              return <MermaidDiagram chart={code} />;
            }
            return (
              <code style={{ background: '#f4f4f4', borderRadius: 3, padding: '2px 5px', fontFamily: 'monospace' }}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <pre style={{ background: '#f4f4f4', borderRadius: 4, padding: 16, overflowX: 'auto' }}>{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
