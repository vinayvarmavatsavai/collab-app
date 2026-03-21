(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/navigation/BottomNav.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BottomNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-client] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/compass.js [app-client] (ecmascript) <export default as Compass>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-days.js [app-client] (ecmascript) <export default as CalendarDays>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-client] (ecmascript) <export default as MessageSquare>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const navItems = [
    {
        label: "Home",
        href: "/home",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"],
        match: [
            "/home"
        ]
    },
    {
        label: "Offerings",
        href: "/offerings",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"],
        match: [
            "/offerings"
        ]
    },
    {
        label: "Explore",
        href: "/explore",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$compass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Compass$3e$__["Compass"],
        match: [
            "/explore"
        ]
    },
    {
        label: "Events",
        href: "/events",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"],
        match: [
            "/events"
        ]
    },
    {
        label: "Messages",
        href: "/messages",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"],
        match: [
            "/messages"
        ]
    }
];
function isItemActive(pathname, item) {
    if (!pathname) return false;
    if (pathname === item.href) return true;
    if (item.match?.length) {
        return item.match.some((route)=>pathname.startsWith(route));
    }
    return false;
}
function BottomNav() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(5);
    if ($[0] !== "6b417a79fb972f1719850dc8cd909725b00535f59c9754ac0811a6b450de74d2") {
        for(let $i = 0; $i < 5; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "6b417a79fb972f1719850dc8cd909725b00535f59c9754ac0811a6b450de74d2";
    }
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    let t0;
    if ($[1] !== pathname) {
        t0 = navItems.map({
            "BottomNav[navItems.map()]": (item)=>{
                const Icon = item.icon;
                const active = isItemActive(pathname, item);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: item.href,
                    className: `sync-bottom-nav__item ${active ? "is-active" : ""}`,
                    "aria-current": active ? "page" : undefined,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "sync-bottom-nav__icon-wrap",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                className: "sync-bottom-nav__icon"
                            }, void 0, false, {
                                fileName: "[project]/src/app/navigation/BottomNav.tsx",
                                lineNumber: 64,
                                columnNumber: 209
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/navigation/BottomNav.tsx",
                            lineNumber: 64,
                            columnNumber: 164
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "sync-bottom-nav__label",
                            children: item.label
                        }, void 0, false, {
                            fileName: "[project]/src/app/navigation/BottomNav.tsx",
                            lineNumber: 64,
                            columnNumber: 258
                        }, this)
                    ]
                }, item.label, true, {
                    fileName: "[project]/src/app/navigation/BottomNav.tsx",
                    lineNumber: 64,
                    columnNumber: 16
                }, this);
            }
        }["BottomNav[navItems.map()]"]);
        $[1] = pathname;
        $[2] = t0;
    } else {
        t0 = $[2];
    }
    let t1;
    if ($[3] !== t0) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: "sync-bottom-nav",
            "aria-label": "Bottom Navigation",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "sync-bottom-nav__inner",
                children: t0
            }, void 0, false, {
                fileName: "[project]/src/app/navigation/BottomNav.tsx",
                lineNumber: 74,
                columnNumber: 74
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/navigation/BottomNav.tsx",
            lineNumber: 74,
            columnNumber: 10
        }, this);
        $[3] = t0;
        $[4] = t1;
    } else {
        t1 = $[4];
    }
    return t1;
}
_s(BottomNav, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = BottomNav;
var _c;
__turbopack_context__.k.register(_c, "BottomNav");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/chatbot/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OfferingsChatbot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-circle.js [app-client] (ecmascript) <export default as MessageCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function getPriceNumber(price) {
    if (typeof price === "number") return price;
    return Number(String(price).replace(/[^\d]/g, "") || 0);
}
function formatPrice(price) {
    const value = getPriceNumber(price);
    return `₹${value.toLocaleString("en-IN")}`;
}
function detectCategory(input) {
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
function detectCity(input) {
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
function detectExperience(input) {
    if (/(senior|experienced|expert|experts)/i.test(input)) return "senior";
    if (/(mid|intermediate)/i.test(input)) return "mid";
    if (/(junior|beginner|fresher)/i.test(input)) return "junior";
    return "";
}
function detectBudgetCap(input) {
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
function detectIntent(input) {
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
function parseIntent(rawOfferings = [], message) {
    const offerings = Array.isArray(rawOfferings) ? rawOfferings : [];
    const input = message.toLowerCase().trim();
    const filters = {
        category: detectCategory(input),
        city: detectCity(input),
        experience: detectExperience(input),
        budget: "",
        intent: detectIntent(input)
    };
    const budgetCap = detectBudgetCap(input);
    if (budgetCap !== null) {
        filters.budget = String(budgetCap);
    }
    let results = [
        ...offerings
    ];
    if (filters.category) {
        results = results.filter((item)=>item.category === filters.category);
    }
    if (filters.city) {
        results = results.filter((item)=>item.city === filters.city);
    }
    if (filters.experience) {
        results = results.filter((item)=>item.experience === filters.experience);
    }
    if (budgetCap !== null) {
        results = results.filter((item)=>getPriceNumber(item.price) <= budgetCap);
    }
    if (filters.intent === "affordable") {
        results = results.sort((a, b)=>getPriceNumber(a.price) - getPriceNumber(b.price));
    } else if (filters.intent === "reliable") {
        results = results.sort((a, b)=>(b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0));
    } else if (filters.intent === "top-rated") {
        results = results.sort((a, b)=>b.rating - a.rating);
    }
    const noDetectedFilters = !filters.category && !filters.city && !filters.experience && !filters.budget && !filters.intent;
    if (noDetectedFilters) {
        const fallback = offerings.slice().sort((a, b)=>b.rating - a.rating).slice(0, 6);
        return {
            items: fallback,
            filters,
            reply: "I can help with service type, city, budget, experience, reliability score, and top-rated providers. Try something like web developers in Pune under 20k."
        };
    }
    if (results.length === 0) {
        const fallback = offerings.slice().sort((a, b)=>b.rating - a.rating).slice(0, 6);
        return {
            items: fallback,
            filters,
            reply: "I couldn’t find an exact match for that combination, so I’ve shown a few strong alternatives. You can also relax budget, city, or experience filters."
        };
    }
    const pieces = [];
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
        reply
    };
}
function OfferingsChatbot(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(26);
    if ($[0] !== "2e6da5ebc312e3aaa4d9175693263ef3e898bb0bded8b0ef5a9327b659f82717") {
        for(let $i = 0; $i < 26; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "2e6da5ebc312e3aaa4d9175693263ef3e898bb0bded8b0ef5a9327b659f82717";
    }
    const { offerings: t1, onResultSelect, onFiltersDetected, hideFloatingButton: t2, forceOpen: t3, onClose } = t0;
    let t4;
    if ($[1] !== t1) {
        t4 = t1 === undefined ? [] : t1;
        $[1] = t1;
        $[2] = t4;
    } else {
        t4 = $[2];
    }
    const offerings = t4;
    const hideFloatingButton = t2 === undefined ? false : t2;
    const forceOpen = t3 === undefined ? false : t3;
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(forceOpen);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    let t5;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = [
            {
                id: "bot-1",
                role: "bot",
                text: "Hi! Ask for web developers, app teams, designers, AI providers, backend experts, or budget-friendly options."
            }
        ];
        $[3] = t5;
    } else {
        t5 = $[3];
    }
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(t5);
    let t6;
    let t7;
    if ($[4] !== forceOpen) {
        t6 = ({
            "OfferingsChatbot[useEffect()]": ()=>{
                if (forceOpen) {
                    setIsOpen(true);
                }
            }
        })["OfferingsChatbot[useEffect()]"];
        t7 = [
            forceOpen
        ];
        $[4] = forceOpen;
        $[5] = t6;
        $[6] = t7;
    } else {
        t6 = $[5];
        t7 = $[6];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t6, t7);
    let t8;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = [
            "Find web developers in Chennai",
            "Affordable app developers under 20k",
            "Top rated AI teams in Pune",
            "Reliable backend developers in Mumbai"
        ];
        $[7] = t8;
    } else {
        t8 = $[7];
    }
    const suggestions = t8;
    let t9;
    if ($[8] !== input || $[9] !== offerings || $[10] !== onFiltersDetected || $[11] !== onResultSelect) {
        t9 = ({
            "OfferingsChatbot[sendMessage]": (messageText)=>{
                const finalMessage = (messageText ?? input).trim();
                if (!finalMessage) {
                    return;
                }
                const safeOfferings = Array.isArray(offerings) ? offerings : [];
                const userMessage = {
                    id: `user-${Date.now()}`,
                    role: "user",
                    text: finalMessage
                };
                const result = parseIntent(safeOfferings, finalMessage);
                const botMessage = {
                    id: `bot-${Date.now() + 1}`,
                    role: "bot",
                    text: result.reply
                };
                setMessages({
                    "OfferingsChatbot[sendMessage > setMessages()]": (prev)=>[
                            ...prev,
                            userMessage,
                            botMessage
                        ]
                }["OfferingsChatbot[sendMessage > setMessages()]"]);
                setInput("");
                onFiltersDetected?.(result.filters);
                onResultSelect?.(result.items);
            }
        })["OfferingsChatbot[sendMessage]"];
        $[8] = input;
        $[9] = offerings;
        $[10] = onFiltersDetected;
        $[11] = onResultSelect;
        $[12] = t9;
    } else {
        t9 = $[12];
    }
    const sendMessage = t9;
    let t10;
    if ($[13] !== onClose) {
        t10 = ({
            "OfferingsChatbot[handleClose]": ()=>{
                setIsOpen(false);
                onClose?.();
            }
        })["OfferingsChatbot[handleClose]"];
        $[13] = onClose;
        $[14] = t10;
    } else {
        t10 = $[14];
    }
    const handleClose = t10;
    let t11;
    if ($[15] !== hideFloatingButton) {
        t11 = !hideFloatingButton && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: {
                "OfferingsChatbot[<button>.onClick]": ()=>setIsOpen(true)
            }["OfferingsChatbot[<button>.onClick]"],
            className: "fixed bottom-28 right-5 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-[0_10px_30px_rgba(139,92,246,0.45)]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageCircle$3e$__["MessageCircle"], {
                size: 24
            }, void 0, false, {
                fileName: "[project]/src/app/chatbot/page.tsx",
                lineNumber: 325,
                columnNumber: 214
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/chatbot/page.tsx",
            lineNumber: 323,
            columnNumber: 34
        }, this);
        $[15] = hideFloatingButton;
        $[16] = t11;
    } else {
        t11 = $[16];
    }
    let t12;
    if ($[17] !== handleClose || $[18] !== input || $[19] !== isOpen || $[20] !== messages || $[21] !== sendMessage) {
        t12 = isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-x-3 bottom-24 top-16 z-[10000] overflow-hidden rounded-[28px] border border-white/10 bg-[#0D0D0D]/95 text-white shadow-2xl backdrop-blur-xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between border-b border-white/10 px-4 py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex h-11 w-11 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#C4B5FD]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/chatbot/page.tsx",
                                        lineNumber: 333,
                                        columnNumber: 421
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/chatbot/page.tsx",
                                    lineNumber: 333,
                                    columnNumber: 317
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-[17px] font-semibold leading-none",
                                            children: "Offerings Assistant"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/chatbot/page.tsx",
                                            lineNumber: 333,
                                            columnNumber: 454
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-1 text-xs text-white/55",
                                            children: "Guided provider discovery"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/chatbot/page.tsx",
                                            lineNumber: 333,
                                            columnNumber: 533
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/chatbot/page.tsx",
                                    lineNumber: 333,
                                    columnNumber: 449
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/chatbot/page.tsx",
                            lineNumber: 333,
                            columnNumber: 276
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: handleClose,
                            className: "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/75",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/app/chatbot/page.tsx",
                                lineNumber: 333,
                                columnNumber: 754
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/chatbot/page.tsx",
                            lineNumber: 333,
                            columnNumber: 616
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/chatbot/page.tsx",
                    lineNumber: 333,
                    columnNumber: 190
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex h-[calc(100%-80px)] flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 overflow-y-auto px-4 pb-3 pt-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: messages.map(_OfferingsChatbotMessagesMap)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/chatbot/page.tsx",
                                    lineNumber: 333,
                                    columnNumber: 890
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 flex flex-wrap gap-2",
                                    children: suggestions.map({
                                        "OfferingsChatbot[suggestions.map()]": (suggestion)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: {
                                                    "OfferingsChatbot[suggestions.map() > <button>.onClick]": ()=>sendMessage(suggestion)
                                                }["OfferingsChatbot[suggestions.map() > <button>.onClick]"],
                                                className: "rounded-full border border-white/10 bg-transparent px-4 py-2 text-[13px] text-white/90 transition hover:bg-white/8",
                                                children: suggestion
                                            }, suggestion, false, {
                                                fileName: "[project]/src/app/chatbot/page.tsx",
                                                lineNumber: 334,
                                                columnNumber: 68
                                            }, this)
                                    }["OfferingsChatbot[suggestions.map()]"])
                                }, void 0, false, {
                                    fileName: "[project]/src/app/chatbot/page.tsx",
                                    lineNumber: 333,
                                    columnNumber: 967
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/chatbot/page.tsx",
                            lineNumber: 333,
                            columnNumber: 835
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border-t border-white/10 px-4 py-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: input,
                                        onChange: {
                                            "OfferingsChatbot[<input>.onChange]": (e)=>setInput(e.target.value)
                                        }["OfferingsChatbot[<input>.onChange]"],
                                        onKeyDown: {
                                            "OfferingsChatbot[<input>.onKeyDown]": (e_0)=>{
                                                if (e_0.key === "Enter") {
                                                    sendMessage();
                                                }
                                            }
                                        }["OfferingsChatbot[<input>.onKeyDown]"],
                                        placeholder: "Ask by skill, city, budget, rating...",
                                        className: "w-full bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/35"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/chatbot/page.tsx",
                                        lineNumber: 337,
                                        columnNumber: 217
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: {
                                            "OfferingsChatbot[<button>.onClick]": ()=>sendMessage()
                                        }["OfferingsChatbot[<button>.onClick]"],
                                        className: "flex h-11 w-11 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-[0_8px_24px_rgba(139,92,246,0.38)]",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                                            size: 17
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/chatbot/page.tsx",
                                            lineNumber: 347,
                                            columnNumber: 188
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/chatbot/page.tsx",
                                        lineNumber: 345,
                                        columnNumber: 206
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/chatbot/page.tsx",
                                lineNumber: 337,
                                columnNumber: 119
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/chatbot/page.tsx",
                            lineNumber: 337,
                            columnNumber: 67
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/chatbot/page.tsx",
                    lineNumber: 333,
                    columnNumber: 784
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/chatbot/page.tsx",
            lineNumber: 333,
            columnNumber: 21
        }, this);
        $[17] = handleClose;
        $[18] = input;
        $[19] = isOpen;
        $[20] = messages;
        $[21] = sendMessage;
        $[22] = t12;
    } else {
        t12 = $[22];
    }
    let t13;
    if ($[23] !== t11 || $[24] !== t12) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                t11,
                t12
            ]
        }, void 0, true);
        $[23] = t11;
        $[24] = t12;
        $[25] = t13;
    } else {
        t13 = $[25];
    }
    return t13;
}
_s(OfferingsChatbot, "kJXh43HSg1sV6+Qbb5ITnq/ctaA=");
_c = OfferingsChatbot;
function _OfferingsChatbotMessagesMap(message) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `max-w-[86%] rounded-[22px] px-4 py-3 text-[15px] leading-6 ${message.role === "user" ? "ml-auto rounded-br-md bg-[#8B5CF6] text-white" : "rounded-bl-md bg-white/10 text-white"}`,
        children: message.text
    }, message.id, false, {
        fileName: "[project]/src/app/chatbot/page.tsx",
        lineNumber: 369,
        columnNumber: 10
    }, this);
}
var _c;
__turbopack_context__.k.register(_c, "OfferingsChatbot");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/offerings/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OfferingsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$iconify$2f$react$2f$dist$2f$iconify$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@iconify/react/dist/iconify.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$navigation$2f$BottomNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/navigation/BottomNav.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$chatbot$2f$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/chatbot/page.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function OfferingsPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [allData, setAllData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OfferingsPage.useEffect": ()=>{
            const loadOfferings = {
                "OfferingsPage.useEffect.loadOfferings": async ()=>{
                    try {
                        setLoading(true);
                        const res = await fetch("/api/offerings/search");
                        if (!res.ok) {
                            const text = await res.text();
                            console.error("API ERROR RESPONSE:", text);
                            return;
                        }
                        const json = await res.json();
                        setAllData(Array.isArray(json) ? json : []);
                    } catch (error) {
                        console.error("Failed to load offerings:", error);
                    } finally{
                        setLoading(false);
                    }
                }
            }["OfferingsPage.useEffect.loadOfferings"];
            loadOfferings();
        }
    }["OfferingsPage.useEffect"], []);
    const handleSearch = ()=>{
        const finalQuery = query.trim();
        if (!finalQuery) {
            router.push("/offerings/results");
            return;
        }
        router.push(`/offerings/results?q=${encodeURIComponent(finalQuery)}`);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-screen w-full overflow-hidden bg-black text-white sync-page-with-bottom-nav",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                className: "absolute inset-0 h-full w-full object-cover",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("source", {
                        src: "/videos/offerings-bg.mp4",
                        type: "video/mp4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/offerings/page.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    "Your browser does not support the video tag."
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/offerings/page.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-black/45"
            }, void 0, false, {
                fileName: "[project]/src/app/offerings/page.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 mx-auto flex h-full w-full max-w-[480px] flex-col px-4 pb-6 pt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 flex items-start justify-between gap-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-[2rem] font-bold leading-none tracking-[-0.03em] text-white",
                            children: "Offerings"
                        }, void 0, false, {
                            fileName: "[project]/src/app/offerings/page.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/offerings/page.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-6 max-w-full text-[0.95rem] leading-7 text-white/72",
                        children: "Browse the ecosystem enterprise and discover teams, offerings, and opportunities that match your interests."
                    }, void 0, false, {
                        fileName: "[project]/src/app/offerings/page.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mx-auto w-full max-w-[420px]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 rounded-full border border-white bg-white px-4 py-3 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                            size: 18,
                                            className: "text-black"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/offerings/page.tsx",
                                            lineNumber: 79,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: query,
                                            onChange: (e)=>setQuery(e.target.value),
                                            onKeyDown: (e_0)=>{
                                                if (e_0.key === "Enter") {
                                                    handleSearch();
                                                }
                                            },
                                            placeholder: "Search for Offerings and Teams",
                                            className: "w-full text-sm text-black outline-none placeholder:text-black"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/offerings/page.tsx",
                                            lineNumber: 80,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/offerings/page.tsx",
                                    lineNumber: 78,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleSearch,
                                    className: "mt-4 w-full rounded-full bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20",
                                    children: "Explore Offerings"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/offerings/page.tsx",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/offerings/page.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/offerings/page.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1"
                    }, void 0, false, {
                        fileName: "[project]/src/app/offerings/page.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setIsOpen(true),
                        className: "absolute bottom-[20px] right-[18px] z-30 rounded-full p-4 shadow-lg !bg-white !text-black",
                        "aria-label": "Open AI assistant",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$iconify$2f$react$2f$dist$2f$iconify$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                                icon: "material-symbols:support-agent-rounded",
                                width: "30",
                                height: "30",
                                className: "!text-black"
                            }, void 0, false, {
                                fileName: "[project]/src/app/offerings/page.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white",
                                children: "?"
                            }, void 0, false, {
                                fileName: "[project]/src/app/offerings/page.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/offerings/page.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/offerings/page.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            isOpen && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$chatbot$2f$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                offerings: allData,
                hideFloatingButton: true,
                forceOpen: true,
                onClose: ()=>setIsOpen(false),
                onResultSelect: (items)=>{
                    setIsOpen(false);
                    const first = items[0];
                    if (first?.category) {
                        router.push(`/offerings/results?q=${encodeURIComponent(first.category)}`);
                        return;
                    }
                    if (query.trim()) {
                        router.push(`/offerings/results?q=${encodeURIComponent(query.trim())}`);
                        return;
                    }
                    router.push("/offerings/results");
                }
            }, void 0, false, {
                fileName: "[project]/src/app/offerings/page.tsx",
                lineNumber: 103,
                columnNumber: 30
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$navigation$2f$BottomNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/offerings/page.tsx",
                lineNumber: 117,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/offerings/page.tsx",
        lineNumber: 56,
        columnNumber: 10
    }, this);
}
_s(OfferingsPage, "aq27wt7X8Dghg/Cq8rpv5Of+nqw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = OfferingsPage;
var _c;
__turbopack_context__.k.register(_c, "OfferingsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_427a9c90._.js.map