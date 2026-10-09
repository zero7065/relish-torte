export class ApiError extends Error {
  fields: Record<string, string>;
  status: number;
  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function handle<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const d = data as { error?: string; fields?: Record<string, string> } | null;
    throw new ApiError(d?.error || `Request failed (${res.status})`, res.status, d?.fields);
  }
  return data as T;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handle<T>(res);
}

export async function apiSend<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}
