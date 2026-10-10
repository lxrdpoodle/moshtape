import { forwardRef } from "react";

export const THEMES = {
  sunset: {
    label: "Sunset",
    bg: "linear-gradient(180deg, #ff6a2b 0%, #d81b60 55%, #2b0a3d 100%)",
    color: "#ffffff",
    font: "Impact, 'Arial Black', sans-serif",
    shadow: "none",
  },
  neon: {
    label: "Neon",
    bg: "linear-gradient(180deg, #0b0b1f 0%, #26064f 60%, #050510 100%)",
    color: "#00f5ff",
    font: "Impact, 'Arial Black', sans-serif",
    shadow: "0 0 10px #00f5ff, 0 0 24px #ff00e6",
  },
  desert: {
    label: "Desert",
    bg: "linear-gradient(180deg, #f6dfae 0%, #e07a3f 60%, #7a2e1d 100%)",
    color: "#3b1408",
    font: "Georgia, 'Times New Roman', serif",
    shadow: "none",
  },
  mono: {
    label: "Mono",
    bg: "#f2f2f2",
    color: "#111111",
    font: "'Helvetica Neue', Arial, sans-serif",
    shadow: "none",
  },
};

const TIERS = [
  { from: 0, to: 3, size: 50, gap: 6 },
  { from: 3, to: 10, size: 30, gap: 8 },
  { from: 10, to: 20, size: 21, gap: 8 },
  { from: 20, to: 32, size: 15, gap: 8 },
];

const Poster = forwardRef(function Poster({ artists, title, theme }, ref) {
  const names = artists.map((a) => a.name.toUpperCase());

  return (
    <div
      ref={ref}
      style={{
        width: 540,
        height: 960,
        boxSizing: "border-box",
        padding: "48px 28px",
        textAlign: "center",
        color: theme.color,
        fontFamily: theme.font,
        fontWeight: 800,
        textShadow: theme.shadow,
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: 6 }}>ONE NIGHT ONLY</div>
      <div style={{ fontSize: 60, lineHeight: 1, margin: "10px 0 30px" }}>
        {title}
      </div>

      <div style={{ flex: 1 }}>
        {TIERS.map((tier, i) => {
          const row = names.slice(tier.from, tier.to);
          if (row.length === 0) return null;
          return (
            <div
              key={i}
              style={{
                fontSize: tier.size,
                lineHeight: 1.15,
                marginBottom: tier.gap + 8,
                wordBreak: "break-word",
              }}
            >
              {row.join("  •  ")}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, letterSpacing: 4, opacity: 0.8 }}>
        MOSHTAPE · MADE BY LXRDPOODLE
      </div>
    </div>
  );
});

export default Poster;