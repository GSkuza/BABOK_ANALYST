import Link from 'next/link';
import { CalendarClock, ChevronLeft, ChevronRight, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { DeliverableViewer } from '@/components/DeliverableViewer';
import { QualityScoreCard } from '@/components/QualityScoreCard';
import { StageReviewPanel } from '@/components/StageReviewPanel';
import { getProject, getStage, STAGE_LABELS } from '@/lib/project-store';

export const revalidate = 30;

const STATUS_STYLES: Record<string, string> = {
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300',
  in_progress: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/70 dark:bg-brand-500/10 dark:text-brand-300',
  completed: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-500/10 dark:text-violet-300',
  not_started: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default async function StagePage({
  params,
}: {
  params: Promise<{ id: string; n: string }>;
}) {
  const { id, n } = await params;
  const stageNumber = Number.parseInt(n, 10);
  const project = getProject(id);
  const stage = Number.isNaN(stageNumber) ? null : getStage(id, stageNumber);

  if (!project || !stage) {
    return (
      <div className="card-base mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Stage not found</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The requested stage could not be loaded from the project journal.
        </p>
        <Link href={project ? `/projects/${id}` : '/'} className="mt-6 inline-flex rounded-2xl gradient-brand px-5 py-3 text-sm font-semibold text-white">
          Back
        </Link>
      </div>
    );
  }

  const currentIndex = project.stages.findIndex((projectStage) => projectStage.stage === stageNumber);
  const previousStage = currentIndex > 0 ? project.stages[currentIndex - 1] : null;
  const nextStage = currentIndex >= 0 && currentIndex < project.stages.length - 1 ? project.stages[currentIndex + 1] : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="link-subtle">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/projects/${id}`} className="link-subtle">
          {project.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 dark:text-slate-200">Stage {stageNumber}</span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="card-base overflow-hidden p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Stage {stageNumber}
                  </span>
                  <span className={`status-badge ${STATUS_STYLES[stage.status] ?? STATUS_STYLES.not_started}`}>
                    {stage.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {STAGE_LABELS[stageNumber] ?? stage.name}
                  </h1>
                  <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                    Review the stage deliverable, then approve or reject it to keep the Two-Key Journal flow moving.
                  </p>
                </div>
              </div>

              {typeof stage.score === 'number' && <QualityScoreCard score={stage.score} />}
            </div>
          </div>

          <DeliverableViewer content={stage.deliverable ?? '*No deliverable yet.*'} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <div className="card-base p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Review action</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Approve or reject this stage from the sidebar.</p>
                </div>
              </div>

              <StageReviewPanel projectId={id} stageNumber={stageNumber} status={stage.status} />
            </div>
          </div>

          <div className="card-base p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Stage metadata</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">A quick summary of the current review state.</p>
              </div>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Current status</dt>
                <dd className="font-semibold capitalize text-slate-950 dark:text-white">{stage.status.replace('_', ' ')}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">Stage file</dt>
                <dd className="text-right font-semibold text-slate-950 dark:text-white">
                  {stage.deliverable ? 'Available' : 'Not generated'}
                </dd>
              </div>
              {typeof stage.score === 'number' && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">Quality score</dt>
                  <dd className="font-semibold text-slate-950 dark:text-white">{stage.score}/100</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card-base p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Stage navigation</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Move across adjacent BABOK stages.</p>
              </div>
            </div>

            <div className="grid gap-3">
              {previousStage ? (
                <Link href={`/projects/${id}/stages/${previousStage.stage}`} className="card-hover rounded-2xl border border-slate-200/80 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </div>
                  <div className="mt-1 font-semibold text-slate-950 dark:text-white">
                    Stage {previousStage.stage}: {STAGE_LABELS[previousStage.stage] ?? previousStage.name}
                  </div>
                </Link>
              ) : null}

              {nextStage ? (
                <Link href={`/projects/${id}/stages/${nextStage.stage}`} className="card-hover rounded-2xl border border-slate-200/80 px-4 py-3 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-end gap-2 text-slate-500 dark:text-slate-400">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="mt-1 text-right font-semibold text-slate-950 dark:text-white">
                    Stage {nextStage.stage}: {STAGE_LABELS[nextStage.stage] ?? nextStage.name}
                  </div>
                </Link>
              ) : null}

              <Link
                href={`/projects/${id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FileText className="h-4 w-4" />
                Back to project
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
