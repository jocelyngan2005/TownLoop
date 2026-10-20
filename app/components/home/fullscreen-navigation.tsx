"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  ArrowRightIcon,
  CloseIcon,
  InfinityIcon,
  MenuIcon,
} from "@/app/components/icons";

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
            className="fixed inset-0 z-[100] min-h-[100dvh] bg-black/10"
          >
            <div className="motion-navigation flex min-h-[100dvh] flex-col bg-orchard-500 text-white">
              <div className="flex items-center justify-between px-6 py-5">
                <span
                  className="inline-flex items-center text-xl font-semibold tracking-wide"
                  aria-hidden="true"
                >
                  TownL
                  <InfinityIcon className="mx-0.5 h-5 w-5" />
                  p
                </span>
                <span className="sr-only">TownLoop</span>
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
                    <li
                      key={item.label}
                      className="motion-nav-item border-b border-white/25 last:border-b-0"
                      style={{ animationDelay: `${index * 55 + 100}ms` }}
                    >
                      <a
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center justify-between gap-4 py-5 text-3xl font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        <span>{item.label}</span>
                        <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}