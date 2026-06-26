let isLoggingOut = false;
let originalFetch: typeof window.fetch | null = null;

export function initFetchInterceptor(onUnauthorized: () => void) {
  if (originalFetch) return;
  originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch!(input, init);
    if (response.status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      setTimeout(() => {
        onUnauthorized();
        isLoggingOut = false;
      }, 0);
    }
    return response;
  };
}

export function destroyFetchInterceptor() {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}

export function isTokenExpired(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string>),
  };
  return fetch(input, { ...init, headers });
}
