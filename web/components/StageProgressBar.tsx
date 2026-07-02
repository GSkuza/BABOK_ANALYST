interface Stage {
  stage: number;
  status: string;
}

const STEP_STYLES: Record<string, string> = {
  approved: 'bg-emerald-500 shadow-emerald-500/30',
  completed: 'bg-violet-500 shadow-violet-500/30',
  in_progress: 'bg-brand-500 shadow-brand-500/30',
  rejected: 'bg-red-500 shadow-red-500/30',
  not_started: 'bg-slate-300 shadow-transparent dark:bg-slate-700',
};

export function StageProgressBar({ stages }: { stages: Stage[] }) {
  const total = stages.length || 9;
  const approved = stages.filter((stage) => stage.status === 'approved').length;
  const completed = stages.filter((stage) => stage.status === 'approved' || stage.status === 'completed').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {approved}/{total} stages approved
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {completed} completed or approved
          </p>
        </div>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">{percent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-purple transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {stages.map((stage) => (
          <div key={stage.stage} className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full shadow-lg ${STEP_STYLES[stage.status] ?? STEP_STYLES.not_started}`}
              title={`Stage ${stage.stage}: ${stage.status}`}
            />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">S{stage.stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
