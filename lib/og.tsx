import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function renderOg({ title, kicker }: { title: string; kicker: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1f4a4f",
          color: "#f5fafa",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#d4563a",
              borderRadius: "999px 999px 999px 8px",
              transform: "rotate(-45deg)",
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 700 }}>Plug N Paw</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 32, color: "#f0a58f" }}>{kicker}</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>
            {title}
          </div>
        </div>
      </div>
    ),
    ogSize
  );
}
