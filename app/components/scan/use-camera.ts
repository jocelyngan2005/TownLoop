"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle"
  | "starting"
  | "ready"
  | "denied"
  | "unavailable";

/**
 * Attaches the rear camera to a video element while `active` is true and
 * releases the stream as soon as the scanner is paused or unmounted.
 */
export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streamStatus, setStreamStatus] = useState<CameraStatus>("starting");
  const [attempt, setAttempt] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopStream();
      return;
    }

    let cancelled = false;

    async function start() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setStreamStatus("unavailable");
        return;
      }

      setStreamStatus("starting");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        setStreamStatus("ready");
      } catch (error) {
        if (cancelled) return;

        const name = error instanceof DOMException ? error.name : "";
        setStreamStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : "unavailable",
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [active, attempt, stopStream]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { videoRef, status: active ? streamStatus : "idle", retry };
}
