const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("sessionId");
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      clearAuth();
      return false;
    }

    const data = await res.json();

    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }

    if (data?.sessionId) {
      localStorage.setItem("sessionId", data.sessionId);
    }

    return true;
  } catch {
    clearAuth();
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { skipAuth = false, headers, ...rest } = options;
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(skipAuth ? {} : token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const retriedToken = getAccessToken();

      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(retriedToken
            ? { Authorization: `Bearer ${retriedToken}` }
            : {}),
          ...(headers || {}),
        },
      });

      if (!retryResponse.ok) {
        const retryError = await safeJson(retryResponse);
        throw new Error(retryError?.message || "Request failed");
      }

      return retryResponse.json();
    }

    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorBody = await safeJson(response);
    throw new Error(errorBody?.message || "Request failed");
  }

  return response.json();
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}