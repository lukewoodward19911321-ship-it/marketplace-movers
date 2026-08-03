"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";

type DatabaseJob = {
  id: string;
  tracking_token: string | null;
  customer: string;
  phone: string;
  job_type: string;
  collection: string;
  delivery: string;
  job_date: string | null;
  job_time: string | null;
  price: number | string;
  mileage: number | string;
  payment_status: string;
  notes: string;
  status: string;
};

type Job = {
  id: string;
  trackingToken: string;
  customer: string;
  phone: string;
  jobType: string;
  collection: string;
  delivery: string;
  date: string;
  time: string;
  price: number;
  mileage: number;
  paymentStatus: string;
  notes: string;
  status: string;
};

const buttonStyle = (background: string) => ({
  background,
  color: "white",
  border: "none",
  borderRadius: "9px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
});


function whatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0044")) {
    return digits.slice(2);
  }

  if (digits.startsWith("44")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `44${digits.slice(1)}`;
  }

  return digits;
}

function formatBookingDate(date: string) {
  if (!date) {
    return "Date to be confirmed";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatBookingTime(time: string) {
  return time ? time.slice(0, 5) : "Time to be confirmed";
}

function buildWhatsAppConfirmation(job: Job) {
  const siteOrigin =
    window.location.hostname === "localhost"
      ? "https://marketplace-movers.vercel.app"
      : window.location.origin;

  const trackingLink = job.trackingToken
    ? `${siteOrigin}/track/${job.trackingToken}`
    : "";

  return [
    `Hi ${job.customer || "there"},`,
    "",
    "Your Marketplace Movers booking is confirmed.",
    "",
    `Job: ${job.jobType || "Moving job"}`,
    `Date: ${formatBookingDate(job.date)}`,
    `Time: ${formatBookingTime(job.time)}`,
    `Collection: ${job.collection || "To be confirmed"}`,
    `Delivery: ${job.delivery || "To be confirmed"}`,
    "",
    trackingLink
      ? `You can view your booking and track the driver here:\n${trackingLink}`
      : "",
    "",
    "Thank you,",
    "Marketplace Movers",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("jobs")
          .select(`
            id,
            tracking_token,
            customer,
            phone,
            job_type,
            collection,
            delivery,
            job_date,
            job_time,
            price,
            mileage,
            payment_status,
            notes,
            status
          `)
          .eq("user_id", user.id)
          .order("job_date", { ascending: true })
          .order("job_time", { ascending: true });

        if (error) {
          throw error;
        }

        const formattedJobs: Job[] = (
          (data || []) as DatabaseJob[]
        ).map((job) => ({
          id: job.id,
          trackingToken: job.tracking_token || "",
          customer: job.customer || "",
          phone: job.phone || "",
          jobType: job.job_type || "",
          collection: job.collection || "",
          delivery: job.delivery || "",
          date: job.job_date || "",
          time: job.job_time
            ? job.job_time.slice(0, 5)
            : "",
          price: Number(job.price || 0),
          mileage: Number(job.mileage || 0),
          paymentStatus: job.payment_status || "Not Paid",
          notes: job.notes || "",
          status: job.status || "Booked",
        }));

        setJobs(formattedJobs);
      } catch (error: unknown) {
        console.error("Supabase jobs load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "The jobs could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [router]);

  async function updateJobStatus(
    id: string,
    status: string
  ) {
    setBusyJobId(id);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === id ? { ...job, status } : job
        )
      );
    } catch (error: unknown) {
      console.error("Supabase status update error:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The job status could not be updated.";

      setErrorMessage(message);
    } finally {
      setBusyJobId(null);
    }
  }

  async function markPaid(id: string) {
    setBusyJobId(id);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          payment_status: "Paid",
          status: "Paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === id
            ? {
                ...job,
                paymentStatus: "Paid",
                status: "Paid",
              }
            : job
        )
      );
    } catch (error: unknown) {
      console.error("Supabase payment update error:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The payment status could not be updated.";

      setErrorMessage(message);
    } finally {
      setBusyJobId(null);
    }
  }

  async function deleteJob(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmed) {
      return;
    }

    setBusyJobId(id);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setJobs((currentJobs) =>
        currentJobs.filter((job) => job.id !== id)
      );
    } catch (error: unknown) {
      console.error("Supabase delete error:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The job could not be deleted.";

      setErrorMessage(message);
    } finally {
      setBusyJobId(null);
    }
  }

  async function copyTrackingLink(job: Job) {
    if (!job.trackingToken) {
      setErrorMessage(
        "This job does not have a tracking link."
      );
      return;
    }

    const trackingLink =
      `${window.location.origin}/track/${job.trackingToken}`;

    try {
      await navigator.clipboard.writeText(trackingLink);

      setCopiedJobId(job.id);

      window.setTimeout(() => {
        setCopiedJobId(null);
      }, 2000);
    } catch {
      window.prompt(
        "Copy this tracking link:",
        trackingLink
      );
    }
  }


  function openBookingConfirmationOnWhatsApp(job: Job) {
    const number = whatsAppNumber(job.phone);

    if (!number) {
      setErrorMessage("This job does not have a valid phone number.");
      return;
    }

    const message = buildWhatsAppConfirmation(job);
    const whatsappUrl =
      `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  }

  async function shareTrackingOnWhatsApp(job: Job) {
    if (!job.trackingToken) {
      setErrorMessage(
        "This job does not have a tracking link."
      );
      return;
    }

    const trackingLink =
      `${window.location.origin}/track/${job.trackingToken}`;

    const message =
      `Hi ${job.customer || "there"}, you can track your ` +
      `Marketplace Movers booking here: ${trackingLink}`;

    const phoneNumber = (job.phone || "")
      .replace(/\s/g, "")
      .replace(/^0/, "44");

    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          message
        )}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const filteredJobs = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return jobs
      .filter((job) => {
        if (statusFilter === "All") {
          return true;
        }

        return job.status === statusFilter;
      })
      .filter((job) => {
        if (!searchText) {
          return true;
        }

        return [
          job.customer,
          job.phone,
          job.jobType,
          job.collection,
          job.delivery,
          job.status,
          job.paymentStatus,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchText);
      })
      .sort((a, b) => {
        const first = `${a.date || ""} ${a.time || ""}`;
        const second = `${b.date || ""} ${b.time || ""}`;

        return first.localeCompare(second);
      });
  }, [jobs, search, statusFilter]);

  function getStatusColour(status: string) {
    switch (status) {
      case "On Route":
        return "#2563eb";

      case "In Progress":
        return "#0f766e";

      case "Completed":
        return "#15803d";

      case "Paid":
        return "#7c3aed";

      case "Cancelled":
        return "#b91c1c";

      default:
        return "#b45309";
    }
  }

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
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "38px",
                  margin: "0 0 8px",
                }}
              >
                Jobs
              </h1>

              <p
                style={{
                  color: "#aab4c3",
                  margin: 0,
                  fontSize: "18px",
                }}
              >
                Search, update and manage your cloud bookings.
              </p>
            </div>

            <Link
              href="/jobs/new"
              style={buttonStyle("#1565ff")}
            >
              + Add New Job
            </Link>
          </div>

          {errorMessage && (
            <div
              style={{
                background: "#451a1a",
                border: "1px solid #991b1b",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              {errorMessage}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) minmax(180px, 240px)",
              gap: "12px",
              marginBottom: "22px",
            }}
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer, phone, address or job type..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                background: "#111823",
                color: "white",
                border: "1px solid #2a3a50",
                borderRadius: "12px",
                fontSize: "16px",
              }}
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              style={{
                width: "100%",
                padding: "14px",
                background: "#111823",
                color: "white",
                border: "1px solid #2a3a50",
                borderRadius: "12px",
                fontSize: "16px",
              }}
            >
              <option>All</option>
              <option>Booked</option>
              <option>On Route</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Paid</option>
              <option>Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Loading jobs...
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Getting your bookings from Supabase.
              </p>
            </div>
          ) : (
            <>
              <p style={{ color: "#96a3b5" }}>
                Showing {filteredJobs.length} job
                {filteredJobs.length === 1 ? "" : "s"}
              </p>

              {filteredJobs.length === 0 ? (
                <div
                  style={{
                    background: "#111823",
                    border: "1px solid #243247",
                    borderRadius: "16px",
                    padding: "28px",
                  }}
                >
                  <h2 style={{ marginTop: 0 }}>
                    No jobs found
                  </h2>

                  <p
                    style={{
                      color: "#96a3b5",
                      marginBottom: 0,
                    }}
                  >
                    Add a new cloud job or change your search
                    and filter.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                  }}
                >
                  {filteredJobs.map((job) => {
                    const status = job.status || "Booked";

                    const phoneNumber = (
                      job.phone || ""
                    ).replace(/\s/g, "");

                    const isBusy =
                      busyJobId === job.id;

                    return (
                      <article
                        key={job.id}
                        style={{
                          background: "#111823",
                          border: "1px solid #243247",
                          borderRadius: "16px",
                          padding: "22px",
                          opacity: isBusy ? 0.7 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "flex-start",
                            gap: "18px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h2
                              style={{
                                margin: "0 0 8px",
                              }}
                            >
                              {job.customer ||
                                "Unnamed customer"}
                            </h2>

                            <p
                              style={{
                                color: "#aab4c3",
                                margin: "4px 0",
                              }}
                            >
                              {job.jobType || "Job"}
                            </p>
                          </div>

                          <span
                            style={{
                              background:
                                getStatusColour(status),
                              borderRadius: "999px",
                              padding: "8px 13px",
                              fontWeight: "bold",
                            }}
                          >
                            {status}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(210px, 1fr))",
                            gap: "12px",
                            marginTop: "18px",
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            <strong>Date:</strong>{" "}
                            {job.date || "No date"}
                            {job.time
                              ? ` at ${job.time}`
                              : ""}
                          </p>

                          <p style={{ margin: 0 }}>
                            <strong>Phone:</strong>{" "}
                            {job.phone || "Not supplied"}
                          </p>

                          <p style={{ margin: 0 }}>
                            <strong>Price:</strong> £
                            {job.price.toFixed(2)}
                          </p>

                          <p style={{ margin: 0 }}>
                            <strong>Mileage:</strong>{" "}
                            {job.mileage.toFixed(1)} miles
                          </p>

                          <p style={{ margin: 0 }}>
                            <strong>Payment:</strong>{" "}
                            {job.paymentStatus ||
                              "Not Paid"}
                          </p>
                        </div>

                        <div
                          style={{
                            marginTop: "16px",
                            lineHeight: 1.5,
                            color: "#c5cfdb",
                          }}
                        >
                          <p style={{ margin: "5px 0" }}>
                            <strong>Collection:</strong>{" "}
                            {job.collection ||
                              "Not supplied"}
                          </p>

                          <p style={{ margin: "5px 0" }}>
                            <strong>Delivery:</strong>{" "}
                            {job.delivery ||
                              "Not supplied"}
                          </p>

                          {job.notes && (
                            <p
                              style={{
                                margin: "5px 0",
                              }}
                            >
                              <strong>Notes:</strong>{" "}
                              {job.notes}
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "20px",
                          }}
                        >
                          <Link
                            href={`/jobs/edit/${job.id}`}
                            style={buttonStyle("#475569")}
                          >
                            Edit
                          </Link>

                          {phoneNumber && (
                            <>
                              <a
                                href={`tel:${phoneNumber}`}
                                style={buttonStyle(
                                  "#334155"
                                )}
                              >
                                Call
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  openBookingConfirmationOnWhatsApp(job)
                                }
                                style={buttonStyle("#166534")}
                              >
                                WhatsApp
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              copyTrackingLink(job)
                            }
                            style={buttonStyle("#9333ea")}
                          >
                            {copiedJobId === job.id
                              ? "Link Copied ✓"
                              : "Copy Tracking Link"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              shareTrackingOnWhatsApp(job)
                            }
                            style={buttonStyle("#15803d")}
                          >
                            Send Tracking Link
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              updateJobStatus(
                                job.id,
                                "On Route"
                              )
                            }
                            style={buttonStyle("#1d4ed8")}
                          >
                            On Route
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              updateJobStatus(
                                job.id,
                                "In Progress"
                              )
                            }
                            style={buttonStyle("#0f766e")}
                          >
                            In Progress
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              updateJobStatus(
                                job.id,
                                "Completed"
                              )
                            }
                            style={buttonStyle("#15803d")}
                          >
                            Complete
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              markPaid(job.id)
                            }
                            style={buttonStyle("#7c3aed")}
                          >
                            Mark Paid
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              updateJobStatus(
                                job.id,
                                "Cancelled"
                              )
                            }
                            style={buttonStyle("#92400e")}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              deleteJob(job.id)
                            }
                            style={buttonStyle("#b91c1c")}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}