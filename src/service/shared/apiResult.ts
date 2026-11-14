export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export async function parseApiResponse<T>(res: Response): Promise<ActionResult<T>> {
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const errObj = parsed as { message?: string | string[]; code?: string } | null;
    const msg = Array.isArray(errObj?.message)
      ? errObj.message.join(', ')
      : errObj?.message || `Request failed (${res.status})`;
    return {
      ok: false,
      message: msg,
      status: res.status,
    };
  }

  return {
    ok: true,
    data: parsed as T,
    status: res.status,
  };
}
