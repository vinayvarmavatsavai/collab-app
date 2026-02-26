"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

export default function QrPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/profile/vinay`; // dynamic later
    setProfileUrl(url);

    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, url, {
      width: 260,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    alert("Profile link copied!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "My Profile QR",
        text: "Scan my profile QR",
        url: profileUrl,
      });
    } else {
      alert("Sharing not supported on this device.");
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "profile-qr.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F4F6FB] text-slate-900">

      {/* Header (matched with Home / Explore style) */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[20px] font-extrabold">Scan Me!</div>
            <div className="text-sm text-slate-500">
              Share your profile instantly
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 flex flex-col items-center">

        {/* QR Card */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200">
          <canvas ref={canvasRef} />
        </div>

        {/* Profile Link */}
        <p className="mt-6 text-sm text-slate-500 break-all text-center">
          {profileUrl}
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-6 flex-wrap justify-center">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
          >
            Copy
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-[#2D6BFF] text-white text-sm font-semibold"
          >
            Share
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-sm font-semibold"
          >
            Download
          </button>
        </div>
      </div>

    </div>
  );
}