import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BABOK Analyst',
  description: 'AI-powered BABOK business analysis platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f5f5f5' }}>
        <nav style={{ background: '#1a1a2e', color: 'white', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 'bold', fontSize: 18 }}>🧠 BABOK Analyst</span>
          <a href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Dashboard</a>
          <a href="/projects/new" style={{ color: '#aaa', textDecoration: 'none' }}>New Project</a>
        </nav>
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
