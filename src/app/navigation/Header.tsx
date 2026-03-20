"use client";

import Link from "next/link";
import { Bell, CircleUserRound, Plus } from "lucide-react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  showNotificationDot?: boolean;
};

export default function Header({
  title,
  subtitle,
  showNotificationDot = true,
}: HeaderProps) {
  return (
    <div className="sync-page-top">
      <div className="sync-page-top__row">
        <h1 className="sync-page-top__title">{title}</h1>

        <div className="sync-page-actions__inner">
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
        </div>
      </div>

      {subtitle ? (
        <p className="sync-page-top__subtitle">{subtitle}</p>
      ) : null}
    </div>
  );
}