import { Suspense } from "react";
import OfferingsResultsClient from "./OfferingsResultsClient";

export default function OfferingsResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading offerings...
        </div>
      }
    >
      <OfferingsResultsClient />
    </Suspense>
  );
}