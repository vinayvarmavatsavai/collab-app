import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export type TagSuggestion = {
  value: string; // could be UUID OR name
  label?: string; // display label
  source: "resume" | "predefined";
  category:
    | "domain"
    | "skill"
    | "experience"
    | "interest"
    | "availability"
    | "role";
};

export type OnboardingQuestionResponse = {
  question: string;
  field: string;
  tags: TagSuggestion[];
  optional: boolean;
  step: number;
  totalSteps: number;
  completenessPercentage: number;
};

export type OnboardingStatusResponse = {
  status: string;
  currentQuestion: string | null;
  profile: unknown;
  completenessPercentage: number;
};

export type OnboardingAnswerPayload = {
  selectedTags: string[];
  textInput: string;
};

export async function startOnboarding() {
  const token = getAccessToken();

  return apiRequest<OnboardingQuestionResponse>("/onboarding/start", {
    method: "POST",
    token,
  });
}

/**
 * 🔥 FIX: normalize skill names before sending
 */
function normalizeSkills(tags: string[]): string[] {
  return tags.map((t) => {
    const lower = t.toLowerCase();

    if (lower === "vuejs") return "Vue.js";
    if (lower === "reactjs") return "React";
    if (lower === "nodejs") return "Node.js";

    return t;
  });
}

export async function answerOnboarding(payload: OnboardingAnswerPayload) {
  const token = getAccessToken();

  const fixedPayload: OnboardingAnswerPayload = {
    ...payload,
    selectedTags: normalizeSkills(payload.selectedTags),
  };

  console.log("🔥 FIXED PAYLOAD:", fixedPayload);

  return apiRequest<
    | OnboardingQuestionResponse
    | { complete: true; profile: unknown; completenessPercentage: number }
  >("/onboarding/answer", {
    method: "POST",
    token,
    body: fixedPayload,
  });
}

export async function skipOnboarding() {
  const token = getAccessToken();

  return apiRequest<
    | OnboardingQuestionResponse
    | { complete: true; profile: unknown; completenessPercentage: number }
  >("/onboarding/skip", {
    method: "POST",
    token,
  });
}

export async function getOnboardingStatus() {
  const token = getAccessToken();

  return apiRequest<OnboardingStatusResponse>("/onboarding/status", {
    method: "GET",
    token,
  });
}

export async function syncOnboardingToProfile() {
  const token = getAccessToken();

  return apiRequest<{ success: boolean; message: string }>("/onboarding/sync", {
    method: "POST",
    token,
  });
}