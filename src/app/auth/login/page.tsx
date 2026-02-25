"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-2 text-black/70">Temporary page (auth later).</p>

      <button
        className="mt-6 w-full rounded-xl bg-black text-white py-3 font-semibold"
        onClick={() => router.replace("/onboarding/profile-builder")}
      >
        Continue (Mock Login)
      </button>
    </div>
  );
}