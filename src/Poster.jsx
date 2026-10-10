import { forwardRef, useLayoutEffect, useRef } from "react";

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

// 1-day layout: a few headliners, then smaller rows down the poster
const SINGLE_TIERS = [
  { from: 0, to: 3, size: 50, gap: 6 },
  { from: 3, to: 10, size: 30, gap: 8 },
  { from: 10, to: 20, size: 21, gap: 8 },
  { from: 20, to: 32, size: 15, gap: 8 },
];

// 2- and 3-day layouts: one headliner per day, then supporting acts in rows
const MULTI = {
  2: {
    headSize: 44,
    tiers: [
      { count: 4, size: 24 },
      { count: 6, size: 17 },
      { count: 6, size: 13 },
    ],
  },
  3: {
    headSize: 34,
    tiers: [
      { count: 4, size: 18 },
      { count: 6, size: 13 },
    ],
  },
};

const TAGLINES = { 1: "ONE DAY ONLY", 2: "TWO DAYS", 3: "THREE DAYS" };

// Poster width (540) minus padding (28 + 28), with a little breathing room
const MAX_WIDTH = 470;

// ---------- date helpers ----------
function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}
function shortDate(date) {
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}
function dateRange(start, days) {
  if (!start) return "";
  if (days === 1) return shortDate(start);
  const end = addDays(start, days - 1);
  if (start.getMonth() === end.getMonth()) {
    return `${shortDate(start)}–${end.getDate()}`;
  }
  return `${shortDate(start)} – ${shortDate(end)}`;
}
function dayLabel(start, i) {
  if (!start) return `DAY ${i + 1}`;
  return addDays(start, i)
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

// ---------- lineup helpers ----------
// Headliner i plays day i. Everyone else is dealt out one at a time,
// so every day gets a balanced mix of bigger and smaller acts.
function buildDays(names, days) {
  const heads = names.slice(0, days);
  const rest = names.slice(days);
  const support = Array.from({ length: days }, () => []);
  rest.forEach((n, i) => support[i % days].push(n));
  return heads.map((h, d) => ({ headliner: h, support: support[d] }));
}

function splitTiers(list, tiers) {
  let start = 0;
  return tiers.map((t) => {
    const names = list.slice(start, start + t.count);
    start += t.count;
    return { names, size: t.size };
  });
}

// ---------- components ----------
// Renders one artist name on a single line, shrinking it if it's too wide
function Name({ text, size, fontKey }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fitText = () => {
      el.style.fontSize = size + "px";
      const w = el.offsetWidth;
      if (w > MAX_WIDTH) {
        el.style.fontSize = Math.floor((size * MAX_WIDTH) / w) + "px";
      }
    };

    fitText();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitText);
    }
  }, [text, size, fontKey]);

  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        wordBreak: "keep-all",
        overflowWrap: "normal",
      }}
    >
      {text.replace(/ /g, "\u00A0")}
    </span>
  );
}

function Row({ names, size, fontKey, marginBottom = 0 }) {
  if (names.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: size * 0.5,
        rowGap: 2,
        marginBottom,
        lineHeight: 1.15,
      }}
    >
      {names.map((name, j) => (
        <Name key={j} text={name} size={size} fontKey={fontKey} />
      ))}
    </div>
  );
}

const Poster = forwardRef(function Poster(
  { artists, title, theme, days = 1, location = "", startDate = "" },
  ref
) {
  const names = artists.map((a) => a.name.toUpperCase());
  const start = parseDate(startDate);
  const subline = [location, dateRange(start, days)]
    .filter(Boolean)
    .join("  ·  ");

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
      <div style={{ fontSize: 13, letterSpacing: 6 }}>{TAGLINES[days]}</div>
      <div style={{ fontSize: 60, lineHeight: 1, margin: "10px 0 8px" }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 15,
          letterSpacing: 4,
          minHeight: 18,
          marginBottom: 22,
        }}
      >
        {subline}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: days === 1 ? "flex-start" : "space-between",
        }}
      >
        {days === 1
          ? SINGLE_TIERS.map((tier, i) => (
              <Row
                key={i}
                names={names.slice(tier.from, tier.to)}
                size={tier.size}
                fontKey={theme.font}
                marginBottom={tier.gap + 8}
              />
            ))
          : buildDays(names, days).map((day, d) => {
              const cfg = MULTI[days];
              return (
                <div key={d}>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: 4,
                      borderTop: "1px solid currentColor",
                      paddingTop: 6,
                      marginBottom: 4,
                    }}
                  >
                    {dayLabel(start, d)}
                  </div>
                  <Row
                    names={[day.headliner]}
                    size={cfg.headSize}
                    fontKey={theme.font}
                    marginBottom={6}
                  />
                  {splitTiers(day.support, cfg.tiers).map((t, k) => (
                    <Row
                      key={k}
                      names={t.names}
                      size={t.size}
                      fontKey={theme.font}
                      marginBottom={4}
                    />
                  ))}
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