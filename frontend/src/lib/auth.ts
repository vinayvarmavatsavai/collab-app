import { apiRequest } from "./api";

const ACCESS_TOKEN_KEY = "accessToken";
const SESSION_ID_KEY = "sessionId";
const IDENTITY_KEY = "identity";

export type Identity = {
  id: string;
  email: string;
  username: string;
  type: string;
  onboardingCompleted: boolean;
  profileCompleteness: number;
};

export type SigninResponse = {
  accessToken: string;
  sessionId: string;
  identity: Identity;
};

export type SignupPayload = {
  email: string;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  phone: string;
  skills: string[];
  intent: string;
};

export type SigninPayload = {
  email: string;
  password: string;
};

export function saveAuthSession(data: SigninResponse) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(SESSION_ID_KEY, data.sessionId);
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(data.identity));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(IDENTITY_KEY);
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getSessionId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

export function getStoredIdentity(): Identity | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

export async function signin(payload: SigninPayload) {
  const result = await apiRequest<SigninResponse>("/auth/signin", {
    method: "POST",
    body: {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    },
  });

  saveAuthSession(result);
  return result;
}

export async function signup(payload: SignupPayload) {
  return apiRequest<{
    id: string;
    email: string;
    type: string;
  }>("/auth/signup/user", {
    method: "POST",
    body: {
      ...payload,
      email: payload.email.trim().toLowerCase(),
      username: payload.username.trim().toLowerCase(),
      firstname: payload.firstname.trim(),
      lastname: payload.lastname.trim(),
      phone: payload.phone.trim(),
    },
  });
}

export async function logout() {
  const sessionId = getSessionId();

  try {
    if (sessionId) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: { sessionId },
      });
    }
  } finally {
    clearAuthSession();
  }
}