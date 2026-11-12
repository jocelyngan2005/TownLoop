"use client";

import Link from "next/link";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { CloseIcon, CoinIcon, QrCodeIcon, ScanIcon } from "@/app/components/icons";
import {
  BinCheckIn as BinCheckInCard,
  type BinCheckIn,
} from "@/app/components/scan/bin-check-in";
import { CameraFrame } from "@/app/components/scan/camera-frame";
import { ItemVerdict } from "@/app/components/scan/item-verdict";
import { useCamera } from "@/app/components/scan/use-camera";
import {
  carryItem,
  CLEAN_SORTING_BONUS,
  discardCarried,
  disposeAtBin,
  usePoints,
} from "@/lib/points-store";
import {
  findBinByCode,
  getBin,
  recyclingBins,
  scanItems,
  type IdentifyResponse,
  type ItemMatch,
} from "@/lib/scan-data";

type Mode = "item" | "qr";
type ScanSource = IdentifyResponse["source"];

const demoItems = ["cardboard-box", "old-phone", "battery", "cotton-shirt"]
  .map((id) => scanItems.find((item) => item.id === id))
  .filter((item): item is (typeof scanItems)[number] => Boolean(item));

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function ScannerScreen({ initialMode = "item" }: { initialMode?: Mode }) {
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [match, setMatch] = useState<ItemMatch | null>(null);
  const [checkIn, setCheckIn] = useState<BinCheckIn | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [manualCode, setManualCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<ScanSource>("gemini");
  const [scanError, setScanError] = useState<string | null>(null);

  // The carry list and the balance live in the store so they survive navigation.
  const { carried } = usePoints();
  const carriedPoints = carried.reduce(
    (sum, entry) => sum + entry.item.points,
    0,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const identifyAbort = useRef<AbortController | null>(null);

  // `/scan#qr` opens straight into bin check-in without a dynamic server read.
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash.toLowerCase(),
    () => "",
  );
  const mode: Mode = modeOverride ?? (hash === "#qr" ? "qr" : initialMode);

  const cameraActive = mode === "item" ? match === null : checkIn === null;
  const { videoRef, status, retry } = useCamera(cameraActive);
  const cameraReady = status === "ready";
  const cameraBlocked = status === "denied" || status === "unavailable";

  useEffect(() => () => identifyAbort.current?.abort(), []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    const width = 480;
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(video, 0, 0, width, height);

    const cropWidth = Math.round(width * 0.5);
    const cropHeight = Math.round(height * 0.5);
    const { data } = context.getImageData(
      Math.round(width * 0.25),
      Math.round(height * 0.25),
      cropWidth,
      cropHeight,
    );

    let red = 0;
    let green = 0;
    let blue = 0;
    let samples = 0;

    for (let index = 0; index < data.length; index += 16) {
      red += data[index];
      green += data[index + 1];
      blue += data[index + 2];
      samples += 1;
    }

    if (samples === 0) return null;

    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.7),
      averageColor: {
        r: red / samples,
        g: green / samples,
        b: blue / samples,
      },
    };
  }, [videoRef]);

  async function identifyItem() {
    const frame = captureFrame();
    if (!frame) return;

    identifyAbort.current?.abort();
    const controller = new AbortController();
    identifyAbort.current = controller;

    setCapturedImage(frame.dataUrl);
    setScanError(null);
    setAnalysing(true);

    try {
      const response = await fetch("/api/scan/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: frame.dataUrl,
          averageColor: frame.averageColor,
          seenIds,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Identify failed: ${response.status}`);

      const result = (await response.json()) as IdentifyResponse;
      if (controller.signal.aborted) return;

      setScanSource(result.source);
      setMatch({ item: result.item, confidence: result.confidence });
      setSeenIds((current) => [...current, result.item.id]);
    } catch (error) {
      // An abort is a mode switch or an unmount, not a failure to report.
      if (controller.signal.aborted) return;

      console.error(error);
      setCapturedImage(null);
      setScanError("Could not identify that item. Check your connection and try again.");
    } finally {
      if (!controller.signal.aborted) setAnalysing(false);
    }
  }

  function simulateItem(itemId: string) {
    const item = scanItems.find((entry) => entry.id === itemId);
    if (!item) return;

    identifyAbort.current?.abort();
    setCapturedImage(null);
    setScanError(null);
    setScanSource("fallback");
    setMatch({ item, confidence: 0.88 });
    setSeenIds((current) => [...current, item.id]);
  }

  const registerCode = useCallback(
    (rawCode: string) => {
      const bin = findBinByCode(rawCode);

      if (!bin) {
        setCodeError(`“${rawCode.trim()}” is not a TownLoop bin code.`);
        return;
      }

      setCodeError(null);
      navigator.vibrate?.(40);

      // Drops off every carried item that belongs in this bin, awards their
      // points plus the clean-sorting bonus, and leaves the rest on the list.
      const receipt = disposeAtBin(bin.id);

      if (receipt.disposed.length > 0) {
        setSessionPoints((current) => current + receipt.total);
        // Anything just dropped off must not be scored again.
        setMatch(null);
      }

      const outcome =
        receipt.disposed.length > 0
          ? "matched"
          : receipt.remaining.length > 0
            ? "mismatch"
            : "no-item";

      setCheckIn({ bin, receipt, outcome });
    },
    [],
  );

  useEffect(() => {
    if (mode !== "qr" || checkIn || !cameraReady) return;

    let stopped = false;
    let processing = false;

    const interval = window.setInterval(async () => {
      const video = videoRef.current;
      if (
        stopped ||
        processing ||
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0
      ) return;

      processing = true;
      try {
        const canvas = (qrCanvasRef.current ??= document.createElement("canvas"));
        const scale = Math.min(
          1,
          720 / Math.max(video.videoWidth, video.videoHeight),
        );
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { data, width, height } = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const code = jsQR(data, width, height, {
          inversionAttempts: "attemptBoth",
        });

        if (!stopped && code) registerCode(code.data);
      } catch {
        // A failed frame is not fatal — the next tick tries again.
      } finally {
        processing = false;
      }
    }, 500);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [mode, checkIn, cameraReady, registerCode, videoRef]);

  function switchMode(next: Mode) {
    // Leaving item mode mid-analysis must not land a stale verdict later.
    identifyAbort.current?.abort();
    identifyAbort.current = null;

    setModeOverride(next);
    setCheckIn(null);
    setCodeError(null);
    setAnalysing(false);
    setScanError(null);

    if (next === "item") {
      setMatch(null);
      setCapturedImage(null);
    }
  }

  function resetItem() {
    identifyAbort.current?.abort();
    identifyAbort.current = null;
    setMatch(null);
    setCapturedImage(null);
    setAnalysing(false);
    setScanError(null);
  }

  function recordMatch() {
    if (!match) return;
    carryItem(match);
  }

  return (
    <main className="fixed inset-x-0 top-0 isolate flex h-dvh flex-col overflow-hidden bg-leaf-900">
      <CameraFrame
        videoRef={videoRef}
        status={status}
        mode={mode}
        capturedImage={mode === "item" ? capturedImage : null}
        busy={analysing}
        onRetry={retry}
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-5 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <h1 className="text-lg font-semibold">Scanner</h1>
        <Link
          href="/mobile-app"
          aria-label="Close scanner and return home"
          className="grid h-11 w-11 place-items-center rounded-full bg-black/40 transition hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <CloseIcon className="h-5 w-5" />
        </Link>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-md px-5">
        <div
          role="tablist"
          aria-label="Scanner modes"
          className="grid grid-cols-2 gap-1 rounded-full bg-leaf-50 p-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-item"
            aria-selected={mode === "item"}
            aria-controls="panel-item"
            disabled={analysing}
            onClick={() => switchMode("item")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition ${mode === "item"
              ? "bg-white text-leaf-900 shadow-sm"
              : "text-leaf-700/70"
              }`}
          >
            <ScanIcon className="h-4 w-4" />
            Item check
          </button>
          <button
            type="button"
            role="tab"
            id="tab-qr"
            aria-selected={mode === "qr"}
            aria-controls="panel-qr"
            disabled={analysing}
            onClick={() => switchMode("qr")}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition ${mode === "qr"
              ? "bg-white text-leaf-900 shadow-sm"
              : "text-leaf-700/70"
              }`}
          >
            <QrCodeIcon className="h-4 w-4" />
            Bin QR
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-auto max-h-[55%] shrink-0 overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-10px_30px_-18px_rgba(16,40,29,0.8)]">
        <span
          aria-hidden
          className="mx-auto mb-3 block h-1 w-10 rounded-full bg-leaf-200"
        />
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          <p role="status" className="text-center text-xs font-medium leading-relaxed text-leaf-800">
            {analysing
              ? "Analysing the capture..."
              : mode === "item"
                ? "Hold the item inside the frame, then tap identify."
                : "Point at the QR sticker on the bin to check in."}
          </p>

          {sessionPoints > 0 && (
            <p className="mx-5 inline-flex items-center gap-2 self-start rounded-full bg-leaf-100 px-3 py-1.5 text-xs font-semibold text-leaf-800">
              <CoinIcon className="h-4 w-4 text-sun-400" />
              {sessionPoints} pts earned in this session
            </p>
          )}

          {mode === "item" ? (
            <section
              id="panel-item"
              role="tabpanel"
              aria-labelledby="tab-item"
              className="flex flex-col gap-3"
            >
              {match ? (
                <ItemVerdict
                  match={match}
                  source={scanSource}
                  onAddAndScan={() => {
                    recordMatch();
                    resetItem();
                  }}
                  onRemove={resetItem}
                  onContinueToBin={() => {
                    recordMatch();
                    resetItem();
                    setModeOverride("qr");
                    setCheckIn(null);
                    setCodeError(null);
                  }}
                />
              ) : (
                <>
                  {scanError && (
                    <p
                      role="alert"
                      className="rounded-2xl bg-clay-500/10 px-3 py-2.5 text-xs font-medium leading-relaxed text-clay-600"
                    >
                      {scanError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={identifyItem}
                    disabled={!cameraReady || analysing}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-800 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:bg-leaf-200 disabled:text-leaf-700/60"
                  >
                    <ScanIcon className="h-5 w-5" />
                    {analysing ? "Identifying…" : "Identify item"}
                  </button>

                  <details open={cameraBlocked} className="rounded-3xl bg-leaf-50 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-leaf-900">
                      {cameraBlocked
                        ? "No camera? Try a demo item"
                        : "Tips for a clean read"}
                    </summary>

                    {cameraBlocked ? (
                      <ul className="mt-3 grid grid-cols-2 gap-2">
                        {demoItems.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => simulateItem(item.id)}
                              className="w-full rounded-2xl bg-white px-3 py-2.5 text-left text-xs font-medium text-leaf-900 ring-1 ring-leaf-100 transition active:scale-[0.98]"
                            >
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-leaf-700/85">
                        <li>Scan one item at a time against a plain surface.</li>
                        <li>Make sure labels and recycling codes face the camera.</li>
                        <li>
                          The verdict covers only materials accepted in your local
                          area.
                        </li>
                      </ul>
                    )}
                  </details>
                </>
              )}
            </section>
          ) : (
            <section
              id="panel-qr"
              role="tabpanel"
              aria-labelledby="tab-qr"
              className="flex flex-col gap-3"
            >
              {checkIn ? (
                <BinCheckInCard
                  checkIn={checkIn}
                  onDone={() => {
                    setCheckIn(null);
                    setCodeError(null);
                  }}
                  onScanItem={() => switchMode("item")}
                />
              ) : (
                <>
                  {carried.length > 0 && (
                    <div className="rounded-2xl bg-leaf-50 px-3 py-2.5">
                      <p className="text-xs font-semibold text-leaf-900">
                        Carrying {carried.length}{" "}
                        {carried.length === 1 ? "item" : "items"} ·{" "}
                        {carriedPoints > 0
                          ? `+${carriedPoints} pts waiting`
                          : "no points waiting"}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {carried.map(({ uid, item }) => (
                          <li
                            key={uid}
                            className="flex items-center justify-between gap-2 text-xs text-leaf-800"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-[10px] text-leaf-700/65">
                              {getBin(item.binId).label}
                            </span>
                            <span className="shrink-0 tabular-nums text-[10px] font-medium text-leaf-700/80">
                              {item.points > 0 ? `+${item.points}` : "0"}
                            </span>
                            <button
                              type="button"
                              onClick={() => discardCarried(uid)}
                              aria-label={`Remove ${item.name} from your list`}
                              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-leaf-700 ring-1 ring-leaf-200 transition active:scale-90"
                            >
                              <CloseIcon className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[10px] leading-relaxed text-leaf-700/65">
                        These stay on your list until you check in at the
                        matching bin. A full drop-off adds a{" "}
                        {CLEAN_SORTING_BONUS} pt clean sorting bonus.
                      </p>
                    </div>
                  )}

                  {match && (
                    <p className="rounded-2xl bg-leaf-50 px-3 py-2.5 text-xs leading-relaxed text-leaf-800">
                      Carrying{" "}
                      <span className="font-semibold text-leaf-900">
                        {match.item.name}
                      </span>
                      . Scan the bin QR and TownLoop confirms whether it is the right
                      one.
                    </p>
                  )}

                  <details
                    open={cameraBlocked || Boolean(codeError)}
                    className="rounded-3xl bg-leaf-50 p-4"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-leaf-900">
                      Enter a bin code manually
                    </summary>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        registerCode(manualCode);
                      }}
                      className="pt-3"
                    >
                      <label
                        htmlFor="bin-code"
                        className="text-sm font-semibold text-leaf-900"
                      >
                        Enter the bin code
                      </label>
                      <p className="mt-1 text-xs leading-relaxed text-leaf-700/85">
                        Every bin has its code printed under the QR sticker.
                      </p>

                      <div className="mt-3 flex gap-2">
                        <input
                          id="bin-code"
                          value={manualCode}
                          onChange={(event) => setManualCode(event.target.value)}
                          placeholder="TL-BIN-GLASS-C12"
                          autoComplete="off"
                          autoCapitalize="characters"
                          className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-xs text-leaf-900 ring-1 ring-leaf-100 outline-none placeholder:text-leaf-700/40 focus:ring-2 focus:ring-leaf-500"
                        />
                        <button
                          type="submit"
                          disabled={manualCode.trim().length === 0}
                          className="shrink-0 rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-semibold text-white transition active:scale-95 disabled:bg-leaf-200 disabled:text-leaf-700/60"
                        >
                          Check in
                        </button>
                      </div>

                      {codeError && (
                        <p
                          role="alert"
                          className="mt-2 text-[11px] font-medium text-clay-600"
                        >
                          {codeError}
                        </p>
                      )}
                    </form>
                  </details>

                  <details className="rounded-3xl bg-white p-4 ring-1 ring-leaf-100">
                    <summary className="cursor-pointer text-sm font-semibold text-leaf-900">
                      Bins at Block C
                    </summary>
                    <ul className="mt-3 grid grid-cols-2 gap-2">
                      {recyclingBins.map((bin) => (
                        <li key={bin.id}>
                          <button
                            type="button"
                            onClick={() => registerCode(bin.qrCode)}
                            className="flex w-full items-center gap-2 rounded-2xl bg-leaf-50 px-3 py-2.5 text-left transition active:scale-[0.98]"
                          >
                            <span
                              aria-hidden
                              className="h-6 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: bin.color }}
                            />
                            <span className="min-w-0 text-xs font-medium text-leaf-900">
                              {bin.label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[10px] leading-relaxed text-leaf-700/60">
                      Tapping a bin simulates scanning its QR sticker, handy while
                      the stickers are still being installed.
                    </p>
                  </details>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
