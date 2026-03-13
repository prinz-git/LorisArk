export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ApiOptions = Omit<RequestInit, "headers"> & {
  token?: string | null;
  headers?: Record<string, string>;
};

export async function apiFetch<T>(
  path: string,
  { token, headers, ...options }: ApiOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (body && body.detail) ||
      (body && body.message) ||
      (typeof body === "string" && body) ||
      "Request failed";
    throw new Error(message);
  }

  return body as T;
}
