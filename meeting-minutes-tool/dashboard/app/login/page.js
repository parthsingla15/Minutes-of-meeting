"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Background3D from "../../components/Background3D";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const action = isLogin ? "login" : "register";
    try {
      const res = await fetch(`/api/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Authentication failed");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0c10 0%, #1a1d24 100%)",
        color: "#e6e6e6",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <Background3D />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(10, 12, 16, 0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 24,
          padding: 40,
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.8)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #4f8cff 0%, #a44fff 100%)",
              borderRadius: 12,
              margin: "0 auto 16px",
            }}
          />
          <h1 style={{ fontSize: 24, margin: "0 0 8px 0", fontWeight: 700 }}>
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p style={{ color: "#9aa0a6", fontSize: 14, margin: 0 }}>
            {isLogin
              ? "Enter your credentials to access your meetings."
              : "Sign up to start organizing your minutes."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  color: "#ff6b6b",
                  background: "rgba(255, 107, 107, 0.1)",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  border: "1px solid rgba(255, 107, 107, 0.2)",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#9aa0a6", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#0d0f14",
                border: "1px solid #2a2d35",
                borderRadius: 8,
                color: "white",
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f8cff")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2d35")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#9aa0a6", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#0d0f14",
                border: "1px solid #2a2d35",
                borderRadius: 8,
                color: "white",
                fontSize: 15,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4f8cff")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2d35")}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: 8,
              background: "linear-gradient(135deg, #4f8cff 0%, #2f6cdb 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              boxShadow: "0 4px 14px 0 rgba(79, 140, 255, 0.3)",
            }}
          >
            {isLoading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </motion.button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#9aa0a6" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            style={{
              color: "#4f8cff",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </div>
      </motion.div>
    </main>
  );
}
