"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";

type OfferingItem = {
  id: string;
  name: string;
  title: string;
  category?: string;
  city?: string;
  price: string | number;
  rating: number;
  experience?: string;
  reliabilityScore?: number;
  lat: number;
  lng: number;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

export type OfferingsFilterState = {
  category: string;
  city: string;
  experience: string;
  budget: string;
  intent: "" | "affordable" | "top-rated" | "reliable";
};

type OfferingsChatbotProps = {
  offerings?: OfferingItem[];
  onResultSelect?: (items: OfferingItem[]) => void;
  onFiltersDetected?: (filters: OfferingsFilterState) => void;
  hideFloatingButton?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
};

function getPriceNumber(price: string | number) {
  if (typeof price === "number") return price;
  return Number(String(price).replace(/[^\d]/g, "") || 0);
}

function formatPrice(price: string | number) {
  const value = getPriceNumber(price);
  return `₹${value.toLocaleString("en-IN")}`;
}

function detectCategory(input: string) {
  if (/(web|frontend|react|mern|full stack|fullstack|website|landing page)/i.test(input)) {
    return "web";
  }
  if (/(app|mobile|flutter|android|ios|cross platform)/i.test(input)) {
    return "app";
  }
  if (/(ui|ux|design|designer|branding|brand)/i.test(input)) {
    return "design";
  }
  if (/(ai|ml|machine learning|data science|automation|data|gen ai|generative ai|analytics)/i.test(input)) {
    return "ai";
  }
  if (/(backend|api|node|server|microservices)/i.test(input)) {
    return "backend";
  }
  if (/(devops|aws|cloud|infrastructure)/i.test(input)) {
    return "devops";
  }
  if (/(marketing|growth|seo|digital marketing|campaign)/i.test(input)) {
    return "marketing";
  }
  return "";
}

function detectCity(input: string) {
  if (/(bangalore|bengaluru)/i.test(input)) return "bangalore";
  if (/(chennai)/i.test(input)) return "chennai";
  if (/(hyderabad)/i.test(input)) return "hyderabad";
  if (/(mumbai)/i.test(input)) return "mumbai";
  if (/(delhi|new delhi)/i.test(input)) return "delhi";
  if (/(visakhapatnam|vizag)/i.test(input)) return "visakhapatnam";
  if (/(kochi|cochin)/i.test(input)) return "kochi";
  if (/(trivandrum|thiruvananthapuram)/i.test(input)) return "trivandrum";
  if (/(mangalore|mangaluru)/i.test(input)) return "mangalore";
  if (/(pune)/i.test(input)) return "pune";
  return "";
}

function detectExperience(input: string) {
  if (/(senior|experienced|expert|experts)/i.test(input)) return "senior";
  if (/(mid|intermediate)/i.test(input)) return "mid";
  if (/(junior|beginner|fresher)/i.test(input)) return "junior";
  return "";
}

function detectBudgetCap(input: string) {
  const normalized = input.toLowerCase();

  const underMatch = normalized.match(/under\s*₹?\s*(\d+)(k)?/i);
  if (underMatch) {
    const value = Number(underMatch[1]);
    return underMatch[2] ? value * 1000 : value;
  }

  const lessThanMatch = normalized.match(/less than\s*₹?\s*(\d+)(k)?/i);
  if (lessThanMatch) {
    const value = Number(lessThanMatch[1]);
    return lessThanMatch[2] ? value * 1000 : value;
  }

  const uptoMatch = normalized.match(/up to\s*₹?\s*(\d+)(k)?/i);
  if (uptoMatch) {
    const value = Number(uptoMatch[1]);
    return uptoMatch[2] ? value * 1000 : value;
  }

  const directKMatch = normalized.match(/₹?\s*(\d+)\s*k\b/i);
  if (directKMatch) {
    return Number(directKMatch[1]) * 1000;
  }

  if (/10k/i.test(normalized)) return 10000;
  if (/20k/i.test(normalized)) return 20000;
  if (/30k/i.test(normalized)) return 30000;
  if (/40k/i.test(normalized)) return 40000;
  if (/50k/i.test(normalized)) return 50000;

  return null;
}

function detectIntent(input: string): OfferingsFilterState["intent"] {
  if (/(cheap|budget|affordable|low cost|lowest)/i.test(input)) {
    return "affordable";
  }
  if (/(best|top|highest rated|top rated)/i.test(input)) {
    return "top-rated";
  }
  if (/(reliable|reliability|trusted|trustworthy)/i.test(input)) {
    return "reliable";
  }
  return "";
}

function parseIntent(rawOfferings: OfferingItem[] = [], message: string) {
  const offerings = Array.isArray(rawOfferings) ? rawOfferings : [];
  const input = message.toLowerCase().trim();

  const filters: OfferingsFilterState = {
    category: detectCategory(input),
    city: detectCity(input),
    experience: detectExperience(input),
    budget: "",
    intent: detectIntent(input),
  };

  const budgetCap = detectBudgetCap(input);
  if (budgetCap !== null) {
    filters.budget = String(budgetCap);
  }

  let results = [...offerings];

  if (filters.category) {
    results = results.filter((item) => item.category === filters.category);
  }

  if (filters.city) {
    results = results.filter((item) => item.city === filters.city);
  }

  if (filters.experience) {
    results = results.filter((item) => item.experience === filters.experience);
  }

  if (budgetCap !== null) {
    results = results.filter((item) => getPriceNumber(item.price) <= budgetCap);
  }

  if (filters.intent === "affordable") {
    results = results.sort(
      (a, b) => getPriceNumber(a.price) - getPriceNumber(b.price)
    );
  } else if (filters.intent === "reliable") {
    results = results.sort(
      (a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0)
    );
  } else if (filters.intent === "top-rated") {
    results = results.sort((a, b) => b.rating - a.rating);
  }

  const noDetectedFilters =
    !filters.category &&
    !filters.city &&
    !filters.experience &&
    !filters.budget &&
    !filters.intent;

  if (noDetectedFilters) {
    const fallback = offerings
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    return {
      items: fallback,
      filters,
      reply:
        "I can help with service type, city, budget, experience, reliability score, and top-rated providers. Try something like web developers in Pune under 20k.",
    };
  }

  if (results.length === 0) {
    const fallback = offerings
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    return {
      items: fallback,
      filters,
      reply:
        "I couldn’t find an exact match for that combination, so I’ve shown a few strong alternatives. You can also relax budget, city, or experience filters.",
    };
  }

  const pieces: string[] = [];

  if (filters.category) pieces.push(filters.category);
  if (filters.city) pieces.push(`in ${filters.city}`);
  if (filters.experience) pieces.push(`${filters.experience}-level`);

  const subject = pieces.length ? pieces.join(" ") : "providers";

  let reply = `I found ${results.length} ${subject} offering${results.length === 1 ? "" : "s"}.`;

  if (budgetCap !== null) {
    reply += ` All shown options are under ${formatPrice(budgetCap)}.`;
  } else if (filters.intent === "affordable") {
    reply += ` The lowest starts from ${formatPrice(results[0].price)}.`;
  } else if (filters.intent === "top-rated") {
    reply += ` The top match is rated ${results[0].rating} stars.`;
  } else if (filters.intent === "reliable") {
    reply += ` The best reliability score here is ${results[0].reliabilityScore ?? 0}.`;
  }

  return {
    items: results.slice(0, 10),
    filters,
    reply,
  };
}

export default function OfferingsChatbot({
  offerings = [],
  onResultSelect,
  onFiltersDetected,
  hideFloatingButton = false,
  forceOpen = false,
  onClose,
}: OfferingsChatbotProps) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bot-1",
      role: "bot",
      text: "Hi! Ask for web developers, app teams, designers, AI providers, backend experts, or budget-friendly options.",
    },
  ]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const suggestions = useMemo(
    () => [
      "Find web developers in Chennai",
      "Affordable app developers under 20k",
      "Top rated AI teams in Pune",
      "Reliable backend developers in Mumbai",
    ],
    []
  );

  const sendMessage = (messageText?: string) => {
    const finalMessage = (messageText ?? input).trim();
    if (!finalMessage) return;

    const safeOfferings = Array.isArray(offerings) ? offerings : [];

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: finalMessage,
    };

    const result = parseIntent(safeOfferings, finalMessage);

    const botMessage: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      role: "bot",
      text: result.reply,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");

    onFiltersDetected?.(result.filters);
    onResultSelect?.(result.items);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      {!hideFloatingButton && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-28 right-5 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-[0_10px_30px_rgba(139,92,246,0.45)]"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-x-3 bottom-24 top-16 z-[10000] overflow-hidden rounded-[28px] border border-white/10 bg-[#0D0D0D]/95 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD]">
                <Sparkles size={18} />
              </div>

              <div>
                <h3 className="text-[17px] font-semibold leading-none">
                  Offerings Assistant
                </h3>
                <p className="mt-1 text-xs text-white/55">
                  Guided provider discovery
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/75"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex h-[calc(100%-80px)] flex-col">
            <div className="flex-1 overflow-y-auto px-4 pb-3 pt-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[86%] rounded-[22px] px-4 py-3 text-[15px] leading-6 ${
                      message.role === "user"
                        ? "ml-auto rounded-br-md bg-[#8B5CF6] text-white"
                        : "rounded-bl-md bg-white/10 text-white"
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-[13px] text-white/90 transition hover:bg-white/8"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder="Ask by skill, city, budget, rating..."
                  className="w-full bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/35"
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-[0_8px_24px_rgba(139,92,246,0.38)]"
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}