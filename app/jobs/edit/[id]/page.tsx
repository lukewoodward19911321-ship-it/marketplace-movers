"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import Sidebar from "../../../../components/Sidebar";
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

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();

  const jobId = Array.isArray(params.id)
    ? params.id[0]
    : String(params.id || "");

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      setNotFound(false);
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
          .eq("id", jobId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          setNotFound(true);
          return;
        }

        const databaseJob = data as DatabaseJob;

        setJob({
          id: databaseJob.id,
          customer: databaseJob.customer || "",
          phone: databaseJob.phone || "",
          jobType: databaseJob.job_type || "",
          collection: databaseJob.collection || "",
          delivery: databaseJob.delivery || "",
          date: databaseJob.job_date || "",
          time: databaseJob.job_time
            ? databaseJob.job_time.slice(0, 5)
            : "",
          price: Number(databaseJob.price || 0),
          mileage: Number(databaseJob.mileage || 0),
          paymentStatus:
            databaseJob.payment_status || "Not Paid",
          notes: databaseJob.notes || "",
          status: databaseJob.status || "Booked",
        });
      } catch (error: unknown) {
        console.error("Supabase job load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "The job could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      loadJob();
    } else {
      setLoading(false);
      setNotFound(true);
    }
  }, [jobId, router]);

  function updateField(
    field: keyof Job,
    value: string | number
  ) {
    setJob((currentJob) =>
      currentJob
        ? {
            ...currentJob,
            [field]: value,
          }
        : currentJob
    );
  }

  async function saveJob(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!job) {
      return;
    }

    setSaving(true);
    setSaved(false);
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

      const { error } = await supabase
        .from("jobs")
        .update({
          customer: job.customer,
          phone: job.phone,
          job_type: job.jobType,
          collection: job.collection,
          delivery: job.delivery,
          job_date: job.date || null,
          job_time: job.time || null,
          price: Number(job.price || 0),
          mileage: Number(job.mileage || 0),
          payment_status: job.paymentStatus,
          notes: job.notes,
          status: job.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setSaved(true);

      setTimeout(() => {
        router.push("/jobs");
      }, 900);
    } catch (error: unknown) {
      console.error("Supabase job update error:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The job could not be saved.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "13px",
    marginTop: "7px",
    background: "#0b111b",
    color: "white",
    border: "1px solid #2a3a50",
    borderRadius: "10px",
    fontSize: "16px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    color: "#c8d2df",
    fontWeight: "bold",
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "#070b12",
    color: "white",
    fontFamily: "Arial, sans-serif",
  };

  if (loading) {
    return (
      <main style={pageStyle}>
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
              maxWidth: "900px",
              margin: "0 auto",
              padding: "35px 24px",
            }}
          >
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h1 style={{ marginTop: 0 }}>
                Loading job...
              </h1>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Getting the booking from Supabase.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (notFound || !job) {
    return (
      <main style={pageStyle}>
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
              maxWidth: "900px",
              margin: "0 auto",
              padding: "35px 24px",
            }}
          >
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h1 style={{ marginTop: 0 }}>
                Job not found
              </h1>

              {errorMessage && (
                <p
                  style={{
                    background: "#451a1a",
                    border: "1px solid #991b1b",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={() => router.push("/jobs")}
                style={{
                  background: "#1565ff",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px 20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Back to Jobs
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
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
            maxWidth: "900px",
            margin: "0 auto",
            padding: "35px 24px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/jobs")}
            style={{
              background: "transparent",
              color: "#4b8cff",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            ← Back to Jobs
          </button>

          <div
            style={{
              background: "#111823",
              border: "1px solid #243247",
              borderRadius: "18px",
              padding: "28px",
            }}
          >
            <h1
              style={{
                marginTop: 0,
                fontSize: "34px",
              }}
            >
              Edit Job
            </h1>

            <p
              style={{
                color: "#96a3b5",
                marginBottom: "28px",
              }}
            >
              Update the cloud booking and customer details.
            </p>

            <form onSubmit={saveJob}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "18px",
                }}
              >
                <label style={labelStyle}>
                  Customer name
                  <input
                    value={job.customer}
                    onChange={(event) =>
                      updateField(
                        "customer",
                        event.target.value
                      )
                    }
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Phone number
                  <input
                    type="tel"
                    value={job.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Job type
                  <input
                    value={job.jobType}
                    onChange={(event) =>
                      updateField(
                        "jobType",
                        event.target.value
                      )
                    }
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Date
                  <input
                    type="date"
                    value={job.date}
                    onChange={(event) =>
                      updateField(
                        "date",
                        event.target.value
                      )
                    }
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Booked time
                  <input
                    type="time"
                    value={job.time}
                    onChange={(event) =>
                      updateField(
                        "time",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Price (£)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={job.price}
                    onChange={(event) =>
                      updateField(
                        "price",
                        Number(event.target.value)
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Collection address
                  <input
                    value={job.collection}
                    onChange={(event) =>
                      updateField(
                        "collection",
                        event.target.value
                      )
                    }
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Delivery address
                  <input
                    value={job.delivery}
                    onChange={(event) =>
                      updateField(
                        "delivery",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Mileage
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={job.mileage}
                    onChange={(event) =>
                      updateField(
                        "mileage",
                        Number(event.target.value)
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Payment status
                  <select
                    value={job.paymentStatus}
                    onChange={(event) =>
                      updateField(
                        "paymentStatus",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    <option>Not Paid</option>
                    <option>Deposit Paid</option>
                    <option>Paid</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Job status
                  <select
                    value={job.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  >
                    <option>Booked</option>
                    <option>On Route</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Paid</option>
                    <option>Cancelled</option>
                  </select>
                </label>
              </div>

              <label
                style={{
                  ...labelStyle,
                  marginTop: "18px",
                }}
              >
                Notes
                <textarea
                  rows={5}
                  value={job.notes}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              {saved && (
                <p
                  style={{
                    background: "#12351f",
                    border: "1px solid #258343",
                    padding: "12px",
                    borderRadius: "10px",
                    marginTop: "20px",
                  }}
                >
                  Changes saved successfully.
                </p>
              )}

              {errorMessage && (
                <p
                  style={{
                    background: "#451a1a",
                    border: "1px solid #991b1b",
                    padding: "12px",
                    borderRadius: "10px",
                    marginTop: "20px",
                  }}
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: "22px",
                  background: "#1565ff",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "14px 24px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}