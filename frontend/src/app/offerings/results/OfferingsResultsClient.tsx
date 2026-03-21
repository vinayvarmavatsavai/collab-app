"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import OfferingsChatbot from "@/app/chatbot/page";
import BottomNav from "@/app/navigation/BottomNav";
import type { OfferingsFilterState } from "@/app/chatbot/page";

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

type FilterState = {
  category: string;
  city: string;
  experience: string;
  budget: string;
};

const OfferingsMap = dynamic(() => import("../OfferingsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black text-white">
      Loading map...
    </div>
  ),
});

function normalizeValue(value: string | number | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getBudgetLimit(budget: string) {
  if (!budget) return null;
  const parsed = Number(budget);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesInitialQuery(item: OfferingItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const searchable = [
    item.name,
    item.title,
    item.category,
    item.city,
    item.experience,
    item.price,
    item.rating,
    item.reliabilityScore,
  ]
    .map((value) => String(value ?? "").toLowerCase())
    .join(" ");

  return searchable.includes(q);
}

function applyFilters(items: OfferingItem[], filters: FilterState, query: string) {
  const budgetLimit = getBudgetLimit(filters.budget);

  return items.filter((item) => {
    if (!matchesInitialQuery(item, query)) return false;

    if (filters.category && normalizeValue(item.category) !== filters.category) {
      return false;
    }

    if (filters.city && normalizeValue(item.city) !== filters.city) {
      return false;
    }

    if (filters.experience && normalizeValue(item.experience) !== filters.experience) {
      return false;
    }

    if (budgetLimit !== null) {
      const numericPrice =
        typeof item.price === "number"
          ? item.price
          : Number(String(item.price).replace(/[^\d.]/g, ""));

      if (!Number.isFinite(numericPrice) || numericPrice > budgetLimit) {
        return false;
      }
    }

    return true;
  });
}

export default function OfferingsResultsClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [allData, setAllData] = useState<OfferingItem[]>([]);
  const [visibleData, setVisibleData] = useState<OfferingItem[]>([]);
  const [selected, setSelected] = useState<OfferingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    city: "",
    experience: "",
    budget: "",
  });

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/offerings/search");

        if (!res.ok) {
          const text = await res.text();
          console.error("API ERROR RESPONSE:", text);
          return;
        }

        const json = await res.json();
        const items = Array.isArray(json) ? json : [];
        setAllData(items);
      } catch (error) {
        console.error("Failed to load offerings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOfferings();
  }, []);

  useEffect(() => {
    const filtered = applyFilters(allData, filters, query);
    setVisibleData(filtered);

    if (selected) {
      const selectedStillVisible = filtered.some((item) => item.id === selected.id);
      if (!selectedStillVisible) {
        setSelected(null);
      }
    }
  }, [allData, filters, query, selected]);

  const titleText = useMemo(() => {
    if (!query.trim()) return "Showing all offerings";
    return query;
  }, [query]);

  const selectedProviderServices = useMemo(() => {
    if (!selected) return [];
    return visibleData.filter((item) => item.name === selected.name);
  }, [selected, visibleData]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(allData.map((item) => normalizeValue(item.category)).filter(Boolean))
    ).sort();
  }, [allData]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(allData.map((item) => normalizeValue(item.city)).filter(Boolean))
    ).sort();
  }, [allData]);

  const experienceOptions = useMemo(() => {
    return Array.from(
      new Set(allData.map((item) => normalizeValue(item.experience)).filter(Boolean))
    ).sort();
  }, [allData]);

  const hasActiveFilters =
    Boolean(filters.category) ||
    Boolean(filters.city) ||
    Boolean(filters.experience) ||
    Boolean(filters.budget);

  const clearFilters = () => {
    setFilters({
      category: "",
      city: "",
      experience: "",
      budget: "",
    });
    setSelected(null);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white sync-page-with-bottom-nav">
      <div className="absolute inset-0 z-0">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center bg-black text-white/75">
            Loading offerings...
          </div>
        ) : (
          <OfferingsMap
            data={visibleData}
            onSelect={(item: OfferingItem) => setSelected(item)}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[850] h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[850] h-28 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-[1000] px-4 pt-4">
        <div className="rounded-[24px] border border-white/10 bg-black/55 px-5 py-4 backdrop-blur-sm">
          <h1 className="text-xl font-semibold">Offerings</h1>
          <p className="text-sm text-white/70">
            {titleText} • {visibleData.length} result{visibleData.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 pb-1">
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm text-white outline-none backdrop-blur-sm"
            >
              <option value="" className="text-black">
                All categories
              </option>
              {categoryOptions.map((option) => (
                <option key={option} value={option} className="text-black">
                  {option}
                </option>
              ))}
            </select>

            <select
              value={filters.city}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, city: e.target.value }))
              }
              className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm text-white outline-none backdrop-blur-sm"
            >
              <option value="" className="text-black">
                All cities
              </option>
              {cityOptions.map((option) => (
                <option key={option} value={option} className="text-black">
                  {option}
                </option>
              ))}
            </select>

            <select
              value={filters.experience}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, experience: e.target.value }))
              }
              className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm text-white outline-none backdrop-blur-sm"
            >
              <option value="" className="text-black">
                All levels
              </option>
              {experienceOptions.map((option) => (
                <option key={option} value={option} className="text-black">
                  {option}
                </option>
              ))}
            </select>

            <select
              value={filters.budget}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, budget: e.target.value }))
              }
              className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-sm text-white outline-none backdrop-blur-sm"
            >
              <option value="" className="text-black">
                Any budget
              </option>
              <option value="10000" className="text-black">
                Up to ₹10,000
              </option>
              <option value="20000" className="text-black">
                Up to ₹20,000
              </option>
              <option value="30000" className="text-black">
                Up to ₹30,000
              </option>
              <option value="50000" className="text-black">
                Up to ₹50,000
              </option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-medium text-black"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {selected && selectedProviderServices.length > 0 && (
        <div className="absolute inset-x-0 bottom-24 z-[1100] px-4 animate-slideUp">
          <div className="rounded-[28px] border border-white/10 bg-white/96 p-3 text-black shadow-2xl backdrop-blur-sm">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="mb-3 flex items-start justify-between gap-3 px-1">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-black">
                  {selected.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedProviderServices.length} service
                  {selectedProviderServices.length === 1 ? "" : "s"} available
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
              {selectedProviderServices.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.id === selected.id
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-black">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500">{item.city}</p>
                    </div>

                    <div className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      ⭐ {item.rating}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.category && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700">
                        {item.category}
                      </span>
                    )}

                    {item.experience && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700">
                        {item.experience}
                      </span>
                    )}

                    {typeof item.reliabilityScore === "number" && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700">
                        reliability {item.reliabilityScore}%
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-black">
                      {typeof item.price === "number"
                        ? `₹${item.price.toLocaleString("en-IN")}`
                        : item.price}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="text-xs font-medium text-purple-700"
                    >
                      Focus on map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-32 right-5 z-[1200] rounded-full p-4 shadow-lg !bg-white !text-black"
        aria-label="Open AI assistant"
      >
        <Icon
          icon="material-symbols:support-agent-rounded"
          width="28"
          height="28"
          className="!text-black"
        />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
          ?
        </span>
      </button>

      {isChatOpen && !loading && (
        <OfferingsChatbot
          offerings={allData}
          hideFloatingButton={true}
          forceOpen={true}
          onClose={() => setIsChatOpen(false)}
          onFiltersDetected={(detectedFilters: OfferingsFilterState) => {
            setFilters((prev) => ({
              ...prev,
              category: detectedFilters.category,
              city: detectedFilters.city,
              experience: detectedFilters.experience,
              budget: detectedFilters.budget,
            }));
            setSelected(null);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}