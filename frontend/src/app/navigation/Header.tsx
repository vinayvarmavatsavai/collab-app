"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, CircleUserRound, Plus } from "lucide-react";
import { logout } from "@/lib/auth";

type HeaderVariant = "default" | "profile";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNotificationDot?: boolean;
  variant?: HeaderVariant;
}

export default function Header({
  title,
  subtitle,
  showNotificationDot = true,
  variant = "default",
}: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();

      localStorage.removeItem("profileCompleted");
      localStorage.removeItem("signupCompleted");
      localStorage.removeItem("profileAnswers");

      setMenuOpen(false);
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);

      localStorage.removeItem("profileCompleted");
      localStorage.removeItem("signupCompleted");
      localStorage.removeItem("profileAnswers");

      setMenuOpen(false);
      router.replace("/auth/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="sync-page-top">
      <div className="sync-page-top__row">
        <h1 className="sync-page-top__title">{title}</h1>

        <div className="sync-page-actions__inner" ref={menuRef}>
          {variant === "profile" ? (
            <>
              <button
                onClick={() => router.push("/qr")}
                className="sync-page-actions__btn"
                aria-label="QR"
                title="QR"
                type="button"
              >
                <img
                  src="/icons/qr.png"
                  alt="QR"
                  className="h-5 w-5 object-contain"
                />
              </button>

              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="sync-page-actions__btn"
                aria-label="Menu"
                title="Menu"
                type="button"
              >
                ☰
              </button>

              {menuOpen && (
                <div className="absolute right-2 top-14 z-50 w-[220px] rounded-2xl border sync-theme-border sync-theme-surface p-2 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      alert("Settings page coming soon");
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                    type="button"
                  >
                    Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-[var(--muted)] disabled:opacity-60"
                    type="button"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/create"
                className="sync-page-actions__btn"
                aria-label="Create"
                title="Create"
              >
                <Plus size={20} />
              </Link>

              <Link
                href="/notifications"
                className="sync-page-actions__btn"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={18} />
                {showNotificationDot ? (
                  <span className="sync-page-actions__dot" />
                ) : null}
              </Link>

              <Link
                href="/profile"
                className="sync-page-actions__btn"
                aria-label="Profile"
                title="Profile"
              >
                <CircleUserRound size={20} />
              </Link>
            </>
          )}
        </div>
      </div>

      {subtitle ? <p className="sync-page-top__subtitle">{subtitle}</p> : null}
    </div>
  );
}