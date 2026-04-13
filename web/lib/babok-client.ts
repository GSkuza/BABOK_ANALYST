const BASE_URL = process.env.BABOK_MCP_URL ?? 'http://localhost:3001';

export interface Project {
  id: string;
  name: string;
  stages: StageInfo[];
  createdAt: string;
}

export interface StageInfo {
  stage: number;
  name: string;
  status: 'not_started' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  deliverable?: string;
  score?: number;
}

export interface ApiError {
  error: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as ApiError).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const babokClient = {
  listProjects: () => apiFetch<Project[]>('/projects'),
  getProject: (id: string) => apiFetch<Project>(`/projects/${id}`),
  createProject: (data: { name: string; language?: string }) =>
    apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getStage: (id: string, n: number) => apiFetch<StageInfo>(`/projects/${id}/stages/${n}`),
  approveStage: (id: string, n: number) =>
    apiFetch<{ ok: boolean }>(`/projects/${id}/stages/${n}`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) }),
  rejectStage: (id: string, n: number, reason: string) =>
    apiFetch<{ ok: boolean }>(`/projects/${id}/stages/${n}`, { method: 'POST', body: JSON.stringify({ action: 'reject', reason }) }),
  exportProject: (id: string) => `${BASE_URL}/api/projects/${id}/export`,
};
