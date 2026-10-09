import { forwardRef } from "react";

// Which artists go in which row, and how big their names are
const TIERS = [
  { from: 0, to: 3, size: 50, gap: 6 },
  { from: 3, to: 10, size: 30, gap: 8 },
  { from: 10, to: 20, size: 21, gap: 8 },
  { from: 20, to: 32, size: 15, gap: 8 },
];

const Poster = forwardRef(function Poster({ artists, title }, ref) {
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
        color: "#fff",
        fontFamily: "Impact, 'Arial Black', sans-serif",
        background:
          "linear-gradient(180deg, #ff6a2b 0%, #d81b60 55%, #2b0a3d 100%)",
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