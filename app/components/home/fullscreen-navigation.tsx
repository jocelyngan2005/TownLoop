"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ArrowRightIcon, CloseIcon, MenuIcon } from "@/app/components/icons";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Scanner", href: "/scan" },
  { label: "Drop-off", href: "/drop-off" },
  { label: "Activity", href: "/activity" },
  { label: "Take-back", href: "/take-back" },
  { label: "Rewards", href: "/rewards" },
  { label: "Profile", href: "/profile" },
];

export function FullscreenNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={isOpen}
        aria-controls="townloop-navigation"
        onClick={() => setIsOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-leaf-900 transition active:scale-95"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {isOpen &&
        createPortal(
          <div
            id="townloop-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="TownLoop navigation"
            className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col bg-orchard-500 text-white"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="text-sm font-semibold tracking-wide">TownLoop</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setIsOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/15 active:scale-95"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>

            <nav aria-label="Main navigation" className="flex flex-1 items-center px-7">
              <ul className="w-full">
                {navigationItems.map((item, index) => (
                  <li key={item.label} className="border-b border-white/25 last:border-b-0">
                    <a
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center justify-between gap-4 py-5 text-3xl font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      <span>{item.label}</span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs font-medium text-white/75">
                          0{index + 1}
                        </span>
                        <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}