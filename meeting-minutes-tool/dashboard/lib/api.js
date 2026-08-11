const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMeetings() {
  const res = await fetch(`${API_URL}/meetings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export async function fetchMeeting(id) {
  const res = await fetch(`${API_URL}/meetings/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch meeting");
  return res.json();
}