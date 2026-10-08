import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { usd } from "@/lib/format";
import type { ShareCard } from "@/lib/share";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const STAMP = {
  kill: { label: "Kill", color: "#c42b2f", bg: "#fbe8e7" },
  resize: { label: "Resize", color: "#946000", bg: "#fbf0d9" },
  proceed: { label: "Proceed", color: "#0b7a3b", bg: "#e5f3e9" },
} as const;

async function fonts() {
  const dir = join(process.cwd(), "lib/fonts");
  const [regular, medium] = await Promise.all([
    readFile(join(dir, "Geist-Regular.ttf")),
    readFile(join(dir, "Geist-Medium.ttf")),
  ]);
  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: medium, weight: 500 as const, style: "normal" as const },
  ];
}

function bits(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

export function OgVerdict({ card }: { card: ShareCard }) {
  const stamp = STAMP[card.verdict];
  const agree = card.jury ? card.jury.filter((v) => v === card.verdict).length : null;
  const rows = [
    { label: "Leverage", from: `${card.leverage}x`, to: `${card.suggestedLeverage}x` },
    { label: "Notional", from: usd(card.notionalUsd), to: usd(card.suggestedNotionalUsd) },
    { label: "Stop", from: card.stopPct != null ? `${card.stopPct}%` : "none", to: `${card.suggestedStopPct}%` },
  ];
  const meta = bits(`${card.symbol} · ${card.side} · ${card.leverage}x · ${card.horizonDays}d`);
  const headline = bits(card.headline);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f5f1ec",
        padding: 40,
        fontFamily: "Geist",
        color: "#111111",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: "#ffffff",
          border: "1px solid #e3ded6",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "20px 36px",
            background: stamp.bg,
            borderBottom: "1px solid #e3ded6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 22,
                height: 22,
                background: "#111111",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <div style={{ width: 14, height: 2, background: "#1fd5e0", borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>Redline</div>
          </div>
          <div style={{ marginLeft: 20, fontSize: 20, fontWeight: 500, color: stamp.color }}>{stamp.label}</div>
          <div style={{ display: "flex", marginLeft: 16, fontSize: 16, color: "#5e5b56" }}>
            {bits(`Confidence ${Math.round(card.confidence * 100)}%`).map((w, i) => (
              <span key={`c-${i}`} style={{ marginRight: 6 }}>
                {w}
              </span>
            ))}
          </div>
          {agree != null && card.jury ? (
            <div style={{ display: "flex", marginLeft: 16, fontSize: 16, color: "#5e5b56" }}>
              {bits(`Jury ${agree}/${card.jury.length} agree`).map((w, i) => (
                <span key={`j-${i}`} style={{ marginRight: 6 }}>
                  {w}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 36px 20px" }}>
          <div style={{ display: "flex", fontSize: 16, color: "#5e5b56" }}>
            {meta.map((w, i) => (
              <span key={`m-${i}`} style={{ marginRight: 8 }}>
                {w}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 10, maxWidth: 1040, fontSize: 36, fontWeight: 500, lineHeight: 1.2 }}>
            {headline.map((w, i) => (
              <span key={`h-${i}`} style={{ marginRight: 12 }}>
                {w}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
            {card.deathModes.map((d, i) => (
              <div
                key={d.title}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: i === 0 ? 0 : 10,
                  marginTop: i === 0 ? 0 : 10,
                  borderTop: i === 0 ? "none" : "1px solid #e3ded6",
                }}
              >
                <div style={{ display: "flex", fontSize: 20 }}>
                  {bits(`${i + 1} ${d.title}`).map((w, j) => (
                    <span key={`d-${i}-${j}`} style={{ marginRight: 8 }}>
                      {w}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 16, color: "#5e5b56" }}>{d.probability}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", borderTop: "1px solid #e3ded6" }}>
          {rows.map((row, i) => {
            const changed = row.from !== row.to;
            return (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  padding: "16px 28px",
                  borderRight: i < rows.length - 1 ? "1px solid #e3ded6" : "none",
                }}
              >
                <div style={{ fontSize: 13, color: "#716e68" }}>{row.label}</div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 6, fontSize: 18 }}>
                  <div
                    style={{
                      color: changed ? "#716e68" : "#111111",
                      textDecoration: changed ? "line-through" : "none",
                    }}
                  >
                    {row.from}
                  </div>
                  {changed ? <div style={{ color: "#00747c", marginLeft: 10 }}>{row.to}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export async function renderOg(card: ShareCard) {
  return new ImageResponse(<OgVerdict card={card} />, {
    ...OG_SIZE,
    fonts: await fonts(),
  });
}
