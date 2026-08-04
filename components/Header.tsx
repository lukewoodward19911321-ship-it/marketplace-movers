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
    const currentBusiness =
      pathname.startsWith("/pest-control") ? "pest" : "movers";

    setBusiness(currentBusiness);
    window.localStorage.setItem("active-business", currentBusiness);
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
    { name: "Treatments", href: "/pest-control/treatments" },
    { name: "Reports", href: "/pest-control/reports" },
    { name: "Calendar", href: "/pest-control/calendar" },
    { name: "Finance", href: "/pest-control/finance" },
  ];

  const links = business === "movers" ? moversLinks : pestLinks;

  const banner = (() => {

  // Marketplace Movers
  if (!pathname.startsWith("/pest-control")) {

    if (pathname === "/")
      return "/banners/marketplace-dashboard.jpg";

    if (pathname.startsWith("/driver"))
      return "/banners/marketplace-driver.jpg";

    if (pathname.startsWith("/jobs"))
      return "/banners/marketplace-jobs.jpg";

    if (pathname.startsWith("/customers"))
      return "/banners/marketplace-customers.jpg";

    if (pathname.startsWith("/calendar"))
      return "/banners/marketplace-calendar.jpg";

    if (pathname.startsWith("/finance"))
      return "/banners/marketplace-finance.jpg";

    if (pathname.startsWith("/expenses"))
      return "/banners/marketplace-expenses.jpg";

    return "/banners/marketplace-dashboard.jpg";
  }

  // Pest Control
  if (pathname === "/pest-control")
    return "/banners/pest-dashboard.jpg";

  if (pathname.startsWith("/pest-control/technician"))
    return "/banners/pest-technician.jpg";

  if (pathname.startsWith("/pest-control/jobs"))
    return "/banners/pest-jobs.jpg";

  if (pathname.startsWith("/pest-control/customers"))
    return "/banners/pest-customers.jpg";

  if (pathname.startsWith("/pest-control/treatments"))
    return "/banners/pest-treatments.jpg";

  if (pathname.startsWith("/pest-control/reports"))
    return "/banners/pest-reports.jpg";

  if (pathname.startsWith("/pest-control/calendar"))
    return "/banners/pest-calendar.jpg";

  if (pathname.startsWith("/pest-control/finance"))
    return "/banners/pest-finance.jpg";

  return "/banners/pest-dashboard.jpg";

})();

  const accent =
    business === "movers"
      ? "#1565ff"
      : "#65a30d";

  return (
    <header
      style={{
        background: "#05070b",
        borderBottom: `3px solid ${accent}`,
      }}
    >
      {/* Banner */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          background: "#05070b",
        }}
      >
        <img
          src={banner}
          alt={business === "movers"
            ? "Marketplace Movers"
            : "Terminator Pest Control"}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          padding: "16px 28px",
          flexWrap: "wrap",
        }}
      >
        <nav
          style={{
            display: "flex",
            gap: "26px",
            overflowX: "auto",
            flex: 1,
          }}
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: active ? accent : "#ffffff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "16px",
                  paddingBottom: "5px",
                  borderBottom: active
                    ? `2px solid ${accent}`
                    : "2px solid transparent",
                  transition: "all .2s",
                  whiteSpace: "nowrap",
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {email && (
            <span
              style={{
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              {email}
            </span>
          )}

          <button
            onClick={logout}
            disabled={loggingOut}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontWeight: 700,
              cursor: loggingOut ? "wait" : "pointer",
            }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}