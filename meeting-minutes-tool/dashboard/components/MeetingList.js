"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MeetingList({ initialMeetings }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} meeting(s)?`)) return;

    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      router.refresh(); // Refresh the Server Component data
    } catch (err) {
      alert("Failed to delete meetings: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (initialMeetings.length === 0) {
    return <p style={{ color: "#9aa0a6", marginTop: 20 }}>No meetings yet.</p>;
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              background: "#ff4d4d",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {isDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {initialMeetings.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#1a1d24",
              border: selectedIds.has(m.id) ? "1px solid #4f8cff" : "1px solid #2a2d35",
              borderRadius: 10,
              padding: "0 16px",
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(m.id)}
              onChange={() => toggleSelect(m.id)}
              style={{ transform: "scale(1.2)", cursor: "pointer" }}
            />
            
            <Link
              href={`/meeting/${m.id}`}
              style={{
                flex: 1,
                padding: "16px 0",
                textDecoration: "none",
                color: "#e6e6e6",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{m.title || "Processing..."}</div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: m.status === "done" ? "#1f4f2f" : m.status === "failed" ? "#4f1f1f" : "#3f3f1f",
                    color: m.status === "done" ? "#6fdc8c" : m.status === "failed" ? "#ff8f8f" : "#e0d060",
                  }}
                >
                  {m.status}
                </span>
              </div>
              {m.summary && (
                <div style={{ fontSize: 13, color: "#9aa0a6", marginTop: 4 }}>{m.summary}</div>
              )}
              <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
                {new Date(m.created_at).toLocaleString()}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
