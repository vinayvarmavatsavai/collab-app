"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import { getStoredIdentity } from "@/lib/auth";

type FooterTab = "home" | "offerings" | "explore" | "events" | "messages";

export default function QrPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [footerTab, setFooterTab] = useState<FooterTab>("home");
  const [profileUrl, setProfileUrl] = useState("");
  const [displayName, setDisplayName] = useState("My Profile");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [error, setError] = useState("");

  const go = (path: string, tab?: FooterTab) => {
    if (tab) setFooterTab(tab);
    router.push(path);
  };

  useEffect(() => {
    const identity = getStoredIdentity();

    if (!identity?.username) {
      setError("No username found for this account.");
      return;
    }

    const url = `${window.location.origin}/u/${identity.username}`;
    setProfileUrl(url);
    setDisplayName(identity.username);

    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, url, {
      width: 260,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).catch((err) => {
      console.error("QR generation failed", err);
      setError("Failed to generate QR code.");
    });
  }, []);

  const handleCopy = async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Could not copy the link.");
    }
  };

  const handleShare = async () => {
    if (!profileUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My SphereNet Profile",
          text: `Check out ${displayName}'s SphereNet profile`,
          url: profileUrl,
        });
      } else {
        alert("Sharing not supported on this device.");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "spherenet-public-profile-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="sync-theme-page min-h-screen pb-24">
      <Header
        title="Scan Me!"
        subtitle="Share your public profile instantly"
        variant="profile"
      />

      <div className="mx-auto w-full max-w-[480px] px-4 py-5">
        {error ? (
          <div className="mb-4 rounded-[22px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="text-center">
            <div className="text-base font-bold text-[var(--text-main)]">
              @{displayName}
            </div>
            <div className="mt-1 text-sm text-[var(--text-muted-2)]">
              Public SphereNet profile
            </div>
          </div>

          <div className="mt-5 rounded-[26px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-center">
              <canvas ref={canvasRef} />
            </div>
          </div>

          <p className="mt-4 break-all text-center text-sm text-[var(--text-muted-2)]">
            {profileUrl || "Preparing your public profile link..."}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <button
              onClick={handleCopy}
              disabled={!profileUrl}
              className="rounded-[18px] bg-[var(--muted)] px-4 py-3 text-sm font-semibold text-[var(--text-main)] disabled:opacity-50"
              type="button"
            >
              {copyLabel}
            </button>

            <button
              onClick={handleShare}
              disabled={!profileUrl}
              className="rounded-[18px] bg-[var(--primary-btn-bg)] px-4 py-3 text-sm font-semibold text-[var(--primary-btn-text)] disabled:opacity-50"
              type="button"
            >
              Share
            </button>

            <button
              onClick={handleDownload}
              className="rounded-[18px] bg-[var(--muted)] px-4 py-3 text-sm font-semibold text-[var(--text-main)]"
              type="button"
            >
              Download
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-3 shadow-sm">
          <div className="text-sm font-semibold text-[var(--text-main)]">
            Shareable link
          </div>
          <div className="mt-1 text-sm text-[var(--text-muted-2)]">
            Anyone with this QR can open your public SphereNet profile.
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}