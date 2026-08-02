"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type TrackingJob = {
  customer: string;
  job_type: string;
  collection: string;
  delivery: string;
  job_date: string | null;
  job_time: string | null;
  status: string;
};

const trackingSteps = [
  "Booked",
  "On Route",
  "In Progress",
  "Completed",
];

export default function TrackingPage() {
  const params = useParams();

  const token = Array.isArray(params.token)
    ? params.token[0]
    : String(params.token || "");

  const [job, setJob] = useState<TrackingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTracking() {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          "get_public_job_tracking",
          {
            p_tracking_token: token,
          }
        );

        if (error) {
          throw error;
        }

        const trackingJob =
          Array.isArray(data) && data.length > 0
            ? (data[0] as TrackingJob)
            : null;

        if (!trackingJob) {
          setJob(null);
          setNotFound(true);
          return;
        }

        setJob(trackingJob);
        setNotFound(false);
        setErrorMessage("");
      } catch (error: unknown) {
        console.error("Tracking load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "Tracking information could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadTracking();

    const refreshTimer = window.setInterval(() => {
      loadTracking();
    }, 15000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [token]);

  function formatDate(date: string | null) {
    if (!date) {
      return "Date not set";
    }

    return new Date(`${date}T12:00:00`).toLocaleDateString(
      "en-GB",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatTime(time: string | null) {
    if (!time) {
      return "Time not set";
    }

    return time.slice(0, 5);
  }

  function currentStep(status: string) {
    if (status === "Paid") {
      return trackingSteps.indexOf("Completed");
    }

    if (status === "Cancelled") {
      return -1;
    }

    const index = trackingSteps.indexOf(status);

    return index >= 0 ? index : 0;
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>
            Marketplace Movers
          </h1>

          <p style={{ color: "#aab4c3" }}>
            Loading your tracking information...
          </p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>
            Tracking link unavailable
          </h1>

          <p style={{ color: "#aab4c3" }}>
            This tracking link is invalid, expired or has been
            disabled.
          </p>
        </div>
      </main>
    );
  }

  if (!job) {
    return null;
  }

  const activeStep = currentStep(job.status);

  return (
    <main style={pageStyle}>
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "22px",
          }}
        >
          <h1
            style={{
              fontSize: "34px",
              margin: "0 0 8px",
            }}
          >
            Marketplace Movers
          </h1>

          <p
            style={{
              color: "#96a3b5",
              margin: 0,
            }}
          >
            Live booking status
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "#451a1a",
              border: "1px solid #991b1b",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "18px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={cardStyle}>
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
                  color: "#96a3b5",
                  margin: "0 0 6px",
                }}
              >
                Booking for
              </p>

              <h2 style={{ margin: 0 }}>
                {job.customer || "Customer"}
              </h2>
            </div>

            <span
              style={{
                background:
                  job.status === "Cancelled"
                    ? "#b91c1c"
                    : "#1565ff",
                borderRadius: "999px",
                padding: "9px 14px",
                fontWeight: "bold",
              }}
            >
              {job.status || "Booked"}
            </span>
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "grid",
              gap: "12px",
            }}
          >
            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Job
              </span>
              <strong>{job.job_type || "Moving job"}</strong>
            </div>

            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Date and time
              </span>
              <strong>
                {formatDate(job.job_date)} at{" "}
                {formatTime(job.job_time)}
              </strong>
            </div>

            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Collection
              </span>
              <strong>
                {job.collection || "Not supplied"}
              </strong>
            </div>

            <div style={detailBoxStyle}>
              <span style={detailLabelStyle}>
                Delivery
              </span>
              <strong>
                {job.delivery || "Not supplied"}
              </strong>
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "18px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Delivery progress
          </h2>

          {job.status === "Cancelled" ? (
            <div
              style={{
                background: "#451a1a",
                border: "1px solid #991b1b",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              This booking has been cancelled. Please contact
              Marketplace Movers if you need assistance.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {trackingSteps.map((step, index) => {
                const complete = index <= activeStep;
                const current = index === activeStep;

                return (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      background: current
                        ? "#102446"
                        : "#0b111b",
                      border: current
                        ? "1px solid #2f7cff"
                        : "1px solid #26364c",
                      borderRadius: "12px",
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        background: complete
                          ? "#1565ff"
                          : "#26364c",
                        fontWeight: "bold",
                      }}
                    >
                      {complete ? "✓" : index + 1}
                    </div>

                    <div>
                      <strong>{step}</strong>

                      {current && (
                        <p
                          style={{
                            color: "#8bb8ff",
                            margin: "4px 0 0",
                            fontSize: "14px",
                          }}
                        >
                          Current status
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p
            style={{
              color: "#718096",
              fontSize: "13px",
              marginBottom: 0,
              marginTop: "18px",
            }}
          >
            This page refreshes automatically every 15 seconds.
          </p>
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#070b12",
  color: "white",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "35px 18px",
};

const cardStyle = {
  background: "#111823",
  border: "1px solid #243247",
  borderRadius: "18px",
  padding: "24px",
};

const detailBoxStyle = {
  background: "#0b111b",
  border: "1px solid #26364c",
  borderRadius: "12px",
  padding: "14px",
  display: "grid",
  gap: "6px",
};

const detailLabelStyle = {
  color: "#96a3b5",
  fontSize: "13px",
};