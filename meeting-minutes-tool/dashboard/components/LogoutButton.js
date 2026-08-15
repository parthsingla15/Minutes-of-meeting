"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "transparent",
        color: "#9aa0a6",
        border: "1px solid #2a2d35",
        padding: "6px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        e.target.style.color = "#fff";
        e.target.style.borderColor = "#4f8cff";
      }}
      onMouseOut={(e) => {
        e.target.style.color = "#9aa0a6";
        e.target.style.borderColor = "#2a2d35";
      }}
    >
      Sign Out
    </button>
  );
}
