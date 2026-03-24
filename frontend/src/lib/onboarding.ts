import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export type TagSuggestion = {
  value: string; // could be UUID OR canonical name
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

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeTag(value: string): string {
  const raw = clean(value);
  const lower = raw.toLowerCase();

  const map: Record<string, string> = {
    // skills
    reactjs: "React",
    react: "React",

    vuejs: "Vue.js",
    "vue js": "Vue.js",
    "vue.js": "Vue.js",

    nodejs: "Node.js",
    "node js": "Node.js",
    "node.js": "Node.js",

    nextjs: "Next.js",
    "next js": "Next.js",
    "next.js": "Next.js",

    nestjs: "NestJS",
    "nest js": "NestJS",

    expressjs: "Express",
    "express js": "Express",

    "c plus plus": "C++",
    cplusplus: "C++",
    "c++": "C++",

    "c sharp": "C#",
    csharp: "C#",
    "c#": "C#",

    // roles
    "frontend developer": "Frontend Developer",
    "backend developer": "Backend Developer",
    "full stack developer": "Full Stack Developer",
    "mobile developer": "Mobile Developer",
    "devops engineer": "DevOps Engineer",
    founder: "Founder",
    "ui/ux designer": "UI/UX Designer",
    "product manager": "Product Manager",
    "data scientist": "Data Scientist",
    "machine learning engineer": "Machine Learning Engineer",

    // domains
    "web development": "Web Development",
    "mobile app development": "Mobile App Development",
    "cloud computing": "Cloud Computing",
    "data analysis": "Data Analysis",
    "digital marketing": "Digital Marketing",
    "artificial intelligence": "Artificial Intelligence",
    "blockchain & web3": "Blockchain & Web3",
    blockchain: "Blockchain",
    cybersecurity: "Cybersecurity",
    fintech: "FinTech",
    healthtech: "HealthTech",
    edtech: "EdTech",
    saas: "SaaS",

    // availability
    "full time": "Full-time",
    "full-time": "Full-time",
    "part time": "Part-time",
    "part-time": "Part-time",
    weekends: "Weekends",
    flexible: "Flexible",
  };

  return map[lower] ?? raw;
}

function normalizeSelectedTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => normalizeTag(tag))
        .filter((tag) => tag.length > 0)
    )
  );
}

export async function answerOnboarding(payload: OnboardingAnswerPayload) {
  const token = getAccessToken();

  const fixedPayload: OnboardingAnswerPayload = {
    ...payload,
    selectedTags: normalizeSelectedTags(payload.selectedTags),
    textInput: clean(payload.textInput || ""),
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