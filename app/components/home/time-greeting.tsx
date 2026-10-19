"use client";

import { useSyncExternalStore } from "react";

function greetingFor(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const subscribe = () => () => {};
const getSnapshot = () => greetingFor(new Date().getHours());
const getServerSnapshot = () => "Hello";

export function TimeGreeting() {
  // Resolved on the client so the greeting follows the resident's local clock.
  const greeting = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return <>{greeting}</>;
}
