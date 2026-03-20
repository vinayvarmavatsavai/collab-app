"use client";

import { useMemo, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Icon } from "@iconify/react";


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

type OfferingsChatbotProps = {
    offerings?: OfferingItem[];
    onResultSelect?: (items: OfferingItem[]) => void;
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
    if (/(web|frontend|react|mern|full stack|fullstack)/i.test(input)) {
        return "web";
    }
    if (/(app|mobile|flutter|android|ios)/i.test(input)) {
        return "app";
    }
    if (/(ui|ux|design|designer|branding)/i.test(input)) {
        return "design";
    }
    if (/(ai|ml|machine learning|data science|automation|data)/i.test(input)) {
        return "ai";
    }
    if (/(backend|api|node|server)/i.test(input)) {
        return "backend";
    }
    if (/(devops|aws|cloud)/i.test(input)) {
        return "devops";
    }
    if (/(marketing|growth|seo|digital marketing)/i.test(input)) {
        return "marketing";
    }
    return null;
}

function detectCity(input: string) {
    const cities = ["chennai", "bangalore", "hyderabad", "mumbai", "delhi"];
    return cities.find((city) => input.includes(city)) ?? null;
}

function detectExperience(input: string) {
    if (/(senior|experienced|expert|experts)/i.test(input)) {
        return "senior";
    }
    if (/(mid|intermediate)/i.test(input)) {
        return "mid";
    }
    if (/(junior|beginner|fresher)/i.test(input)) {
        return "junior";
    }
    return null;
}

function detectBudgetCap(input: string) {
    const underMatch = input.match(/under\s*₹?\s*(\d+)/i);
    if (underMatch) return Number(underMatch[1]);

    const lessThanMatch = input.match(/less than\s*₹?\s*(\d+)/i);
    if (lessThanMatch) return Number(lessThanMatch[1]);

    const uptoMatch = input.match(/up to\s*₹?\s*(\d+)/i);
    if (uptoMatch) return Number(uptoMatch[1]);

    if (/10k/i.test(input)) return 10000;
    if (/20k/i.test(input)) return 20000;
    if (/30k/i.test(input)) return 30000;
    if (/40k/i.test(input)) return 40000;
    if (/50k/i.test(input)) return 50000;

    return null;
}

function parseIntent(rawOfferings: OfferingItem[] = [], message: string) {
    const offerings = Array.isArray(rawOfferings) ? rawOfferings : [];
    const input = message.toLowerCase().trim();

    const category = detectCategory(input);
    const city = detectCity(input);
    const experience = detectExperience(input);
    const budgetCap = detectBudgetCap(input);

    const wantsAffordable =
        /(cheap|budget|affordable|low cost|lowest)/i.test(input);
    const wantsTopRated = /(best|top|highest rated|top rated)/i.test(input);
    const wantsReliable =
        /(reliable|reliability|trusted|trustworthy)/i.test(input);

    let results = [...offerings];

    if (category) {
        results = results.filter((item) => item.category === category);
    }

    if (city) {
        results = results.filter((item) => item.city === city);
    }

    if (experience) {
        results = results.filter((item) => item.experience === experience);
    }

    if (budgetCap !== null) {
        results = results.filter((item) => getPriceNumber(item.price) <= budgetCap);
    }

    if (wantsAffordable) {
        results = results.sort(
            (a, b) => getPriceNumber(a.price) - getPriceNumber(b.price)
        );
    } else if (wantsReliable) {
        results = results.sort(
            (a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0)
        );
    } else if (wantsTopRated) {
        results = results.sort((a, b) => b.rating - a.rating);
    }

    if (
        !category &&
        !city &&
        !experience &&
        budgetCap === null &&
        !wantsAffordable &&
        !wantsTopRated &&
        !wantsReliable
    ) {
        const fallback = offerings
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        return {
            items: fallback,
            reply:
                "I can help with service type, city, budget, experience, reliability score, and top-rated providers. I’ve shown strong matches on the map.",
        };
    }

    if (results.length === 0) {
        const fallback = offerings
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);

        return {
            items: fallback,
            reply:
                "I couldn’t find an exact match for that combination, so I’ve shown a few strong alternatives on the map.",
        };
    }

    const first = results[0];
    const pieces: string[] = [];

    if (category) pieces.push(category);
    if (city) pieces.push(`in ${city}`);
    if (experience) pieces.push(`${experience}-level`);

    const subject = pieces.length ? pieces.join(" ") : "providers";

    let reply = `I found ${results.length} ${subject} offerings.`;

    if (budgetCap !== null) {
        reply += ` All shown options are under ${formatPrice(budgetCap)}.`;
    } else if (wantsAffordable) {
        reply += ` The lowest starts from ${formatPrice(first.price)}.`;
    } else if (wantsTopRated) {
        reply += ` The top match is rated ${first.rating} stars.`;
    } else if (wantsReliable) {
        reply += ` The highest reliability score here is ${first.reliabilityScore ?? 0
            }.`;
    }

    return {
        items: results.slice(0, 10),
        reply,
    };
}

export default function OfferingsChatbot({
    offerings = [],
    onResultSelect,
}: OfferingsChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "bot-1",
            role: "bot",
            text: "Hi! Ask for web developers, app teams, designers, AI providers, backend experts, or budget-friendly options.",
        },
    ]);

    const suggestions = useMemo(
        () => [
            "Find web developers in Chennai",
            "Affordable app developers",
            "Top rated AI teams",
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
        onResultSelect?.(result.items);
    };

    return (
        <>

            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="absolute bottom-[20px] right-[18px] z-30 rounded-full p-4 shadow-lg !bg-white !text-black"
                aria-label="Open AI assistant"
            >
                <Icon
                    icon="material-symbols:support-agent-rounded"
                    width="30"
                    height="30"
                    className="!text-black"
                />
                <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white"
                >
                    ?
                </span>
            </button>

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
                            onClick={() => setIsOpen(false)}
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
                                        className={`max-w-[86%] rounded-[22px] px-4 py-3 text-[15px] leading-6 ${message.role === "user"
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