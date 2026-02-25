"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppEntry() {
  const router = useRouter();

  useEffect(() => {
    // TEMP: assume logged-in until auth is connected
    const isLoggedIn = true;

    const profileCompleted = localStorage.getItem("profileCompleted") === "true";

    if (!isLoggedIn) router.replace("/login");
    else if (!profileCompleted) router.replace("/onboarding/profile-builder");
    else router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading…
    </div>
  );
}