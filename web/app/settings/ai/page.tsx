import Link from 'next/link';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { AiSettingsPanel } from '@/components/AiSettingsPanel';
import { getAiSettings } from '@/lib/ai-settings';

export const dynamic = 'force-dynamic';

export default async function AiSettingsPage() {
  const settings = await getAiSettings();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="link-subtle">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200">AI settings</span>
      </div>

      <section className="card-base p-8 lg:p-10">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">AI provider settings</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Configure the provider used by stage interviews. Credentials are encrypted in the local BABOK keystore
              and are never returned to the browser after saving.
            </p>
            <div className="mt-4 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Use provider API credentials; GitHub Copilot subscription credits are not provider API credits.</span>
            </div>
          </div>
        </div>
      </section>

      <AiSettingsPanel initialSettings={settings} />
    </div>
  );
}
