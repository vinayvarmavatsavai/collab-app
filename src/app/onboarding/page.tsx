// file: src/app/onboarding/profile-builder/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  // Guard routes
  useEffect(() => {
    const signupCompleted = localStorage.getItem("signupCompleted") === "true";
    const profileCompleted = localStorage.getItem("profileCompleted") === "true";

    if (!signupCompleted) {
      router.replace("/");
      return;
    }

    if (profileCompleted) {
      router.replace("/home");
    }
  }, [router]);

  // 🔥 Perfect auto-scroll
  useEffect(() => {
    const id = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => clearTimeout(id);
  }, [messages, isTyping]);

  // Auto resize textarea
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
    <div className="min-h-dvh bg-[#F4F6FB] text-slate-900">
      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-[18px] font-bold">
            Build your SphereNet profile
          </div>
          <div className="text-sm text-slate-500">
            Step {activeStep} of {total}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="px-4 pt-4 pb-[210px] space-y-4">
        {messages.map((m) => {
          if (m.kind === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl bg-[#2D6BFF] px-4 py-3 text-[15px] font-semibold text-white">
                  {m.text}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-[#2D6BFF]/15 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-[#2D6BFF]/40" />
              </div>

              <div className="max-w-[85%]">
                {m.kind === "intro" || m.kind === "botText" ? (
                  <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[15px] shadow-sm">
                    {m.text}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-slate-200 px-4 py-4 shadow-sm">
                    <div className="text-[17px] font-bold">
                      {m.title}
                    </div>
                    {m.helper && (
                      <div className="mt-2 text-sm text-slate-600">
                        {m.helper}
                      </div>
                    )}
                    {m.example && (
                      <div className="mt-3 text-sm text-slate-500 italic">
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
          <div className="text-sm text-slate-500 italic pl-12">
            SphereGuide is typing...
          </div>
        )}

        {/* Anchor for smooth scroll */}
        <div ref={bottomRef} />
      </div>

      {/* COMPOSER */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-3">
          <div className="flex-1 border border-slate-200 rounded-2xl px-4 py-3">
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
              className="w-full resize-none bg-transparent outline-none text-[15px]"
            />
          </div>

          <button
            onClick={onSend}
            disabled={done || isBusy || input.trim().length === 0}
            className="h-12 px-6 rounded-2xl bg-[#2D6BFF] text-white font-bold disabled:opacity-50"
          >
            Send
          </button>
        </div>

        <button
          onClick={onContinue}
          disabled={!done}
          className="mt-3 w-full h-12 rounded-2xl bg-slate-100 text-slate-800 font-bold disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}