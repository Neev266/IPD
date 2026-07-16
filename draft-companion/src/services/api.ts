const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, params, ...extraOptions } = options;

  // Resolve query parameters
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Set up headers
  const reqHeaders = new Headers(headers);
  
  // Auto-attach JWT token if present
  const token = localStorage.getItem("token");
  if (token && !reqHeaders.has("Authorization")) {
    reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  // Handle request body
  let reqBody: any = body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    reqHeaders.set("Content-Type", "application/json");
    reqBody = JSON.stringify(body);
  }

  console.log(`[API] >>> ${method} ${url}`, body ? { body } : "");

  try {
    const response = await fetch(url, {
      method,
      headers: reqHeaders,
      body: reqBody,
      ...extraOptions,
    });

    console.log(`[API] <<< ${method} ${url} Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || errorData.message || `Request failed with status ${response.status}`;
      console.error(`[API] Error on ${method} ${url}:`, errorMsg, errorData);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    console.error(`[API] Connection failure on ${method} ${url}:`, error.message || error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>, options: RequestOptions = {}) =>
    request<T>(endpoint, { method: "GET", params, ...options }),

  post: <T>(endpoint: string, body?: any, options: RequestOptions = {}) =>
    request<T>(endpoint, { method: "POST", body, ...options }),

  delete: <T>(endpoint: string, params?: Record<string, string>, options: RequestOptions = {}) =>
    request<T>(endpoint, { method: "DELETE", params, ...options }),
};
