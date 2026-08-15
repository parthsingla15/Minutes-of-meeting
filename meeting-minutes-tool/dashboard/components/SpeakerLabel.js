"use client";

import { useState } from "react";

export default function SpeakerLabel({ meetingId, initialName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [currentName, setCurrentName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);

  // If the name doesn't look like a raw tag (e.g. it's already "Parth"), we can still let them edit it if they want.
  const isDefaultTag = currentName.startsWith("SPEAKER_");

  const handleSave = async () => {
    if (!name.trim() || name === currentName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/label-speaker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: meetingId,
          old_speaker_name: currentName,
          real_name: name.trim(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      setCurrentName(name.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to label speaker:", err);
      alert(`Error saving speaker name: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(currentName);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={isSaving}
        autoFocus
        style={{
          background: "#1c1f26",
          color: "#e6e6e6",
          border: "1px solid #4f8cff",
          borderRadius: "4px",
          padding: "2px 6px",
          fontSize: "13px",
          width: "100px",
          outline: "none",
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      title="Click to rename speaker"
      style={{
        color: isDefaultTag ? "#f0ad4e" : "#4f8cff", // Orange if unnamed, Blue if named
        cursor: "pointer",
        fontWeight: "bold",
        textDecoration: "underline dashed 1px rgba(255,255,255,0.3)",
        textUnderlineOffset: "3px",
      }}
    >
      {currentName}
    </span>
  );
}
