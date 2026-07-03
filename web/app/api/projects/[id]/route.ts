import { NextResponse } from 'next/server';
import { getProject, isValidProjectId } from '@/lib/project-store';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidProjectId(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  const project = getProject(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}
