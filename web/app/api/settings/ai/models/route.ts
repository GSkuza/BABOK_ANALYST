import { NextResponse } from 'next/server';
import { AiSettingsError, getAiModelCatalog } from '@/lib/ai-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getAiModelCatalog());
  } catch (error) {
    const status = error instanceof AiSettingsError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unable to list AI models.';
    return NextResponse.json({ error: message }, { status });
  }
}
