"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = "movers" | "pest";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [business, setBusiness] = useState<Business>("movers");

  useEffect(() => {
    if (pathname.startsWith("/pest-control")) {
      setBusiness("pest");
      window.localStorage.setItem("active-business", "pest");
    } else {
      setBusiness("movers");
      window.localStorage.setItem("active-business", "movers");
    }
  }, [pathname]);

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

  const moversLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Driver Workflow", href: "/driver" },
    { name: "Job Planner", href: "/jobs" },
    { name: "Calendar", href: "/calendar" },
    { name: "Customers", href: "/customers" },
    { name: "Finance", href: "/finance" },
    { name: "Expenses", href: "/expenses" },
  ];

  const pestLinks = [
    { name: "Pest Dashboard", href: "/pest-control" },
    { name: "Technician Workflow", href: "/pest-control/technician" },
    { name: "Pest Jobs", href: "/pest-control/jobs" },
    { name: "Customers", href: "/pest-control/customers" },
    { name: "Reports", href: "/pest-control/reports" },
    { name: "Treatments", href: "/pest-control/treatments" },
    { name: "Calendar", href: "/pest-control/calendar" },
    { name: "Finance", href: "/pest-control/finance" },
  ];

  const links = business === "movers" ? moversLinks : pestLinks;

  return (
    <header
      style={{
        background: "#05070b",
        borderBottom:
          business === "movers"
            ? "3px solid #1565ff"
            : "3px solid #65a30d",
      }}
    >
      <img
        src="/marketplace-banner.jpg"
        alt={
          business === "movers"
            ? "Marketplace Movers"
            : "Terminator Pest Control"
        }
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          maxHeight: "320px",
          objectFit: "cover",
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