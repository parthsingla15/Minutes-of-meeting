import Link from "next/link";
import { fetchMeeting } from "../../../lib/api";
import DownloadButton from "../../../components/DownloadButton";
import SpeakerLabel from "../../../components/SpeakerLabel";

export default async function MeetingDetailPage({ params }) {
  const meeting = await fetchMeeting(params.id);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <Link href="/" style={{ color: "#4f8cff", fontSize: 13, textDecoration: "none" }}>
        ← Back to meetings
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>{meeting.title}</h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {new Date(meeting.created_at).toLocaleString()}
          </p>
        </div>
        <DownloadButton meeting={meeting} />
      </div>

      <Section title="Summary">
        <p style={{ color: "#ccc", lineHeight: 1.5 }}>{meeting.summary}</p>
      </Section>

      <Section title="Key Points">
        <ul style={{ color: "#ccc", lineHeight: 1.6 }}>
          {meeting.key_points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section title="Decisions">
        <ul style={{ color: "#ccc", lineHeight: 1.6 }}>
          {meeting.decisions.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </Section>

      <Section title="Action Items">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {meeting.action_items.map((a, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                background: "#1a1d24",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <strong>{a.owner}</strong> — {a.task}
              {a.due && <span style={{ color: "#9aa0a6" }}> (due {a.due})</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Transcript">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          {meeting.transcript.map((seg, i) => (
            <div key={i}>
              <SpeakerLabel meetingId={meeting.id} initialName={seg.speaker} />{" "}
              <span style={{ color: "#666" }}>[{seg.start}s]</span>{" "}
              <span style={{ color: "#ccc" }}>{seg.text}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 14, color: "#9aa0a6", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}