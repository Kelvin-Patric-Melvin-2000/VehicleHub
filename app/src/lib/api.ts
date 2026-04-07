function getBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("VITE_API_URL is not set");
  return base;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return data as T;
}

export async function apiUploadFile(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiJson<{ url: string }>("/api/v1/documents/upload", {
    method: "POST",
    body: fd,
  });
}
