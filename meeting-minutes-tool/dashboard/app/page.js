import Link from "next/link";
import { fetchMeetings } from "../lib/api";
import MeetingList from "../components/MeetingList";

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
        {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
      </p>

      {error && <p style={{ color: "#ff6b6b" }}>Couldn't load meetings: {error}</p>}

      {!error && (
        <div style={{ marginTop: 20 }}>
          <MeetingList initialMeetings={meetings} />
        </div>
      )}
    </main>
  );
}