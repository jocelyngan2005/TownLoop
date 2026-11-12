import { geminiConfigured, identifyWithGemini } from "@/lib/gemini-scan";
import { identifyFromFrame, type IdentifyResponse } from "@/lib/scan-data";

/**
 * Identifies a scanned item from a camera frame.
 *
 * Degrades rather than fails: with no API key, a model error, or a photo the
 * model cannot read, it answers with the offline colour estimate and marks the
 * response `source: "fallback"` so the UI can say so.
 */

type AverageColor = { r: number; g: number; b: number };

type IdentifyRequest = {
  image?: unknown;
  averageColor?: unknown;
  seenIds?: unknown;
};

/** The client sends a 480px JPEG at q0.7, so this is a ceiling, not a budget. */
const MAX_IMAGE_BYTES = 1_500_000;

function isAverageColor(value: unknown): value is AverageColor {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.r === "number" &&
    typeof candidate.g === "number" &&
    typeof candidate.b === "number"
  );
}

/** Accepts a `data:` URL or bare base64. */
function parseImage(image: string) {
  // `[\s\S]` rather than the `s` flag, which needs an ES2018 target.
  const dataUrl = /^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/.exec(image);
  if (dataUrl) return { mimeType: dataUrl[1], data: dataUrl[2] };
  if (image.startsWith("data:")) return null;
  return { mimeType: "image/jpeg", data: image };
}

export async function POST(request: Request) {
  let body: IdentifyRequest;
  try {
    body = (await request.json()) as IdentifyRequest;
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const averageColor = isAverageColor(body.averageColor)
    ? body.averageColor
    : { r: 128, g: 128, b: 128 };
  const seenIds = Array.isArray(body.seenIds)
    ? body.seenIds.filter((id): id is string => typeof id === "string")
    : [];

  const fallback = (reason: NonNullable<IdentifyResponse["reason"]>): Response =>
    Response.json({
      ...identifyFromFrame(averageColor, seenIds),
      source: "fallback",
      reason,
    } satisfies IdentifyResponse);

  if (typeof body.image !== "string" || body.image.length === 0) {
    return Response.json({ error: "Expected an `image`" }, { status: 400 });
  }

  if (body.image.length > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Image is too large" }, { status: 413 });
  }

  // Validated before the key check so a malformed request is reported as one
  // rather than being masked as a fallback.
  const parsed = parseImage(body.image);
  if (!parsed) {
    return Response.json({ error: "Unsupported image format" }, { status: 415 });
  }

  if (!geminiConfigured()) return fallback("no-api-key");

  try {
    const match = await identifyWithGemini(parsed.data, parsed.mimeType);
    if (!match) return fallback("not-recognised");

    return Response.json({
      ...match,
      source: "gemini",
    } satisfies IdentifyResponse);
  } catch (error) {
    // Logged here only — the provider's message never reaches the client.
    console.error("[scan/identify] Gemini request failed", error);
    return fallback("model-error");
  }
}
