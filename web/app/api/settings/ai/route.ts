import { NextResponse } from 'next/server';
import {
  AiSettingsError,
  clearAiProvider,
  getAiSettings,
  preferAiProvider,
  saveAiProvider,
} from '@/lib/ai-settings';

function errorResponse(error: unknown) {
  const status = error instanceof AiSettingsError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unable to update AI settings.';
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await getAiSettings());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: unknown;
      provider?: unknown;
      secret?: unknown;
    };
    if (typeof body.provider !== 'string') {
      return NextResponse.json({ error: 'AI provider is required.' }, { status: 400 });
    }
    if (body.action !== undefined && body.action !== 'save' && body.action !== 'prefer') {
      return NextResponse.json({ error: 'Unsupported settings action.' }, { status: 400 });
    }
    const result = body.action === 'prefer'
      ? await preferAiProvider(body.provider)
      : await saveAiProvider(body.provider, typeof body.secret === 'string' ? body.secret : '');
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { provider?: unknown };
    if (typeof body.provider !== 'string') {
      return NextResponse.json({ error: 'AI provider is required.' }, { status: 400 });
    }
    return NextResponse.json(await clearAiProvider(body.provider));
  } catch (error) {
    return errorResponse(error);
  }
}
