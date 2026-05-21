import { supabase } from "../lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function getApiUrl(path: string, params?: QueryParams) {
  if (!API_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = query.toString();

  return `${API_URL}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

async function getAccessToken(authErrorMessage: string) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(authErrorMessage);
  }

  return session.access_token;
}

async function getResponseError(response: Response, fallbackMessage: string) {
  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  authErrorMessage = "Log in again to continue.",
  params?: QueryParams,
) {
  const token = await getAccessToken(authErrorMessage);
  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);

  return fetch(getApiUrl(path, params), {
    ...options,
    headers,
  });
}

export async function apiGetJson<T>(
  path: string,
  params?: QueryParams,
  fallbackMessage = "Request failed.",
  authErrorMessage = "Log in again to continue.",
) {
  const response = await apiFetch(path, {}, authErrorMessage, params);

  if (!response.ok) {
    throw new Error(await getResponseError(response, fallbackMessage));
  }

  return (await response.json()) as T;
}
