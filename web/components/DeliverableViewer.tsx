'use client';
import ReactMarkdown from 'react-markdown';

interface Props { content: string; }

export function DeliverableViewer({ content }: Props) {
  return (
    <div style={{ background: 'white', borderRadius: 8, padding: 24, marginTop: 16, lineHeight: 1.7 }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
