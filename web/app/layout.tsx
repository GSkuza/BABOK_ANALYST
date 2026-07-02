import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { Providers } from '@/components/Providers';
import { Brain, FolderKanban, PlusCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'BABOK Analyst',
  description: 'AI-powered BABOK business analysis platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-shell text-slate-900 dark:text-slate-50">
        <ThemeProvider>
          <Providers>
            <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
              <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex min-w-0 items-center gap-3 text-white">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand shadow-lg shadow-brand-950/30">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold tracking-tight">BABOK Analyst</p>
                    <p className="truncate text-xs text-slate-300">Business analysis workspace</p>
                  </div>
                </Link>

                <nav className="hidden items-center gap-2 md:flex">
                  <Link href="/" className="nav-link">
                    <FolderKanban className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/projects/new" className="nav-link nav-link-primary">
                    <PlusCircle className="h-4 w-4" />
                    New Project
                  </Link>
                </nav>

                <div className="flex items-center gap-3 shrink-0">
                  <DarkModeToggle />
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
