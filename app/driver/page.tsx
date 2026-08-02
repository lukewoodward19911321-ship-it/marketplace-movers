"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";

type DatabaseJob = {
  id: string;
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

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DriverPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const today = getLocalDate();

  useEffect(() => {
    async function loadTodaysJobs() {
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
          .select(
            `
              id,
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
            `
          )
          .eq("user_id", user.id)
          .eq("job_date", today)
          .neq("status", "Cancelled")
          .order("job_time", { ascending: true });

        if (error) {
          throw error;
        }

        const formattedJobs: Job[] = ((data || []) as DatabaseJob[]).map(
          (job) => ({
            id: job.id,
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
          })
        );

        setJobs(formattedJobs);
      } catch (error: unknown) {
        console.error("Driver Mode load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "Today's jobs could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadTodaysJobs();
  }, [router, today]);

  async function updateStatus(id: string, status: string) {
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
      console.error("Driver Mode status error:", error);

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
      console.error("Driver Mode payment error:", error);

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

  const todaysRevenue = jobs.reduce(
    (total, job) => total + Number(job.price || 0),
    0
  );

  const outstanding = jobs
    .filter((job) => job.paymentStatus !== "Paid")
    .reduce(
      (total, job) => total + Number(job.price || 0),
      0
    );

  function cleanPhone(phone: string) {
    return phone.replace(/\s/g, "");
  }

  function whatsAppNumber(phone: string) {
    return cleanPhone(phone).replace(/^0/, "44");
  }

  function wazeLink(address: string) {
    return `https://waze.com/ul?q=${encodeURIComponent(
      address
    )}&navigate=yes`;
  }

  function statusColour(status: string) {
    switch (status) {
      case "On Route":
        return "#2563eb";

      case "In Progress":
        return "#0f766e";

      case "Completed":
        return "#15803d";

      case "Paid":
        return "#7c3aed";

      default:
        return "#b45309";
    }
  }

  const actionStyle = (background: string) => ({
    display: "inline-block",
    background,
    color: "white",
    textDecoration: "none",
    border: "none",
    borderRadius: "10px",
    padding: "13px 16px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  });

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
            maxWidth: "1100px",
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
                Driver Mode
              </h1>

              <p
                style={{
                  color: "#aab4c3",
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                Today&apos;s cloud jobs and quick actions.
              </p>
            </div>

            <Link
              href="/jobs/new"
              style={actionStyle("#1565ff")}
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
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>
                Today&apos;s Jobs
              </p>

              <strong style={summaryValueStyle}>
                {jobs.length}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>
                Today&apos;s Revenue
              </p>

              <strong style={summaryValueStyle}>
                £{todaysRevenue.toFixed(2)}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>Outstanding</p>

              <strong style={summaryValueStyle}>
                £{outstanding.toFixed(2)}
              </strong>
            </div>
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
                Loading today&apos;s jobs...
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Getting your schedule from Supabase.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                No jobs booked for today
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Add a cloud job for today and it will appear
                here.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "18px" }}>
              {jobs.map((job) => {
                const phone = cleanPhone(job.phone || "");
                const isBusy = busyJobId === job.id;

                return (
                  <article
                    key={job.id}
                    style={{
                      background: "#111823",
                      border: "1px solid #243247",
                      borderRadius: "18px",
                      padding: "22px",
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
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
                        <p
                          style={{
                            color: "#66a1ff",
                            fontWeight: "bold",
                            margin: "0 0 7px",
                            fontSize: "18px",
                          }}
                        >
                          {job.time || "Time not set"}
                        </p>

                        <h2 style={{ margin: "0 0 7px" }}>
                          {job.customer || "Unnamed customer"}
                        </h2>

                        <p
                          style={{
                            color: "#aab4c3",
                            margin: 0,
                          }}
                        >
                          {job.jobType || "Job"}
                        </p>
                      </div>

                      <span
                        style={{
                          background: statusColour(
                            job.status || "Booked"
                          ),
                          borderRadius: "999px",
                          padding: "8px 13px",
                          fontWeight: "bold",
                        }}
                      >
                        {job.status || "Booked"}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        color: "#cbd5e1",
                        lineHeight: 1.5,
                      }}
                    >
                      <p style={{ margin: "5px 0" }}>
                        <strong>Collection:</strong>{" "}
                        {job.collection || "Not supplied"}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Delivery:</strong>{" "}
                        {job.delivery || "Not supplied"}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Price:</strong> £
                        {job.price.toFixed(2)}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Payment:</strong>{" "}
                        {job.paymentStatus || "Not Paid"}
                      </p>

                      {job.notes && (
                        <p style={{ margin: "5px 0" }}>
                          <strong>Notes:</strong> {job.notes}
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
                      {phone && (
                        <>
                          <a
                            href={`tel:${phone}`}
                            style={actionStyle("#334155")}
                          >
                            Call
                          </a>

                          <a
                            href={`https://wa.me/${whatsAppNumber(
                              job.phone
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            style={actionStyle("#166534")}
                          >
                            WhatsApp
                          </a>
                        </>
                      )}

                      {job.collection && (
                        <a
                          href={wazeLink(job.collection)}
                          target="_blank"
                          rel="noreferrer"
                          style={actionStyle("#2563eb")}
                        >
                          Waze Collection
                        </a>
                      )}

                      {job.delivery && (
                        <a
                          href={wazeLink(job.delivery)}
                          target="_blank"
                          rel="noreferrer"
                          style={actionStyle("#1d4ed8")}
                        >
                          Waze Delivery
                        </a>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginTop: "14px",
                      }}
                    >
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(job.id, "On Route")
                        }
                        style={actionStyle("#1d4ed8")}
                      >
                        On Route
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(job.id, "In Progress")
                        }
                        style={actionStyle("#0f766e")}
                      >
                        In Progress
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(job.id, "Completed")
                        }
                        style={actionStyle("#15803d")}
                      >
                        Completed
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => markPaid(job.id)}
                        style={actionStyle("#7c3aed")}
                      >
                        Mark Paid
                      </button>

                      <Link
                        href={`/jobs/edit/${job.id}`}
                        style={actionStyle("#475569")}
                      >
                        Edit
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const summaryCardStyle = {
  background: "#111823",
  border: "1px solid #243247",
  borderRadius: "16px",
  padding: "22px",
};

const summaryTitleStyle = {
  color: "#96a3b5",
  margin: "0 0 10px",
  fontWeight: "bold",
};

const summaryValueStyle = {
  fontSize: "32px",
};