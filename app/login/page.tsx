"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#070b12",
        color: "white",
        fontFamily: "Arial, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
    >
      <form
        onSubmit={login}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#111823",
          border: "1px solid #243247",
          borderRadius: "18px",
          padding: "28px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Marketplace Movers</h1>

        <p
          style={{
            color: "#96a3b5",
            marginBottom: "25px",
          }}
        >
          Sign in to your business control centre.
        </p>

        <label
          style={{
            display: "block",
            fontWeight: "bold",
            marginBottom: "18px",
          }}
        >
          Email address

          <input
            name="email"
            type="email"
            required
            style={inputStyle}
          />
        </label>

        <label
          style={{
            display: "block",
            fontWeight: "bold",
          }}
        >
          Password

          <input
            name="password"
            type="password"
            required
            style={inputStyle}
          />
        </label>

        {message && (
          <p
            style={{
              background: "#451a1a",
              border: "1px solid #991b1b",
              borderRadius: "10px",
              padding: "12px",
              marginTop: "18px",
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "22px",
            background: "#1565ff",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "14px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "8px",
  padding: "13px",
  background: "#0b111b",
  color: "white",
  border: "1px solid #2a3a50",
  borderRadius: "10px",
  fontSize: "16px",
};