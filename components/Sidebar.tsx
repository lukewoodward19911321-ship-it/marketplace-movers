"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Business = "movers" | "pest";

export default function Sidebar() {
  const [business, setBusiness] = useState<Business>("movers");

  useEffect(() => {
    const savedBusiness = localStorage.getItem("active-business");

    if (savedBusiness === "movers" || savedBusiness === "pest") {
      setBusiness(savedBusiness);
    }
  }, []);

  function changeBusiness(value: Business) {
    setBusiness(value);
    localStorage.setItem("active-business", value);
  }

  const moversLinks = [
    { name: "🏠 Dashboard", href: "/" },
    { name: "🚚 Driver Workflow", href: "/driver" },
    { name: "📋 Job Planner", href: "/jobs" },
    { name: "👥 Customers", href: "/customers" },
    { name: "📅 Calendar", href: "/calendar" },
    { name: "💷 Finance", href: "/finance" },
    { name: "🧾 Expenses", href: "/expenses" },
  ];

  const pestLinks = [
    { name: "🏠 Pest Dashboard", href: "/pest-control" },
    { name: "🧰 Technician Workflow", href: "/pest-control/technician" },
    { name: "🐀 Pest Jobs", href: "/pest-control/jobs" },
    { name: "👥 Customers", href: "/pest-control/customers" },
    { name: "📝 Reports", href: "/pest-control/reports" },
    { name: "🧪 Treatments", href: "/pest-control/treatments" },
    { name: "📅 Calendar", href: "/pest-control/calendar" },
    { name: "💷 Finance", href: "/pest-control/finance" },
  ];

  const links = business === "movers" ? moversLinks : pestLinks;

  return (
    <aside
      style={{
        width: "260px",
        minWidth: "260px",
        minHeight: "100vh",
        background: "#05070b",
        borderRight: "1px solid #243247",
        padding: "24px 18px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <p
          style={{
            margin: "0 0 8px",
            color: "#718096",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Active business
        </p>

        <select
          value={business}
          onChange={(event) =>
            changeBusiness(event.target.value as Business)
          }
          style={{
            width: "100%",
            padding: "12px",
            color: "white",
            background: "#111823",
            border: "1px solid #31425b",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          <option value="movers">🚚 Marketplace Movers</option>
          <option value="pest">🐀 Terminator Pest Control</option>
        </select>
      </div>

      <div style={{ marginBottom: "22px" }}>
        <h2
          style={{
            margin: 0,
            color: "white",
            fontSize: "21px",
          }}
        >
          {business === "movers"
            ? "Marketplace Movers"
            : "Terminator Pest Control"}
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: "#718096",
            fontSize: "13px",
          }}
        >
          {business === "movers"
            ? "Moving business control centre"
            : "Pest-control management"}
        </p>
      </div>

      <nav
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: "white",
              textDecoration: "none",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#111823",
              fontWeight: "bold",
            }}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div
        style={{
          marginTop: "20px",
          paddingTop: "18px",
          borderTop: "1px solid #243247",
        }}
      >
        <Link
          href="/settings"
          style={{
            display: "block",
            color: "white",
            textDecoration: "none",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#111823",
            fontWeight: "bold",
          }}
        >
          ⚙ Settings
        </Link>
      </div>
    </aside>
  );
}