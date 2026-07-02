import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, FolderKanban, Plus, Sparkles } from 'lucide-react';
import { StageProgressBar } from '@/components/StageProgressBar';
import { listProjects } from '@/lib/project-store';

export const revalidate = 30;

export default async function Dashboard() {
  const projects = listProjects();
  const stages = projects.flatMap((project) => project.stages ?? []);
  const approvedStages = stages.filter((stage) => stage.status === 'approved').length;
  const activeProjects = projects.filter((project) =>
    (project.stages ?? []).some((stage) => stage.status === 'in_progress' || stage.status === 'completed')
  ).length;

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="gradient-brand overflow-hidden rounded-[32px] p-8 text-white shadow-xl shadow-brand-950/20 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                <Sparkles className="h-4 w-4" />
                BABOK v3 workspace
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Track every stage of your business analysis in one place.
                </h1>
                <p className="max-w-xl text-base text-white/82 sm:text-lg">
                  Review projects, approve stages, and read deliverables without jumping between CLI artifacts.
                </p>
              </div>
            </div>

            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow-lg shadow-brand-950/20 transition hover:-translate-y-0.5 hover:bg-brand-50"
            >
              <Plus className="h-4 w-4" />
              Create project
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="metric-card">
            <div className="mb-3 inline-flex rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <FolderKanban className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Projects</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">{projects.length}</p>
          </div>

          <div className="metric-card">
            <div className="mb-3 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <Clock3 className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Active projects</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">{activeProjects}</p>
          </div>

          <div className="metric-card">
            <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Approved stages</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">{approvedStages}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Projects</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Open a project to inspect deliverables and move through the approval flow.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="card-base flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <FolderKanban className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">No projects yet</h3>
              <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
                Start a new BABOK analysis project to populate the dashboard and review progress here.
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-950/20 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Create first project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {projects.map((project) => {
              const approvedCount = project.stages.filter((stage) => stage.status === 'approved').length;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="card-base card-hover block p-6"
                >
                  <div className="flex h-full flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
                          {project.id}
                        </p>
                        <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                          {project.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {approvedCount}/{project.stages.length} approved
                      </span>
                    </div>

                    <StageProgressBar stages={project.stages} />

                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <span>Open project workspace</span>
                      <span className="inline-flex items-center gap-2 font-semibold text-brand-600 dark:text-brand-300">
                        View details
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
