"use client";

import Link from "next/link";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

export default function PestControlDashboard() {
  const cards = [
    {
      title: "Today's Visits",
      value: "0",
      subtitle: "Pest-control visits today",
    },
    {
      title: "Active Jobs",
      value: "0",
      subtitle: "Jobs currently being treated",
    },
    {
      title: "Follow-ups Due",
      value: "0",
      subtitle: "Visits requiring attention",
    },
    {
      title: "Outstanding",
      value: "£0.00",
      subtitle: "Unpaid pest-control work",
    },
    {
      title: "Completed This Month",
      value: "0",
      subtitle: "Jobs successfully closed",
    },
    {
      title: "Monthly Revenue",
      value: "£0.00",
      subtitle: "Pest-control income",
    },
  ];

  const quickActions = [
    {
      name: "+ Add Pest Job",
      href: "/pest-control/jobs/new",
      colour: "#65a30d",
    },
    {
      name: "Today's Visits",
      href: "/pest-control/technician",
      colour: "#2563eb",
    },
    {
      name: "Create Report",
      href: "/pest-control/reports",
      colour: "#7c3aed",
    },
    {
      name: "View Calendar",
      href: "/pest-control/calendar",
      colour: "#0f766e",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#070b12",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Header />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Sidebar />

        <section
          style={{
            flex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "35px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "30px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#84cc16",
                  fontWeight: "bold",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontSize: "13px",
                }}
              >
                Terminator Pest Control
              </p>

              <h1
                style={{
                  fontSize: "38px",
                  margin: "0 0 8px",
                }}
              >
                Pest Control Dashboard
              </h1>

              <p
                style={{
                  color: "#aab4c3",
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                Manage treatments, follow-ups, reports and customers.
              </p>
            </div>

            <Link
              href="/pest-control/jobs/new"
              style={{
                background: "#65a30d",
                color: "white",
                textDecoration: "none",
                borderRadius: "10px",
                padding: "14px 20px",
                fontWeight: "bold",
              }}
            >
              + Add Pest Job
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >
            {cards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: "#111823",
                  border: "1px solid #243247",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <p
                  style={{
                    color: "#96a3b5",
                    marginTop: 0,
                    marginBottom: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {card.title}
                </p>

                <strong style={{ fontSize: "34px" }}>
                  {card.value}
                </strong>

                <p
                  style={{
                    color: "#718096",
                    marginBottom: 0,
                    fontSize: "14px",
                  }}
                >
                  {card.subtitle}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "25px",
              background: "#111823",
              border: "1px solid #243247",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Quick Actions
            </h2>

            <p
              style={{
                color: "#96a3b5",
                marginTop: "-4px",
                marginBottom: "20px",
              }}
            >
              Start common pest-control tasks.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    background: action.colour,
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "10px",
                    padding: "13px 18px",
                    fontWeight: "bold",
                  }}
                >
                  {action.name}
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "25px",
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "18px",
            }}
          >
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Today's Visits
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                No pest-control visits are booked for today.
              </p>
            </div>

            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Follow-ups Due
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                No follow-up visits are currently due.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}