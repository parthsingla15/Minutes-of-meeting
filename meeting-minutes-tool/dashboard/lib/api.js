import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.60.66.170:8000";

function getAuthHeaders() {
  const token = cookies().get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMeetings() {
  const res = await fetch(`${API_URL}/meetings`, { 
    cache: "no-store",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export async function fetchMeeting(id) {
  const res = await fetch(`${API_URL}/meetings/${id}`, { 
    cache: "no-store",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch meeting");
  return res.json();
}