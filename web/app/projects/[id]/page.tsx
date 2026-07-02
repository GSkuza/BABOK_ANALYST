import Link from 'next/link';
import { CalendarDays, ChevronRight, Download, FileText, FolderKanban } from 'lucide-react';
import { StageProgressBar } from '@/components/StageProgressBar';
import { getProject, STAGE_LABELS } from '@/lib/project-store';

export const revalidate = 30;

const STATUS_STYLES: Record<string, string> = {
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300',
  in_progress: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/70 dark:bg-brand-500/10 dark:text-brand-300',
  completed: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-500/10 dark:text-violet-300',
  not_started: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return (
      <div className="card-base mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Project not found</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The requested project journal could not be located in the shared storage.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl gradient-brand px-5 py-3 text-sm font-semibold text-white">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const approvedCount = project.stages.filter((stage) => stage.status === 'approved').length;
  const createdDate = new Date(project.createdAt).toLocaleString();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="link-subtle">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 dark:text-slate-200">{project.name}</span>
      </div>

      <section className="card-base overflow-hidden">
        <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-900/60 dark:bg-brand-500/10 dark:text-brand-300">
              <FolderKanban className="h-4 w-4" />
              Project workspace
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{project.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{project.id}</p>
            </div>

            <StageProgressBar stages={project.stages} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="metric-card">
              <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Approved stages</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
                {approvedCount}/{project.stages.length}
              </p>
            </div>

            <div className="metric-card">
              <div className="mb-3 inline-flex rounded-2xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
              <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{createdDate}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Analysis stages</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Open any stage to review its deliverable and use the approval controls.
            </p>
          </div>

          <a
            href={`/api/projects/${id}/export`}
            className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-950/20 transition hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            Export ZIP
          </a>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {(project.stages ?? []).map((stage) => (
            <Link
              key={stage.stage}
              href={`/projects/${id}/stages/${stage.stage}`}
              className="card-base card-hover block p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Stage {stage.stage}
                    </span>
                    <span className={`status-badge ${STATUS_STYLES[stage.status] ?? STATUS_STYLES.not_started}`}>
                      {stage.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {STAGE_LABELS[stage.stage] ?? stage.name}
                  </h3>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
