import { toPng } from "html-to-image";
import Poster, { THEMES } from "./Poster";

import { useEffect, useRef, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPE = "user-top-read";

function randomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function login() {
  const verifier = randomString(64);
  localStorage.setItem("verifier", verifier);
  const hashed = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    code_challenge_method: "S256",
    code_challenge: base64url(hashed),
  });
  window.location = `https://accounts.spotify.com/authorize?${params}`;
}

async function getToken(code) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: localStorage.getItem("verifier"),
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Could not get a Spotify token");
  return data.access_token;
}

export default function App() {
  const [token, setToken] = useState(null);
  const [artists, setArtists] = useState([]);
  const [range, setRange] = useState("medium_term");
  const [error, setError] = useState("");
  const ranAuth = useRef(false);
  const posterRef = useRef(null);
  const [title, setTitle] = useState("MOSHTAPE FEST");
  const [themeKey, setThemeKey] = useState("sunset");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.min(1, (window.innerWidth - 32) / 540));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);



  async function download() {
    const url = await toPng(posterRef.current, { pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "my-lineup.png";
    link.href = url;
    link.click();
  }

  // After Spotify sends the user back, swap the code for a token
  useEffect(() => {
    if (ranAuth.current) return;
    ranAuth.current = true;
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      getToken(code)
        .then(setToken)
        .catch((e) => setError(e.message))
        .finally(() => window.history.replaceState({}, "", "/"));
    }
  }, []);

  // Load top artists whenever we have a token or the time range changes
  useEffect(() => {
    if (!token) return;
    fetch(
      `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${range}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(async (r) => {
        const text = await r.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`${r.status}: ${text}`);
        }
        if (data.error) throw new Error(`${r.status}: ${data.error.message}`);
        setArtists(data.items);
      })
      .catch((e) => setError(e.message));
  }, [token, range]);

  return (

    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>Moshtape</h1>

      {!token && <button onClick={login}>Log in with Spotify</button>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {token && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="short_term">Last 4 weeks</option>
              <option value="medium_term">Last 6 months</option>
              <option value="long_term">All time</option>
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.toUpperCase())}
              maxLength={20}
            />
            <button onClick={download}>Download PNG</button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setThemeKey(key)}
                style={{ fontWeight: key === themeKey ? "bold" : "normal" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, width: 540 * scale, height: 960 * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <Poster
                ref={posterRef}
                artists={artists}
                title={title}
                theme={THEMES[themeKey]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
