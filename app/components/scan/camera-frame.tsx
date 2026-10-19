"use client";

import type { RefObject } from "react";

import { AlertIcon, CameraIcon } from "@/app/components/icons";
import type { CameraStatus } from "@/app/components/scan/use-camera";

const statusCopy: Record<
  Exclude<CameraStatus, "ready">,
  { title: string; detail: string }
> = {
  idle: {
    title: "Camera paused",
    detail: "Start the camera to scan.",
  },
  starting: {
    title: "Starting camera…",
    detail: "Allow camera access when your browser asks.",
  },
  denied: {
    title: "Camera access blocked",
    detail:
      "Allow the camera in your browser settings, or use the demo items below.",
  },
  unavailable: {
    title: "No camera available",
    detail:
      "This device or connection cannot open a camera. Use the demo items below.",
  },
};

export function CameraFrame({
  videoRef,
  status,
  mode,
  capturedImage,
  busy,
  onRetry,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  mode: "item" | "qr";
  capturedImage?: string | null;
  busy?: boolean;
  onRetry: () => void;
}) {
  const fallback = status === "ready" ? null : statusCopy[status];

  return (
    <div className="absolute inset-0 overflow-hidden bg-leaf-900">
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="Camera viewfinder"
        className={`h-full w-full object-cover transition-opacity ${status === "ready" && !capturedImage ? "opacity-100" : "opacity-0"
          }`}
      />

      {capturedImage && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${capturedImage})` }}
        />
      )}

      {fallback && !capturedImage && (
        <div className="absolute inset-x-0 top-[38%] mx-auto flex max-w-sm -translate-y-1/2 flex-col items-center gap-3 px-8 text-center">
          {status === "denied" || status === "unavailable" ? (
            <AlertIcon className="h-8 w-8 text-sun-300" />
          ) : (
            <CameraIcon className="h-8 w-8 text-leaf-200" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">{fallback.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-leaf-200/80">
              {fallback.detail}
            </p>
          </div>
          {(status === "denied" || status === "unavailable") && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white transition active:scale-95"
            >
              Try the camera again
            </button>
          )}
        </div>
      )}

      {(status === "ready" || capturedImage) && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className={`absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white/70 ${mode === "qr" ? "h-52 w-52" : "h-56 w-60"
              } ${busy ? "animate-pulse" : ""}`}
          />
        </div>
      )}
    </div>
  );
}
