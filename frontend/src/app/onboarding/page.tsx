"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { getStoredIdentity } from "@/lib/auth";
import {
  answerOnboarding,
  skipOnboarding,
  startOnboarding,
  syncOnboardingToProfile,
  type OnboardingQuestionResponse,
  type TagSuggestion,
} from "@/lib/onboarding";

type Msg =
  | { id: string; kind: "intro"; text: string }
  | { id: string; kind: "botText"; text: string }
  | {
      id: string;
      kind: "botQuestion";
      title: string;
      helper?: string;
      field?: string;
      tags?: TagSuggestion[];
      optional?: boolean;
      step?: number;
      totalSteps?: number;
    }
  | { id: string; kind: "user"; text: string };

function uid(prefix = "m") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function fieldHelper(field: string) {
  switch (field) {
    case "primary_role":
      return "Choose your main role, or type your own.";
    case "roles":
      return "Add any additional roles if relevant.";
    case "domains":
      return "Select the areas you work in.";
    case "skills":
      return "Select your strongest skills, or type custom ones.";
    case "interests":
      return "Share what interests you most.";
    case "availability":
      return "Choose your availability, or type your own.";
    default:
      return "";
  }
}

function getTagLabel(tag: TagSuggestion): string {
  const maybeLabel =
    (tag as TagSuggestion & { label?: string }).label ||
    (tag as TagSuggestion & { name?: string }).name ||
    tag.value;

  return maybeLabel;
}

function getTagSubmitValue(tag: TagSuggestion): string {
  return tag.value;
}

function selectionToText(
  selectedValues: string[],
  selectedLabels: string[],
  textInput: string
) {
  const tagPart = selectedLabels.join(", ");
  const textPart = textInput.trim();

  if (tagPart && textPart) return `${tagPart} | ${textPart}`;
  if (tagPart) return tagPart;
  if (textPart) return textPart;
  return selectedValues.join(", ");
}

function isCompleteResponse(
  value: unknown
): value is { complete: true; profile: unknown; completenessPercentage: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "complete" in value &&
    (value as { complete?: boolean }).complete === true
  );
}

export default function ProfileBuilderPage() {
  const router = useRouter();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [currentQuestion, setCurrentQuestion] =
    useState<OnboardingQuestionResponse | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      kind: "intro",
      text: "Profile setup — answer a few guided questions to build your public SphereNet profile.",
    },
  ]);

  const activeStep = useMemo(() => {
    if (done && currentQuestion?.totalSteps) return currentQuestion.totalSteps;
    return currentQuestion?.step ?? 1;
  }, [done, currentQuestion]);

  const totalSteps = currentQuestion?.totalSteps ?? 6;

  const selectedTagLabels = useMemo(() => {
    const tags = currentQuestion?.tags || [];
    const labelMap = new Map<string, string>();

    tags.forEach((tag) => {
      labelMap.set(getTagSubmitValue(tag), getTagLabel(tag));
    });

    return selectedTags.map((value) => labelMap.get(value) || value);
  }, [currentQuestion, selectedTags]);

  useEffect(() => {
    const identity = getStoredIdentity();
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (!identity || !token) {
      router.replace("/auth/login");
      return;
    }

    if (identity.onboardingCompleted) {
      router.replace("/home");
      return;
    }

    async function init() {
      try {
        const result = await startOnboarding();

        setCurrentQuestion(result);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            kind: "botQuestion",
            title: result.question,
            helper: fieldHelper(result.field),
            field: result.field,
            tags: result.tags,
            optional: result.optional,
            step: result.step,
            totalSteps: result.totalSteps,
          },
        ]);
      } catch (error) {
        console.error("Failed to start onboarding", error);
        setPageError("Session expired or unauthorized. Please log in again.");
        router.replace("/auth/login");
      }
    }

    void init();
  }, [router]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const scrollToBottom = () => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    };

    const raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      const raf2 = requestAnimationFrame(() => {
        scrollToBottom();
      });
      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [messages, selectedTags, pageError]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 110) + "px";
  }, [input]);

  function addUser(text: string) {
    setMessages((prev) => [...prev, { id: uid(), kind: "user", text }]);
  }

  function addBotText(text: string) {
    setMessages((prev) => [...prev, { id: uid(), kind: "botText", text }]);
  }

  function addBotQuestion(q: OnboardingQuestionResponse) {
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        kind: "botQuestion",
        title: q.question,
        helper: fieldHelper(q.field),
        field: q.field,
        tags: q.tags,
        optional: q.optional,
        step: q.step,
        totalSteps: q.totalSteps,
      },
    ]);
  }

  function toggleTag(tagValue: string) {
    setSelectedTags((prev) =>
      prev.includes(tagValue)
        ? prev.filter((item) => item !== tagValue)
        : [...prev, tagValue]
    );
  }

  async function handleSubmit() {
    if (!currentQuestion || done || isBusy) return;

    const textInput = input.trim();

    if (selectedTags.length === 0 && !textInput) {
      setPageError("Select at least one tag or type an answer.");
      return;
    }

    setIsBusy(true);
    setPageError("");

    const summary = selectionToText(selectedTags, selectedTagLabels, textInput);
    addUser(summary || "Answered");

    try {
      const result = await answerOnboarding({
        selectedTags,
        textInput,
      });

      setSelectedTags([]);
      setInput("");

      if (isCompleteResponse(result)) {
        setDone(true);

        try {
          await syncOnboardingToProfile();
        } catch (syncError) {
          console.error("Sync failed", syncError);
        }

        const identity = getStoredIdentity();
        if (identity) {
          localStorage.setItem(
            "identity",
            JSON.stringify({ ...identity, onboardingCompleted: true })
          );
        }

        addBotText("✅ All set. Your onboarding is complete. Tap Continue →");
        return;
      }

      setCurrentQuestion(result);
      addBotQuestion(result);
    } catch (error) {
      console.error("Failed to submit onboarding answer", error);
      setPageError("Could not save your answer. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSkip() {
    if (!currentQuestion?.optional || done || isBusy) return;

    setIsBusy(true);
    setPageError("");

    try {
      addUser("Skipped");

      const result = await skipOnboarding();

      if (isCompleteResponse(result)) {
        setDone(true);

        try {
          await syncOnboardingToProfile();
        } catch (syncError) {
          console.error("Sync failed", syncError);
        }

        const identity = getStoredIdentity();
        if (identity) {
          localStorage.setItem(
            "identity",
            JSON.stringify({ ...identity, onboardingCompleted: true })
          );
        }

        addBotText("✅ All set. Your onboarding is complete. Tap Continue →");
        return;
      }

      setCurrentQuestion(result);
      addBotQuestion(result);
    } catch (error) {
      console.error("Skip failed", error);
      setPageError("Could not skip this step. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleContinue() {
    if (!done) return;
    router.push("/home");
  }

  return (
    <div className="h-dvh overflow-hidden bg-[var(--app-bg)] text-[var(--text-main)]">
      <div className="sticky top-0 z-30 bg-[var(--surface-solid)]">
        <div className="mx-auto w-full max-w-[480px] px-4 py-4">
          <div className="min-w-0">
            <div className="text-[1.15rem] font-extrabold tracking-[-0.03em] text-[var(--text-main)]">
              Build your SphereNet profile
            </div>
            <div className="mt-1 text-sm text-[var(--text-muted-2)]">
              Step {activeStep} of {totalSteps}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        className="mx-auto h-[calc(100dvh-88px)] w-full max-w-[480px] overflow-y-auto px-4 pt-3 pb-[250px]"
      >
        <div className="space-y-4">
          {messages.map((m) => {
            if (m.kind === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[78%] break-words rounded-[20px] rounded-br-md bg-[var(--primary-btn-bg)] px-4 py-3 text-[15px] font-medium leading-6 text-[var(--primary-btn-text)] shadow-sm">
                    {m.text}
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className="flex items-start gap-2">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] shadow-sm">
                  <Icon
                    icon="material-symbols:support-agent-rounded"
                    width="18"
                    height="18"
                    className="text-[var(--text-main)]"
                  />
                </div>

                <div className="max-w-[78%]">
                  {m.kind === "intro" || m.kind === "botText" ? (
                    <div className="break-words rounded-[20px] rounded-bl-md border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-3 text-[15px] leading-6 text-[var(--text-main)] shadow-sm">
                      {m.text}
                    </div>
                  ) : (
                    <div className="rounded-[20px] rounded-bl-md border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-4 shadow-sm">
                      <div className="break-words text-[17px] font-bold leading-7 text-[var(--text-main)]">
                        {m.title}
                      </div>

                      {m.helper && (
                        <div className="mt-2 break-words text-sm leading-6 text-[var(--text-muted-2)]">
                          {m.helper}
                        </div>
                      )}

                      {m.tags && m.tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {m.tags.map((tag) => {
                            const submitValue = getTagSubmitValue(tag);
                            const displayLabel = getTagLabel(tag);
                            const active = selectedTags.includes(submitValue);

                            return (
                              <button
                                key={submitValue}
                                type="button"
                                onClick={() => toggleTag(submitValue)}
                                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                                  active
                                    ? "border-black bg-black text-white"
                                    : "border-[var(--line-soft)] bg-transparent text-[var(--text-main)]"
                                }`}
                              >
                                {displayLabel}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {m.optional ? (
                        <div className="mt-3 text-xs text-[var(--text-muted-2)]">
                          This step is optional.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {pageError ? (
            <div className="rounded-[18px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface-solid)]">
        <div className="mx-auto w-full max-w-[480px] px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="rounded-[22px] border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              disabled={done || isBusy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={
                isBusy
                  ? "Submitting..."
                  : "Type additional details or custom answer..."
              }
              rows={1}
              className="w-full resize-none bg-transparent text-[15px] leading-6 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted-2)]"
            />
          </div>

          <div className="mt-3 flex gap-3">
            {currentQuestion?.optional && !done ? (
              <button
                onClick={() => void handleSkip()}
                disabled={isBusy}
                className="h-12 flex-1 rounded-[18px] border border-[var(--line-soft)] bg-[var(--muted)] font-bold text-[var(--text-main)] shadow-sm disabled:opacity-50"
              >
                Skip
              </button>
            ) : null}

            {!done ? (
              <button
                onClick={() => void handleSubmit()}
                disabled={
                  isBusy || (selectedTags.length === 0 && input.trim().length === 0)
                }
                className="h-12 flex-1 rounded-[18px] bg-[var(--primary-btn-bg)] px-6 font-bold text-[var(--primary-btn-text)] shadow-sm disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="h-12 w-full rounded-[18px] bg-[var(--primary-btn-bg)] px-6 font-bold text-[var(--primary-btn-text)] shadow-sm"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}