async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const detail = body.detail;
    if (typeof detail === 'string' && detail) return detail;
    // FastAPI's automatic 422 validation errors shape `detail` as an array
    // of { msg, loc, ... } objects rather than a string.
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((e) => (typeof e === 'string' ? e : e.msg)).join(', ');
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function getJson<T>(url: string, fallbackError: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, fallbackError));
  }
  return res.json();
}

export async function postJson<T>(url: string, body: unknown, fallbackError: string): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, fallbackError));
  }
  return res.json();
}
