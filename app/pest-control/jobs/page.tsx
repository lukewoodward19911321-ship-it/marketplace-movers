"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

type JobStatus =
  | "Scheduled"
  | "In Progress"
  | "Follow Up"
  | "Completed"
  | "Overdue";

type Priority = "Normal" | "Urgent" | "Emergency";

type PestJob = {
  id: number;
  customer: string;
  phone: string;
  address: string;
  treatment: string;
  date: string;
  time: string;
  technician: string;
  status: JobStatus;
  priority: Priority;
  price: number;
  paid: boolean;
  notes: string;
};

const starterJobs: PestJob[] = [
  {
    id: 2087,
    customer: "Sarah Williams",
    phone: "07912 345678",
    address: "Oakfield Road, Bridgend, CF31",
    treatment: "Rats & Mice",
    date: "2026-08-04",
    time: "09:00",
    technician: "Luke Woodward",
    status: "In Progress",
    priority: "Urgent",
    price: 120,
    paid: false,
    notes: "Inspect kitchen, loft and rear garden. Check previous bait stations.",
  },
  {
    id: 2088,
    customer: "David Jones",
    phone: "07700 123456",
    address: "High Street, Porthcawl, CF36",
    treatment: "Wasp Nest Removal",
    date: "2026-08-04",
    time: "11:30",
    technician: "Luke Woodward",
    status: "Scheduled",
    priority: "Normal",
    price: 85,
    paid: false,
    notes: "Nest reported above rear bedroom window.",
  },
  {
    id: 2089,
    customer: "Lisa Brown",
    phone: "07888 654321",
    address: "Park Avenue, Swansea, SA1",
    treatment: "Ant Treatment",
    date: "2026-08-04",
    time: "14:00",
    technician: "Luke Woodward",
    status: "Follow Up",
    priority: "Normal",
    price: 95,
    paid: true,
    notes: "Follow-up visit after initial gel treatment.",
  },
  {
    id: 2090,
    customer: "Greenfield School",
    phone: "01792 123456",
    address: "School Road, Neath, SA10",
    treatment: "Rodent Inspection",
    date: "2026-08-05",
    time: "08:30",
    technician: "Luke Woodward",
    status: "Scheduled",
    priority: "Emergency",
    price: 150,
    paid: false,
    notes: "Reported activity near kitchen and waste-storage area.",
  },
  {
    id: 2091,
    customer: "John Evans",
    phone: "07444 555666",
    address: "Heol Y Felin, Bridgend, CF31",
    treatment: "Mole Control",
    date: "2026-08-03",
    time: "15:30",
    technician: "Luke Woodward",
    status: "Overdue",
    priority: "Urgent",
    price: 110,
    paid: false,
    notes: "Customer reports several fresh mole hills.",
  },
  {
    id: 2092,
    customer: "Acme Builders Ltd",
    phone: "01656 123456",
    address: "Industrial Estate, Bridgend, CF31",
    treatment: "Commercial Pest Inspection",
    date: "2026-08-02",
    time: "10:00",
    technician: "Luke Woodward",
    status: "Completed",
    priority: "Normal",
    price: 180,
    paid: true,
    notes: "Monthly commercial inspection completed.",
  },
];

const filters = [
  "All",
  "Today",
  "Scheduled",
  "In Progress",
  "Follow Up",
  "Completed",
  "Overdue",
] as const;

type Filter = (typeof filters)[number];

export default function PestJobsPage() {
  const [jobs, setJobs] = useState<PestJob[]>(starterJobs);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [message, setMessage] = useState("");

  const today = "2026-08-04";

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs
      .filter((job) => {
        if (filter === "Today") {
          return job.date === today;
        }

        if (filter !== "All") {
          return job.status === filter;
        }

        return true;
      })
      .filter((job) => {
        if (!query) return true;

        return [
          job.customer,
          job.phone,
          job.address,
          job.treatment,
          job.technician,
          String(job.id),
        ].some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
  }, [jobs, search, filter]);

  const jobsToday = jobs.filter((job) => job.date === today).length;

  const emergencyJobs = jobs.filter(
    (job) => job.priority === "Emergency",
  ).length;

  const revenueToday = jobs
    .filter((job) => job.date === today)
    .reduce((total, job) => total + job.price, 0);

  const outstanding = jobs
    .filter((job) => !job.paid)
    .reduce((total, job) => total + job.price, 0);

  const followUpsDue = jobs.filter(
    (job) => job.status === "Follow Up",
  ).length;

  function updateJob(
    id: number,
    updates: Partial<PestJob>,
    confirmation: string,
  ) {
    setJobs((current) =>
      current.map((job) =>
        job.id === id ? { ...job, ...updates } : job,
      ),
    );

    setMessage(confirmation);
  }

  function addNewJob() {
    const nextId = Math.max(...jobs.map((job) => job.id)) + 1;

    const newJob: PestJob = {
      id: nextId,
      customer: "New Customer",
      phone: "07900 000000",
      address: "Address required",
      treatment: "Pest Inspection",
      date: today,
      time: "16:30",
      technician: "Luke Woodward",
      status: "Scheduled",
      priority: "Normal",
      price: 0,
      paid: false,
      notes: "Edit this job to add the full details.",
    };

    setJobs((current) => [newJob, ...current]);
    setMessage(`New pest job #${nextId} created.`);
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#05070b",
    color: "white",
  } as const;

  const contentStyle = {
    flex: 1,
    minWidth: 0,
    padding: "28px",
  } as const;

  const panelStyle = {
    background: "#0b1411",
    border: "1px solid #284231",
    borderRadius: "16px",
    padding: "20px",
  } as const;

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "10px 13px",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  } as const;

  return (
    <div style={pageStyle}>
      <Header />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <main style={contentStyle}>
          <section
            style={{
              position: "relative",
              minHeight: "210px",
              marginBottom: "24px",
              overflow: "hidden",
              borderRadius: "18px",
              border: "1px solid #4d7c0f",
              background:
                "linear-gradient(90deg, rgba(2,8,5,.97), rgba(5,20,10,.78), rgba(5,20,10,.18)), url('/banners/pest-jobs.jpg') center/cover",
            }}
          >
            <div style={{ padding: "34px", maxWidth: "720px" }}>
              <div
                style={{
                  color: "#a3e635",
                  fontSize: "13px",
                  fontWeight: 900,
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                }}
              >
                Terminator Pest Control
              </div>

              <h1
                style={{
                  margin: "8px 0 8px",
                  fontSize: "clamp(38px, 6vw, 68px)",
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                }}
              >
                Pest <span style={{ color: "#84cc16" }}>Jobs</span>
              </h1>

              <p
                style={{
                  margin: "15px 0 22px",
                  color: "#d1d5db",
                  fontSize: "17px",
                }}
              >
                Manage bookings, treatments, follow-ups, reports and
                payments in one place.
              </p>

              <button
                type="button"
                onClick={addNewJob}
                style={{
                  ...buttonStyle,
                  background: "#65a30d",
                  padding: "12px 18px",
                }}
              >
                + Add New Pest Job
              </button>
            </div>
          </section>

          {message && (
            <div
              style={{
                marginBottom: "18px",
                padding: "13px 16px",
                borderRadius: "12px",
                background: "#16351f",
                border: "1px solid #3f7d45",
                color: "#bbf7d0",
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          )}

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "14px",
              marginBottom: "22px",
            }}
          >
            {[
              {
                label: "Jobs Today",
                value: jobsToday,
                detail: "Scheduled today",
                icon: "📋",
              },
              {
                label: "Emergency Call-outs",
                value: emergencyJobs,
                detail: "Needs priority",
                icon: "🚨",
              },
              {
                label: "Revenue Today",
                value: `£${revenueToday.toFixed(2)}`,
                detail: "Booked value",
                icon: "£",
              },
              {
                label: "Outstanding",
                value: `£${outstanding.toFixed(2)}`,
                detail: "Not yet paid",
                icon: "💳",
              },
              {
                label: "Follow-ups Due",
                value: followUpsDue,
                detail: "Further visits",
                icon: "🔁",
              },
            ].map((stat) => (
              <div key={stat.label} style={panelStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "12px",
                      background: "#17351f",
                      color: "#a3e635",
                      fontWeight: 900,
                      fontSize: "21px",
                    }}
                  >
                    {stat.icon}
                  </div>

                  <div>
                    <div style={{ color: "#91a79a", fontSize: "13px" }}>
                      {stat.label}
                    </div>
                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "27px",
                        fontWeight: 900,
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    color: "#718078",
                    fontSize: "13px",
                  }}
                >
                  {stat.detail}
                </div>
              </div>
            ))}
          </section>

          <section style={{ ...panelStyle, marginBottom: "20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px, 1fr) auto",
                gap: "14px",
                alignItems: "center",
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, phone, address, treatment or job number..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #35503f",
                  borderRadius: "11px",
                  background: "#07100d",
                  color: "white",
                  padding: "13px 15px",
                  fontSize: "15px",
                }}
              />

              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                Showing {filteredJobs.length} job
                {filteredJobs.length === 1 ? "" : "s"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  style={{
                    border:
                      filter === item
                        ? "1px solid #a3e635"
                        : "1px solid #31443a",
                    borderRadius: "999px",
                    background:
                      filter === item ? "#315314" : "#09110f",
                    color: "white",
                    padding: "8px 12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "15px" }}>
            {filteredJobs.map((job) => {
              const statusColour =
                job.status === "Completed"
                  ? "#166534"
                  : job.status === "In Progress"
                    ? "#0f766e"
                    : job.status === "Scheduled"
                      ? "#1d4ed8"
                      : job.status === "Follow Up"
                        ? "#7e22ce"
                        : "#b91c1c";

              const priorityColour =
                job.priority === "Emergency"
                  ? "#dc2626"
                  : job.priority === "Urgent"
                    ? "#c2410c"
                    : "#334155";

              return (
                <article key={job.id} style={panelStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#a3e635",
                          fontSize: "12px",
                          fontWeight: 900,
                          letterSpacing: "1px",
                        }}
                      >
                        JOB #{job.id}
                      </div>

                      <h2
                        style={{
                          margin: "6px 0 4px",
                          fontSize: "24px",
                        }}
                      >
                        {job.customer}
                      </h2>

                      <div style={{ color: "#b6c2bb" }}>
                        {job.treatment}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          padding: "7px 11px",
                          borderRadius: "999px",
                          background: priorityColour,
                          fontWeight: 900,
                          fontSize: "12px",
                        }}
                      >
                        {job.priority}
                      </span>

                      <span
                        style={{
                          padding: "7px 11px",
                          borderRadius: "999px",
                          background: statusColour,
                          fontWeight: 900,
                          fontSize: "12px",
                        }}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                      marginTop: "18px",
                    }}
                  >
                    {[
                      ["📅 Appointment", `${job.date} at ${job.time}`],
                      ["📍 Property", job.address],
                      ["☎ Phone", job.phone],
                      ["👤 Technician", job.technician],
                      ["£ Job Value", `£${job.price.toFixed(2)}`],
                      ["💳 Payment", job.paid ? "Paid" : "Not Paid"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          padding: "13px",
                          borderRadius: "11px",
                          background: "#07100d",
                          border: "1px solid #263a30",
                        }}
                      >
                        <div
                          style={{
                            color: "#789084",
                            fontSize: "12px",
                            marginBottom: "5px",
                          }}
                        >
                          {label}
                        </div>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: "14px",
                      padding: "13px",
                      borderRadius: "11px",
                      background: "#08110e",
                      color: "#b7c4bd",
                    }}
                  >
                    <strong style={{ color: "#a3e635" }}>Notes: </strong>
                    {job.notes}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "9px",
                      flexWrap: "wrap",
                      marginTop: "15px",
                    }}
                  >
                    <a
                      href={`tel:${job.phone.replace(/\s/g, "")}`}
                      style={{ ...buttonStyle, background: "#475569" }}
                    >
                      ☎ Call
                    </a>

                    <a
                      href={`https://wa.me/44${job.phone
                        .replace(/\s/g, "")
                        .replace(/^0/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...buttonStyle, background: "#15803d" }}
                    >
                      WhatsApp
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        job.address,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...buttonStyle, background: "#2563eb" }}
                    >
                      📍 Navigate
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        updateJob(
                          job.id,
                          { status: "In Progress" },
                          `Job #${job.id} started.`,
                        )
                      }
                      style={{ ...buttonStyle, background: "#0f766e" }}
                    >
                      ▶ Start Job
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setMessage(
                          `Photo upload for job #${job.id} will be connected next.`,
                        )
                      }
                      style={{ ...buttonStyle, background: "#334155" }}
                    >
                      📷 Photos
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setMessage(
                          `Treatment report for job #${job.id} will be connected next.`,
                        )
                      }
                      style={{ ...buttonStyle, background: "#334155" }}
                    >
                      📝 Report
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateJob(
                          job.id,
                          { status: "Follow Up" },
                          `Job #${job.id} marked for follow-up.`,
                        )
                      }
                      style={{ ...buttonStyle, background: "#7e22ce" }}
                    >
                      🔁 Follow Up
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateJob(
                          job.id,
                          { status: "Completed" },
                          `Job #${job.id} completed.`,
                        )
                      }
                      style={{ ...buttonStyle, background: "#15803d" }}
                    >
                      ✓ Complete
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateJob(
                          job.id,
                          { paid: true },
                          `Job #${job.id} marked as paid.`,
                        )
                      }
                      style={{ ...buttonStyle, background: "#6d28d9" }}
                    >
                      £ Mark Paid
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredJobs.length === 0 && (
              <div
                style={{
                  ...panelStyle,
                  padding: "40px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                No pest-control jobs match your search or filter.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}