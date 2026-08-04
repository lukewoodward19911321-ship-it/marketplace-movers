"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

type WorkflowStep =
  | "Scheduled"
  | "Travelling"
  | "Arrived"
  | "Inspection"
  | "Treatment"
  | "Report"
  | "Complete";

type PestJob = {
  id: number;
  time: string;
  customer: string;
  phone: string;
  address: string;
  treatment: string;
  status: WorkflowStep;
  price: number;
  notes: string;
};

const workflowSteps: WorkflowStep[] = [
  "Scheduled",
  "Travelling",
  "Arrived",
  "Inspection",
  "Treatment",
  "Report",
  "Complete",
];

const starterJobs: PestJob[] = [
  {
    id: 2087,
    time: "09:00",
    customer: "Sarah Williams",
    phone: "07912 345678",
    address: "Oakfield Road, Bridgend, CF31",
    treatment: "Rats & Mice",
    status: "Treatment",
    price: 120,
    notes: "Inspect kitchen and rear garden. Check previous bait stations.",
  },
  {
    id: 2088,
    time: "11:30",
    customer: "David Jones",
    phone: "07700 123456",
    address: "High Street, Porthcawl, CF36",
    treatment: "Wasp Nest Removal",
    status: "Scheduled",
    price: 85,
    notes: "Nest reported above rear bedroom window.",
  },
  {
    id: 2089,
    time: "14:00",
    customer: "Lisa Brown",
    phone: "07888 654321",
    address: "Park Avenue, Swansea, SA1",
    treatment: "Ant Treatment",
    status: "Scheduled",
    price: 95,
    notes: "Activity around kitchen units and patio doors.",
  },
];

export default function TechnicianWorkflowPage() {
  const [jobs, setJobs] = useState<PestJob[]>(starterJobs);
  const [selectedJobId, setSelectedJobId] = useState(starterJobs[0].id);
  const [jobNotes, setJobNotes] = useState(starterJobs[0].notes);
  const [message, setMessage] = useState("");

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) || jobs[0];

  const activeStepIndex = workflowSteps.indexOf(selectedJob.status);

  const completedJobs = jobs.filter(
    (job) => job.status === "Complete",
  ).length;

  const revenueToday = jobs
    .filter((job) => job.status === "Complete")
    .reduce((total, job) => total + job.price, 0);

  const nextStep = useMemo(() => {
    const currentIndex = workflowSteps.indexOf(selectedJob.status);

    if (currentIndex >= workflowSteps.length - 1) {
      return null;
    }

    return workflowSteps[currentIndex + 1];
  }, [selectedJob.status]);

  function selectJob(job: PestJob) {
    setSelectedJobId(job.id);
    setJobNotes(job.notes);
    setMessage("");
  }

  function updateStatus(status: WorkflowStep) {
    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === selectedJob.id ? { ...job, status } : job,
      ),
    );

    setMessage(`Job #${selectedJob.id} updated to ${status}.`);
  }

  function moveToNextStep() {
    if (!nextStep) {
      setMessage("This job is already complete.");
      return;
    }

    updateStatus(nextStep);
  }

  function saveNotes() {
    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === selectedJob.id
          ? { ...job, notes: jobNotes }
          : job,
      ),
    );

    setMessage("Job notes saved.");
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#05070b",
    color: "white",
  } as const;

  const layoutStyle = {
    display: "flex",
    minHeight: "calc(100vh - 100px)",
  } as const;

  const contentStyle = {
    flex: 1,
    minWidth: 0,
    padding: "28px",
  } as const;

  const panelStyle = {
    background: "#0c1512",
    border: "1px solid #24422f",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  } as const;

  const smallLabelStyle = {
    color: "#8dd84a",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "1.4px",
    textTransform: "uppercase",
  } as const;

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "11px 15px",
    fontWeight: 800,
    cursor: "pointer",
  } as const;

  return (
    <div style={pageStyle}>
      <Header />

      <div style={layoutStyle}>
        <Sidebar />

        <main style={contentStyle}>
          <section
            style={{
              position: "relative",
              overflow: "hidden",
              border: "1px solid #4d7c0f",
              borderRadius: "18px",
              minHeight: "220px",
              marginBottom: "24px",
              background:
                "linear-gradient(90deg, rgba(2,8,5,.98) 0%, rgba(5,20,10,.90) 48%, rgba(5,20,10,.25) 100%), url('/banners/pest-technician.jpg') center/cover",
            }}
          >
            <div
              style={{
                maxWidth: "720px",
                padding: "34px",
              }}
            >
              <div style={smallLabelStyle}>Terminator Pest Control</div>

              <h1
                style={{
                  margin: "8px 0 6px",
                  fontSize: "clamp(34px, 5vw, 64px)",
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                }}
              >
                Technician{" "}
                <span style={{ color: "#84cc16" }}>Workflow</span>
              </h1>

              <p
                style={{
                  margin: "16px 0 24px",
                  color: "#d1d5db",
                  fontSize: "17px",
                }}
              >
                Plan your day, complete treatments and keep every job
                properly documented.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  "📍 Live jobs",
                  "🧪 Treatment records",
                  "📷 Photos and reports",
                  "✅ Customer sign-off",
                ].map((item) => (
                  <span
                    key={item}
                    style={{
                      background: "rgba(132,204,22,.12)",
                      border: "1px solid rgba(132,204,22,.35)",
                      borderRadius: "999px",
                      padding: "9px 13px",
                      fontWeight: 700,
                      color: "#d9f99d",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {message && (
            <div
              style={{
                marginBottom: "20px",
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
                label: "Today's Jobs",
                value: jobs.length,
                detail: "Scheduled visits",
                icon: "📋",
              },
              {
                label: "Completed",
                value: completedJobs,
                detail: "Finished today",
                icon: "✅",
              },
              {
                label: "In Progress",
                value: jobs.filter(
                  (job) =>
                    job.status !== "Scheduled" &&
                    job.status !== "Complete",
                ).length,
                detail: "Active treatments",
                icon: "🧪",
              },
              {
                label: "Revenue Today",
                value: `£${revenueToday.toFixed(2)}`,
                detail: "Completed job value",
                icon: "£",
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
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      background: "#16351f",
                      color: "#a3e635",
                      fontSize: "22px",
                      fontWeight: 900,
                    }}
                  >
                    {stat.icon}
                  </div>

                  <div>
                    <div style={{ color: "#9ca3af", fontSize: "13px" }}>
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
                    color: "#779184",
                    fontSize: "13px",
                    marginTop: "12px",
                  }}
                >
                  {stat.detail}
                </div>
              </div>
            ))}
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(280px, 0.85fr) minmax(420px, 1.65fr)",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <div style={panelStyle}>
              <div style={smallLabelStyle}>Today&apos;s schedule</div>
              <h2 style={{ margin: "7px 0 18px" }}>Your jobs</h2>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {jobs.map((job) => {
                  const selected = job.id === selectedJob.id;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => selectJob(job)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        color: "white",
                        padding: "15px",
                        borderRadius: "12px",
                        border: selected
                          ? "1px solid #84cc16"
                          : "1px solid #273831",
                        background: selected ? "#17341e" : "#09110f",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <strong style={{ fontSize: "16px" }}>
                          {job.time} · {job.treatment}
                        </strong>

                        <span
                          style={{
                            borderRadius: "999px",
                            padding: "5px 9px",
                            background:
                              job.status === "Complete"
                                ? "#166534"
                                : job.status === "Scheduled"
                                  ? "#1e3a5f"
                                  : "#854d0e",
                            fontSize: "11px",
                            fontWeight: 800,
                          }}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div
                        style={{
                          color: "#b8c4bd",
                          marginTop: "8px",
                        }}
                      >
                        {job.customer}
                      </div>

                      <div
                        style={{
                          color: "#718078",
                          marginTop: "4px",
                          fontSize: "13px",
                        }}
                      >
                        {job.address}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              <div style={panelStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={smallLabelStyle}>
                      Current job #{selectedJob.id}
                    </div>

                    <h2
                      style={{
                        margin: "7px 0 4px",
                        fontSize: "28px",
                      }}
                    >
                      {selectedJob.treatment}
                    </h2>

                    <div style={{ color: "#a9b6af" }}>
                      {selectedJob.customer}
                    </div>
                  </div>

                  <span
                    style={{
                      background: "#3f6212",
                      color: "#ecfccb",
                      padding: "8px 13px",
                      borderRadius: "999px",
                      fontWeight: 800,
                    }}
                  >
                    {selectedJob.status}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "12px",
                    marginTop: "20px",
                  }}
                >
                  {[
                    ["📍 Address", selectedJob.address],
                    ["☎ Customer phone", selectedJob.phone],
                    ["🕒 Appointment", selectedJob.time],
                    ["£ Job value", `£${selectedJob.price.toFixed(2)}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        background: "#08110e",
                        border: "1px solid #253b30",
                        borderRadius: "12px",
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          color: "#7ca088",
                          fontSize: "12px",
                          marginBottom: "6px",
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
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "18px",
                  }}
                >
                  <a
                    href={`tel:${selectedJob.phone.replace(/\s/g, "")}`}
                    style={{
                      ...buttonStyle,
                      color: "white",
                      textDecoration: "none",
                      background: "#374151",
                    }}
                  >
                    ☎ Call Customer
                  </a>

                  <a
                    href={`https://wa.me/44${selectedJob.phone
                      .replace(/\s/g, "")
                      .replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...buttonStyle,
                      color: "white",
                      textDecoration: "none",
                      background: "#15803d",
                    }}
                  >
                    WhatsApp
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedJob.address,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...buttonStyle,
                      color: "white",
                      textDecoration: "none",
                      background: "#2563eb",
                    }}
                  >
                    📍 Navigate
                  </a>
                </div>
              </div>

              <div style={panelStyle}>
                <div style={smallLabelStyle}>Treatment progress</div>
                <h2 style={{ margin: "7px 0 20px" }}>
                  Complete each stage
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(115px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {workflowSteps.map((step, index) => {
                    const complete = index < activeStepIndex;
                    const active = index === activeStepIndex;

                    return (
                      <button
                        type="button"
                        key={step}
                        onClick={() => updateStatus(step)}
                        style={{
                          padding: "14px 8px",
                          borderRadius: "12px",
                          border: active
                            ? "2px solid #a3e635"
                            : complete
                              ? "1px solid #22c55e"
                              : "1px solid #34433b",
                          background: active
                            ? "#315314"
                            : complete
                              ? "#12351e"
                              : "#09110f",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            margin: "0 auto 8px",
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            background: complete
                              ? "#16a34a"
                              : active
                                ? "#84cc16"
                                : "#26352e",
                            color: active ? "#071006" : "white",
                            fontWeight: 900,
                          }}
                        >
                          {complete ? "✓" : index + 1}
                        </div>

                        <strong style={{ fontSize: "12px" }}>{step}</strong>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={moveToNextStep}
                  disabled={!nextStep}
                  style={{
                    ...buttonStyle,
                    marginTop: "18px",
                    width: "100%",
                    padding: "14px",
                    background: nextStep ? "#65a30d" : "#374151",
                    color: "white",
                    cursor: nextStep ? "pointer" : "not-allowed",
                  }}
                >
                  {nextStep
                    ? `Continue to: ${nextStep}`
                    : "Job completed"}
                </button>
              </div>

              <div style={panelStyle}>
                <div style={smallLabelStyle}>Inspection and job notes</div>
                <h2 style={{ margin: "7px 0 15px" }}>
                  Technician notes
                </h2>

                <textarea
                  value={jobNotes}
                  onChange={(event) => setJobNotes(event.target.value)}
                  placeholder="Record inspection findings, pest activity, entry points, bait used and customer advice..."
                  style={{
                    width: "100%",
                    minHeight: "130px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid #35503f",
                    background: "#07100d",
                    color: "white",
                    fontFamily: "inherit",
                    fontSize: "15px",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={saveNotes}
                    style={{
                      ...buttonStyle,
                      background: "#65a30d",
                      color: "white",
                    }}
                  >
                    Save Notes
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        "Photo upload section will be connected next.",
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#334155",
                      color: "white",
                    }}
                  >
                    📷 Add Photos
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        "Treatment report section will be connected next.",
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#334155",
                      color: "white",
                    }}
                  >
                    📝 Create Report
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}