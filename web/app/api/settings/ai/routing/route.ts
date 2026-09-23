import { NextResponse } from 'next/server';
import { AiSettingsError, getModelRouting, saveModelRouting } from '@/lib/ai-settings';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  const status = error instanceof AiSettingsError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unable to update model routing.';
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await getModelRouting());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { routing?: unknown } | null;
    if (!body || typeof body.routing !== 'object' || body.routing === null) {
      return NextResponse.json({ error: 'Routing configuration is required.' }, { status: 400 });
    }
    return NextResponse.json(await saveModelRouting(body.routing));
  } catch (error) {
    return errorResponse(error);
  }
}
