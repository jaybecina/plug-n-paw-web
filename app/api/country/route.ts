import type { NextRequest } from "next/server";

// Returns only a two-letter country code taken from the host's geo headers
// (Vercel or Cloudflare). The visitor's IP address is never read or returned.
export function GET(request: NextRequest) {
  const raw =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");
  const country = raw && /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : null;

  return Response.json(
    { country },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
