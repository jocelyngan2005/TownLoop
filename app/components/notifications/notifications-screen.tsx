"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import {
  BellIcon,
  CheckIcon,
  CloseIcon,
  GiftIcon,
  PinIcon,
  ScanIcon,
} from "@/app/components/icons";

const notifications = [
  {
    id: "drop-off",
    title: "Drop-off points are ready",
    detail: "The nearest station accepts the items in your latest scan.",
    time: "10 min ago",
    icon: PinIcon,
  },
  {
    id: "streak",
    title: "Your sorting streak is growing",
    detail: "You are one check-in away from a 7-day streak.",
    time: "2 hours ago",
    icon: ScanIcon,
  },
  {
    id: "reward",
    title: "You have points to redeem",
    detail: "1,240 points are ready to use in the rewards catalogue.",
    time: "Yesterday",
    icon: GiftIcon,
  },
] as const;

export function NotificationsScreen({
  unreadCount,
  onClose,
  onMarkAllRead,
}: {
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-leaf-900/30 px-4 pt-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        id="townloop-notifications"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        className="motion-dialog motion-card mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-24px_rgba(16,40,29,0.7)]"
      >
        <header className="flex items-center justify-between border-b border-leaf-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BellIcon className="h-5 w-5 text-leaf-800" />
            <div>
              <h2 id="notifications-title" className="text-base font-semibold text-leaf-900">
                Notifications
              </h2>
              <p className="text-[11px] text-leaf-700/70">
                {unreadCount > 0 ? `${unreadCount} unread updates` : "You are all caught up"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-leaf-50 text-leaf-900 transition active:scale-95"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <ul className="motion-stagger divide-y divide-leaf-100">
          {notifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <li
                key={notification.id}
                className="motion-card flex items-start gap-3 px-5 py-4"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-orchard-500" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-leaf-900">{notification.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-leaf-700/80">
                    {notification.detail}
                  </p>
                  <p className="mt-1.5 text-[10px] text-leaf-700/55">{notification.time}</p>
                </div>
                <span
                  className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-clay-500"
                  aria-label="Unread"
                />
              </li>
            );
          })}
        </ul>

        <footer className="flex items-center justify-end gap-3 px-5 pb-3">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-leaf-800 px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:bg-leaf-200 disabled:text-leaf-700/60"
          >
            <CheckIcon className="h-3 w-3" />
            Mark read
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}