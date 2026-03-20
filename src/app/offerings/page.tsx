"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Icon } from "@iconify/react";
import BottomNav from "../navigation/BottomNav";
import OfferingsChatbot from "@/app/chatbot/page";

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

export default function OfferingsPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [allData, setAllData] = useState<OfferingItem[]>([]);
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
        setAllData(Array.isArray(json) ? json : []);
      } catch (error) {
        console.error("Failed to load offerings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOfferings();
  }, []);

  const handleSearch = () => {
    const finalQuery = query.trim();

    if (!finalQuery) {
      router.push("/offerings/results");
      return;
    }

    router.push(`/offerings/results?q=${encodeURIComponent(finalQuery)}`);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white sync-page-with-bottom-nav">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/offerings-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[480px] flex-col px-4 pb-6 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h1 className="text-[2rem] font-bold leading-none tracking-[-0.03em] text-white">
            Offerings
          </h1>
        </div>

        <p className="mb-6 max-w-full text-[0.95rem] leading-7 text-white/72">
          Browse the ecosystem enterprise and discover teams, offerings, and
          opportunities that match your interests.
        </p>

        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-4">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="flex items-center gap-3 rounded-full border border-white bg-white px-4 py-3 text-white">
              <Search size={18} className="text-black" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search for Offerings and Teams"
                className="w-full text-sm text-black outline-none placeholder:text-black"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="mt-4 w-full rounded-full bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
            >
              Explore Offerings
            </button>
          </div>
        </div>

        <div className="flex-1" />

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
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
            ?
          </span>
        </button>
      </div>

      {isOpen && !loading && (
  <OfferingsChatbot
    offerings={allData}
    hideFloatingButton={true}
    forceOpen={true}
    onClose={() => setIsOpen(false)}
    onResultSelect={(items) => {
      setIsOpen(false);

      const first = items[0];

      if (first?.category) {
        router.push(
          `/offerings/results?q=${encodeURIComponent(first.category)}`
        );
        return;
      }

      if (query.trim()) {
        router.push(
          `/offerings/results?q=${encodeURIComponent(query.trim())}`
        );
        return;
      }

      router.push("/offerings/results");
    }}
  />
)}

      <BottomNav />
    </div>
  );
}