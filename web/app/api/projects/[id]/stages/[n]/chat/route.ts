import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  generateStageDraftFromChat,
  getStageChatHistory,
  sendStageChatMessage,
  startStageInterview,
  StageChatError,
} from '@/lib/stage-chat';
import { isValidProjectId } from '@/lib/project-store';

function errorResponse(error: unknown) {
  if (error instanceof StageChatError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'AI agent request failed' },
    { status: 500 },
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNumber = Number.parseInt(n, 10);
  if (!isValidProjectId(id) || Number.isNaN(stageNumber)) {
    return NextResponse.json({ error: 'Invalid project or stage' }, { status: 400 });
  }
  try {
    return NextResponse.json({ messages: getStageChatHistory(id, stageNumber) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNumber = Number.parseInt(n, 10);
  if (!isValidProjectId(id) || Number.isNaN(stageNumber)) {
    return NextResponse.json({ error: 'Invalid project or stage' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { action?: unknown; message?: unknown; provider?: unknown };
    const provider = typeof body.provider === 'string' ? body.provider : undefined;
    const result = body.action === 'generate_draft'
      ? await generateStageDraftFromChat(id, stageNumber, { provider })
      : body.action === 'start'
        ? await startStageInterview(id, stageNumber, { provider })
        : await sendStageChatMessage(
            id,
            stageNumber,
            typeof body.message === 'string' ? body.message : '',
            { provider },
          );
    revalidatePath(`/projects/${id}`);
    revalidatePath(`/projects/${id}/stages/${n}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
