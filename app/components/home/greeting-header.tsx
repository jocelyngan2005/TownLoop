"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { BellIcon } from "@/app/components/icons";
import { FullscreenNavigation } from "@/app/components/home/fullscreen-navigation";
import { PlantView } from "@/app/components/home/plant-view";
import { TimeGreeting } from "@/app/components/home/time-greeting";
import { NotificationsScreen } from "@/app/components/notifications/notifications-screen";
import type { LevelSummary, Resident } from "@/lib/home-data";

export function GreetingHeader({
  resident,
  level,
  title,
  showImage = true,
}: {
  resident: Resident;
  level?: LevelSummary;
  title?: string;
  showImage?: boolean;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(
    resident.unreadNotifications,
  );
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  return (
    <>
      <header
        className={`relative isolate overflow-hidden rounded-b-[2rem] ${
        title ? "h-[140px]" : "h-[220px]"
      } ${
        showImage ? "" : "bg-white"
      }`}
      >
      {showImage && (
        <>
          <Image
            src="/soil-background.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="-z-20 object-cover object-[50%_58%]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-leaf-50/85 via-leaf-50/30 to-transparent" />
        </>
      )}

      <div className="flex items-center justify-between px-5 pt-5">
        <FullscreenNavigation />

        <button
          type="button"
          aria-label={`Notifications, ${unreadNotifications} unread`}
          aria-expanded={notificationsOpen}
          aria-controls="townloop-notifications"
          onClick={() => setNotificationsOpen(true)}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-white/70 text-leaf-900 shadow-sm backdrop-blur transition active:scale-95"
        >
          <BellIcon className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-clay-500 text-[10px] font-semibold text-white">
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {title ? (
        <h1 className="px-5 pt-6 text-3xl font-bold tracking-tight text-leaf-900">
          {title}
        </h1>
      ) : (
        <div className="px-5 pt-3">
          <p className="text-sm font-medium text-leaf-800">
            <TimeGreeting />,
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-leaf-900">
            {resident.firstName}
          </h1>

          {level && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-leaf-800 backdrop-blur">
                {resident.block}
              </span>
              <PlantView level={level} />
            </div>
          )}
        </div>
      )}
      </header>
      {notificationsOpen && (
        <NotificationsScreen
          unreadCount={unreadNotifications}
          onClose={closeNotifications}
          onMarkAllRead={() => setUnreadNotifications(0)}
        />
      )}
    </>
  );
}
