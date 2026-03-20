"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import OfferingsChatbot from "@/app/chatbot/page";
import BottomNav from "@/app/navigation/BottomNav";

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

const OfferingsMap = dynamic(
  () => import("../OfferingsMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        Loading map...
      </div>
    ),
  }
);

export default function OfferingsResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [allData, setAllData] = useState<OfferingItem[]>([]);
  const [visibleData, setVisibleData] = useState<OfferingItem[]>([]);
  const [selected, setSelected] = useState<OfferingItem | null>(null);
  const [loading, setLoading] = useState(true);

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
        setAllData(json);
        setVisibleData(json);
      } catch (error) {
        console.error("Failed to load offerings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOfferings();
  }, []);

  const titleText = useMemo(() => {
    if (!query.trim()) return "Showing all offerings";
    return query;
  }, [query]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white sync-page-with-bottom-nav">
      <div className="absolute inset-x-0 top-0 z-[1000] px-4 pt-6">
        <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md">
          <h1 className="text-xl font-semibold">Offerings</h1>
          <p className="text-sm text-white/70">{titleText}</p>
        </div>
      </div>

      <div className="relative h-full w-full pt-24 pb-24">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center text-white/75">
            Loading offerings...
          </div>
        ) : (
          <OfferingsMap
            data={visibleData}
            onSelect={(item) => setSelected(item)}
          />
        )}
      </div>

      {selected && (
        <div className="pointer-events-auto absolute bottom-24 left-4 right-4 z-[1100] animate-slideUp">
          <div className="rounded-3xl border border-white/10 bg-white p-4 text-black shadow-2xl">
            <div className="mb-2 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold">
                  {selected.name}
                </h3>
                <p className="truncate text-sm text-gray-500">
                  {selected.title}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>⭐ {selected.rating}</span>
              <span className="font-semibold">
                {typeof selected.price === "number"
                  ? `₹${selected.price.toLocaleString("en-IN")}`
                  : selected.price}
              </span>
            </div>

            <button className="mt-4 w-full rounded-2xl bg-purple-600 py-3 text-sm font-medium text-white">
              View Details
            </button>
          </div>
        </div>
      )}

      {!loading && (
        <OfferingsChatbot
          offerings={allData}
          onResultSelect={(items) => {
            setVisibleData(items);
            setSelected(items[0] ?? null);
          }}
        />
      )}

      <BottomNav /> 
    </div>
  );
}