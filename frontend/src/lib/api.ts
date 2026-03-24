const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {} } = options;

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const authToken = token ?? getStoredAccessToken();

  const finalHeaders: Record<string, string> = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    method,
    credentials: "include",
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let message = "Something went wrong";

    if (typeof data === "object" && data !== null && "message" in data) {
      const rawMessage = (data as { message: unknown }).message;
      message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : String(rawMessage);
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    console.error(
      "API error details:",
      JSON.stringify(
        {
          endpoint: normalizedEndpoint,
          method,
          status: response.status,
          hasToken: Boolean(authToken),
          responseData: data,
        },
        null,
        2
      )
    );

    throw new Error(message);
  }

  return data as T;
}

export { API_BASE_URL };