import { toPng } from "html-to-image";
import Poster from "./Poster";

import { useEffect, useRef, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
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
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Moshtape</h1>

      {!token && <button onClick={login}>Log in with Spotify</button>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {token && (
        <>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="short_term">Last 4 weeks</option>
            <option value="medium_term">Last 6 months</option>
            <option value="long_term">All time</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.toUpperCase())}
            maxLength={20}
            style={{ marginLeft: 8 }}
          />
          <button onClick={download} style={{ marginLeft: 8 }}>
            Download PNG
          </button>
          <div style={{ marginTop: 16 }}>
            <Poster ref={posterRef} artists={artists} title={title} />
          </div>
        </>
      )}
    </div>
  );
}
