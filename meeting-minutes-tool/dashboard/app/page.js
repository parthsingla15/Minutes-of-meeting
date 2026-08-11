import Link from "next/link";
import { fetchMeetings } from "../lib/api";

export default async function HomePage() {
  let meetings = [];
  let error = null;

  try {
    meetings = await fetchMeetings();
  } catch (e) {
    error = e.message;
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Meetings</h1>
      <p style={{ color: "#9aa0a6", fontSize: 13, marginTop: 0 }}>
        {meetings.length} processed meeting{meetings.length !== 1 ? "s" : ""}
      </p>

      {error && (
        <p style={{ color: "#ff6b6b" }}>Couldn't load meetings: {error}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {meetings.map((m) => (
          <Link
            key={m.id}
            href={`/meeting/${m.id}`}
            style={{
              display: "block",
              padding: 16,
              borderRadius: 10,
              background: "#1a1d24",
              border: "1px solid #2a2d35",
              textDecoration: "none",
              color: "#e6e6e6",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>{m.title}</div>
            <div style={{ fontSize: 13, color: "#9aa0a6", marginTop: 4 }}>
              {m.summary}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
              {new Date(m.created_at).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      {meetings.length === 0 && !error && (
        <p style={{ color: "#9aa0a6", marginTop: 20 }}>
          No meetings yet — process one from the desktop app first.
        </p>
      )}
    </main>
  );
}