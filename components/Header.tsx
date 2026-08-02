"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const links = [
    { name: "Dashboard", href: "/" },
    { name: "Driver Mode", href: "/driver" },
    { name: "Jobs", href: "/jobs" },
    { name: "Calendar", href: "/calendar" },
    { name: "Customers", href: "/customers" },
    { name: "Finance", href: "/finance" },
    { name: "Expenses", href: "/expenses" },
  ];

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
    }

    loadUser();
  }, [router]);

  async function logout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        background: "#05070b",
        borderBottom: "3px solid #1565ff",
      }}
    >
      <img
        src="/marketplace-banner.jpg"
        alt="Marketplace Movers"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          padding: "16px 30px",
          flexWrap: "wrap",
        }}
      >
        <nav
          style={{
            display: "flex",
            gap: "24px",
            overflowX: "auto",
            fontWeight: "bold",
            flex: 1,
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: "white",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {email && (
            <span
              style={{
                color: "#96a3b5",
                fontSize: "14px",
              }}
            >
              {email}
            </span>
          )}

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            style={{
              background: "#b91c1c",
              color: "white",
              border: "none",
              borderRadius: "9px",
              padding: "10px 14px",
              fontWeight: "bold",
              cursor: loggingOut ? "wait" : "pointer",
              opacity: loggingOut ? 0.7 : 1,
            }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}