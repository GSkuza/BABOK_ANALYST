'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [lang, setLang] = useState('EN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), language: lang }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Failed with status ${res.status}`);
      }

      const project = await res.json();
      setSuccess(true);
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md mx-auto px-4 py-16">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 text-sm mb-8 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        {/* Card Container */}
        <div className="card-base p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Set up a new BABOK analysis project
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Project created successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Project Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., ACME Corp Analysis"
                disabled={submitting}
                required
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>

            {/* Language Field */}
            <div className="space-y-2">
              <label htmlFor="lang" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Language
              </label>
              <select
                id="lang"
                value={lang}
                onChange={e => setLang(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors disabled:opacity-50"
              >
                <option value="EN">English</option>
                <option value="PL">Polski (Polish)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || success}
              className="mt-6 w-full rounded-2xl gradient-brand px-4 py-3 text-white font-semibold shadow-lg shadow-brand-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Creating Project...' : success ? 'Redirecting...' : 'Create Project'}
            </button>
          </form>

          {/* Help Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4">
            You&apos;ll be able to select analysis stages after creating the project.
          </p>
        </div>
      </div>
    </div>
  );
}
