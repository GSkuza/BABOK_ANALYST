interface Props {
  score: number;
  label?: string;
}

const SCORE_STYLES = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-500/10 dark:text-emerald-300',
  medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-500/10 dark:text-amber-300',
  low: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300',
};

export function QualityScoreCard({ score, label = 'Quality score' }: Props) {
  const tone = score >= 75 ? SCORE_STYLES.high : score >= 50 ? SCORE_STYLES.medium : SCORE_STYLES.low;

  return (
    <div className={`inline-flex min-w-[140px] flex-col items-center rounded-3xl border px-5 py-4 text-center ${tone}`}>
      <span className="text-4xl font-semibold leading-none">{score}</span>
      <span className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}
