// file: src/app/onboarding/profile-builder/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

type Question = {
  id: string;
  ask: string;
  helper?: string;
  example?: string;
};

type Msg =
  | { id: string; kind: "intro"; text: string }
  | { id: string; kind: "botText"; text: string }
  | { id: string; kind: "botQuestion"; title: string; helper?: string; example?: string }
  | { id: string; kind: "user"; text: string };

function uid(prefix = "m") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const QUESTIONS: Question[] = [
  {
    id: "about",
    ask: "Tell me brief about yourself, your goals and aspects.",
    helper: "Keep it short (3–5 lines).",
    example:
      "Example: I’m a final-year student focused on full-stack, aiming to build collaboration tools for universities.",
  },
  {
    id: "built",
    ask: "What have you built?",
    helper:
      "List 1–3 projects you have worked on. Briefly describe what you built and your role.",
    example:
      "Example: Built a task tracker — I owned UI, auth, and API integration.",
  },
  {
    id: "tools",
    ask: "What tools / technologies have you actually used?",
    helper:
      "Mention tools, frameworks, or technologies you’ve worked with hands-on.",
    example:
      "Example: React, Node.js, and Firebase for a mobile app project.",
  },
  {
    id: "innovate",
    ask: "What are you looking to innovate in next?",
    helper:
      "What problem area or domain do you want to innovate in over the next year?",
    example:
      "Example: Student collaboration, creator tools, career growth systems.",
  },
  {
    id: "collaborators",
    ask: "What kind of collaborators are you looking for?",
    helper:
      "When you start or join a project, what kind of expertise do you usually need?",
    example:
      "Example: UI/UX + backend + growth/content.",
  },
];

const SCRIPT_AFTER_INNOVATE =
  "I know you are a passionate builder looking to contribute to a lot of varied problem statements, but to help me understand your skills and aspirations clearly, I want a clear set of immediate goals.";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function ProfileBuilderPage() {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const total = QUESTIONS.length;

  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: uid(),
      kind: "intro",
      text: "Profile setup — answer a few questions to build your public SphereNet profile.",
    },
    {
      id: uid(),
      kind: "botQuestion",
      title: QUESTIONS[0].ask,
      helper: QUESTIONS[0].helper,
      example: QUESTIONS[0].example,
    },
  ]);

  const activeStep = useMemo(
    () => (done ? total : Math.min(qIndex + 1, total)),
    [done, qIndex, total]
  );

  useEffect(() => {
    const signupCompleted = localStorage.getItem("signupCompleted") === "true";

    if (!signupCompleted) {
      router.replace("/");
    }
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
  }, [messages, isTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 110) + "px";
  }, [input]);

  function addUser(text: string) {
    setMessages((p) => [...p, { id: uid(), kind: "user", text }]);
  }

  function addBotText(text: string) {
    setMessages((p) => [...p, { id: uid(), kind: "botText", text }]);
  }

  function addBotQuestion(q: Question) {
    setMessages((p) => [
      ...p,
      {
        id: uid(),
        kind: "botQuestion",
        title: q.ask,
        helper: q.helper,
        example: q.example,
      },
    ]);
  }

  function finish() {
    setDone(true);
    addBotText("✅ All set. Your profile draft is ready. Tap Continue →");
  }

  async function onSend() {
    if (done || isBusy) return;

    const text = input.trim();
    if (!text) return;

    const currentQuestion = QUESTIONS[qIndex];

    setIsBusy(true);
    addUser(text);
    setInput("");

    setAnswers((p) => ({ ...p, [currentQuestion.id]: text }));

    if (currentQuestion.id === "innovate") {
      setIsTyping(true);
      await sleep(600);
      addBotText("Everything. 😄");
      await sleep(700);
      addBotText(SCRIPT_AFTER_INNOVATE);
      setIsTyping(false);
    }

    const next = qIndex + 1;

    if (next < total) {
      await sleep(650);
      setQIndex(next);
      addBotQuestion(QUESTIONS[next]);
      setIsBusy(false);
      return;
    }

    await sleep(550);
    finish();
    setIsBusy(false);
  }

  function onContinue() {
    localStorage.setItem("profileCompleted", "true");
    localStorage.setItem("profileAnswers", JSON.stringify(answers));
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
              Step {activeStep} of {total}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        className="mx-auto h-[calc(100dvh-88px)] w-full max-w-[480px] overflow-y-auto px-4 pt-3 pb-[190px]"
      >
        <div className="space-y-4">
          {messages.map((m) => {
            if (m.kind === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[78%] rounded-[20px] rounded-br-md bg-[var(--primary-btn-bg)] px-4 py-3 text-[15px] font-medium leading-6 text-[var(--primary-btn-text)] shadow-sm break-words">
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
                    <div className="rounded-[20px] rounded-bl-md border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-3 text-[15px] leading-6 text-[var(--text-main)] shadow-sm break-words">
                      {m.text}
                    </div>
                  ) : (
                    <div className="rounded-[20px] rounded-bl-md border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-4 shadow-sm">
                      <div className="text-[17px] font-bold leading-7 text-[var(--text-main)] break-words">
                        {m.title}
                      </div>

                      {m.helper && (
                        <div className="mt-2 text-sm leading-6 text-[var(--text-muted-2)] break-words">
                          {m.helper}
                        </div>
                      )}

                      {m.example && (
                        <div className="mt-3 text-sm italic leading-7 text-[var(--text-soft-2)] break-words">
                          {m.example}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] shadow-sm">
                <Icon
                  icon="material-symbols:support-agent-rounded"
                  width="18"
                  height="18"
                  className="text-[var(--text-main)]"
                />
              </div>

              <div className="max-w-[78%] rounded-[20px] rounded-bl-md border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-3 text-sm italic text-[var(--text-muted-2)] shadow-sm">
                SphereGuide is typing...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface-solid)]">
        <div className="mx-auto w-full max-w-[480px] px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-[22px] border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                disabled={done || isBusy}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder={
                  isBusy
                    ? "SphereGuide is responding..."
                    : "Type your answer..."
                }
                rows={1}
                className="w-full resize-none bg-transparent text-[15px] leading-6 text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted-2)]"
              />
            </div>

            <button
              onClick={onSend}
              disabled={done || isBusy || input.trim().length === 0}
              className="h-12 shrink-0 rounded-[18px] bg-[var(--primary-btn-bg)] px-6 font-bold text-[var(--primary-btn-text)] shadow-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <button
            onClick={onContinue}
            className="mt-3 h-12 w-full rounded-[18px] border border-[var(--line-soft)] bg-[var(--muted)] font-bold text-[var(--text-main)] shadow-sm"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}