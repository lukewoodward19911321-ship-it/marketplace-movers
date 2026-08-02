"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  live_tracking_enabled: boolean;
  driver_latitude: number | null;
  driver_longitude: number | null;
  driver_location_accuracy: number | null;
  driver_location_updated_at: string | null;
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
  liveTrackingEnabled: boolean;
  driverLatitude: number | null;
  driverLongitude: number | null;
  driverLocationAccuracy: number | null;
  driverLocationUpdatedAt: string;
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
  const [locationMessage, setLocationMessage] = useState("");
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  const [activeTrackingJobId, setActiveTrackingJobId] =
    useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastLocationSentRef = useRef(0);

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
            status,
            live_tracking_enabled,
            driver_latitude,
            driver_longitude,
            driver_location_accuracy,
            driver_location_updated_at
          `)
          .eq("user_id", user.id)
          .eq("job_date", today)
          .neq("status", "Cancelled")
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
          liveTrackingEnabled: Boolean(
            job.live_tracking_enabled
          ),
          driverLatitude: job.driver_latitude,
          driverLongitude: job.driver_longitude,
          driverLocationAccuracy:
            job.driver_location_accuracy,
          driverLocationUpdatedAt:
            job.driver_location_updated_at || "",
        }));

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

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, []);

  async function updateStatus(
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

  async function saveLocation(
    jobId: string,
    position: GeolocationPosition
  ) {
    const now = Date.now();

    if (
      lastLocationSentRef.current !== 0 &&
      now - lastLocationSentRef.current < 5000
    ) {
      return;
    }

    lastLocationSentRef.current = now;

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("jobs")
      .update({
        live_tracking_enabled: true,
        driver_latitude: latitude,
        driver_longitude: longitude,
        driver_location_accuracy: accuracy,
        driver_location_updated_at: updatedAt,
        updated_at: updatedAt,
      })
      .eq("id", jobId);

    if (error) {
      console.error("Location update error:", error);

      setErrorMessage(
        `Location could not be updated: ${error.message}`
      );

      return;
    }

    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              liveTrackingEnabled: true,
              driverLatitude: latitude,
              driverLongitude: longitude,
              driverLocationAccuracy: accuracy,
              driverLocationUpdatedAt: updatedAt,
            }
          : job
      )
    );

    setLocationMessage(
      `Live location updated. Accuracy: approximately ${Math.round(
        accuracy
      )} metres.`
    );
  }

  async function startLiveTracking(job: Job) {
    setErrorMessage("");
    setLocationMessage("");

    if (!window.isSecureContext) {
      setErrorMessage(
        "Live location requires the secure Vercel website. Open marketplace-movers.vercel.app on your phone."
      );
      return;
    }

    if (!navigator.geolocation) {
      setErrorMessage(
        "Location services are not supported by this browser."
      );
      return;
    }

    setBusyJobId(job.id);

    try {
      if (
        watchIdRef.current !== null &&
        activeTrackingJobId
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;

        await supabase
          .from("jobs")
          .update({
            live_tracking_enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeTrackingJobId);

        setJobs((currentJobs) =>
          currentJobs.map((currentJob) =>
            currentJob.id === activeTrackingJobId
              ? {
                  ...currentJob,
                  liveTrackingEnabled: false,
                }
              : currentJob
          )
        );
      }

      const { error } = await supabase
        .from("jobs")
        .update({
          live_tracking_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) {
        throw error;
      }

      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? {
                ...currentJob,
                liveTrackingEnabled: true,
              }
            : currentJob
        )
      );

      setActiveTrackingJobId(job.id);
      lastLocationSentRef.current = 0;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          void saveLocation(job.id, position);
        },
        async (locationError) => {
          console.error(
            "Geolocation error:",
            locationError
          );

          let message =
            "Your location could not be accessed.";

          if (locationError.code === 1) {
            message =
              "Location permission was denied. Allow location access in your browser settings.";
          }

          if (locationError.code === 2) {
            message =
              "Your phone could not determine its location. Make sure GPS is switched on.";
          }

          if (locationError.code === 3) {
            message =
              "Location request timed out. Try going outside or checking GPS.";
          }

          setErrorMessage(message);

          await supabase
            .from("jobs")
            .update({
              live_tracking_enabled: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          setJobs((currentJobs) =>
            currentJobs.map((currentJob) =>
              currentJob.id === job.id
                ? {
                    ...currentJob,
                    liveTrackingEnabled: false,
                  }
                : currentJob
            )
          );

          setActiveTrackingJobId(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 3000,
        }
      );

      watchIdRef.current = watchId;

      setLocationMessage(
        "Live tracking started. Keep Driver Mode open while travelling."
      );
    } catch (error: unknown) {
      console.error(
        "Start live tracking error:",
        error
      );

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "Live tracking could not be started.";

      setErrorMessage(message);
    } finally {
      setBusyJobId(null);
    }
  }

  async function stopLiveTracking(jobId: string) {
    setBusyJobId(jobId);
    setErrorMessage("");
    setLocationMessage("");

    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;
      }

      const { error } = await supabase
        .from("jobs")
        .update({
          live_tracking_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) {
        throw error;
      }

      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                liveTrackingEnabled: false,
              }
            : job
        )
      );

      if (activeTrackingJobId === jobId) {
        setActiveTrackingJobId(null);
      }

      setLocationMessage(
        "Live tracking has been stopped."
      );
    } catch (error: unknown) {
      console.error(
        "Stop live tracking error:",
        error
      );

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "Live tracking could not be stopped.";

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
      await navigator.clipboard.writeText(
        trackingLink
      );

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

  function sendTrackingLink(job: Job) {
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

    const phoneNumber = whatsAppNumber(job.phone);

    const url = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          message
        )}`
      : `https://wa.me/?text=${encodeURIComponent(
          message
        )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const todaysRevenue = jobs.reduce(
    (total, job) =>
      total + Number(job.price || 0),
    0
  );

  const outstanding = jobs
    .filter(
      (job) => job.paymentStatus !== "Paid"
    )
    .reduce(
      (total, job) =>
        total + Number(job.price || 0),
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

  function formatLocationTime(value: string) {
    if (!value) {
      return "Waiting for location";
    }

    return new Date(value).toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  }

  const actionStyle = (background: string) => ({
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50px",
    background,
    color: "white",
    textDecoration: "none",
    border: "none",
    borderRadius: "12px",
    padding: "13px 17px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    boxSizing: "border-box" as const,
    textAlign: "center" as const,
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
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "28px 16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "36px",
                  margin: "0 0 8px",
                }}
              >
                Driver Mode
              </h1>

              <p
                style={{
                  color: "#aab4c3",
                  fontSize: "17px",
                  margin: 0,
                }}
              >
                Today&apos;s jobs, navigation and
                live tracking.
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
                border:
                  "1px solid #991b1b",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {locationMessage && (
            <div
              style={{
                background: "#12351f",
                border:
                  "1px solid #258343",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              {locationMessage}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "14px",
              marginBottom: "22px",
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
              <p style={summaryTitleStyle}>
                Outstanding
              </p>

              <strong style={summaryValueStyle}>
                £{outstanding.toFixed(2)}
              </strong>
            </div>
          </div>

          {loading ? (
            <div style={emptyCardStyle}>
              <h2 style={{ marginTop: 0 }}>
                Loading today&apos;s jobs...
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Getting your schedule from
                Supabase.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div style={emptyCardStyle}>
              <h2 style={{ marginTop: 0 }}>
                No jobs booked for today
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Add a job for today and it will
                appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "18px",
              }}
            >
              {jobs.map((job) => {
                const phone = cleanPhone(
                  job.phone || ""
                );

                const isBusy =
                  busyJobId === job.id;

                const trackingIsActive =
                  activeTrackingJobId ===
                    job.id ||
                  job.liveTrackingEnabled;

                return (
                  <article
                    key={job.id}
                    style={{
                      background: "#111823",
                      border:
                        trackingIsActive
                          ? "2px solid #22c55e"
                          : "1px solid #243247",
                      borderRadius: "18px",
                      padding: "20px",
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
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
                            fontSize: "19px",
                          }}
                        >
                          {job.time ||
                            "Time not set"}
                        </p>

                        <h2
                          style={{
                            margin: "0 0 7px",
                            fontSize: "25px",
                          }}
                        >
                          {job.customer ||
                            "Unnamed customer"}
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

                      <div
                        style={{
                          display: "grid",
                          justifyItems: "end",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            background:
                              statusColour(
                                job.status ||
                                  "Booked"
                              ),
                            borderRadius:
                              "999px",
                            padding: "9px 14px",
                            fontWeight: "bold",
                          }}
                        >
                          {job.status ||
                            "Booked"}
                        </span>

                        {trackingIsActive && (
                          <span
                            style={{
                              background:
                                "#166534",
                              borderRadius:
                                "999px",
                              padding:
                                "7px 12px",
                              fontWeight: "bold",
                              fontSize: "13px",
                            }}
                          >
                            ● GPS LIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        display: "grid",
                        gap: "8px",
                        color: "#cbd5e1",
                        lineHeight: 1.5,
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        <strong>
                          Collection:
                        </strong>{" "}
                        {job.collection ||
                          "Not supplied"}
                      </p>

                      <p style={{ margin: 0 }}>
                        <strong>
                          Delivery:
                        </strong>{" "}
                        {job.delivery ||
                          "Not supplied"}
                      </p>

                      <p style={{ margin: 0 }}>
                        <strong>Price:</strong> £
                        {job.price.toFixed(2)}
                      </p>

                      <p style={{ margin: 0 }}>
                        <strong>
                          Payment:
                        </strong>{" "}
                        {job.paymentStatus ||
                          "Not Paid"}
                      </p>

                      {job.notes && (
                        <p style={{ margin: 0 }}>
                          <strong>Notes:</strong>{" "}
                          {job.notes}
                        </p>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: "22px 0 12px",
                        color: "#cbd5e1",
                      }}
                    >
                      Live van tracking
                    </h3>

                    <div
                      style={{
                        background:
                          trackingIsActive
                            ? "#0d2c1a"
                            : "#0b111b",
                        border:
                          trackingIsActive
                            ? "1px solid #258343"
                            : "1px solid #26364c",
                        borderRadius: "12px",
                        padding: "14px",
                        marginBottom: "12px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontWeight: "bold",
                        }}
                      >
                        {trackingIsActive
                          ? "Live tracking is active"
                          : "Live tracking is off"}
                      </p>

                      <p
                        style={{
                          color: "#aab4c3",
                          margin: 0,
                          fontSize: "14px",
                        }}
                      >
                        Last update:{" "}
                        {formatLocationTime(
                          job.driverLocationUpdatedAt
                        )}
                      </p>

                      {job.driverLocationAccuracy !==
                        null && (
                        <p
                          style={{
                            color: "#aab4c3",
                            margin:
                              "5px 0 0",
                            fontSize: "14px",
                          }}
                        >
                          Accuracy: approximately{" "}
                          {Math.round(
                            job.driverLocationAccuracy
                          )}{" "}
                          metres
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {!trackingIsActive ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            startLiveTracking(job)
                          }
                          style={actionStyle(
                            "#16a34a"
                          )}
                        >
                          📍 Start Live Tracking
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            stopLiveTracking(
                              job.id
                            )
                          }
                          style={actionStyle(
                            "#dc2626"
                          )}
                        >
                          ⏹ Stop Live Tracking
                        </button>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: "22px 0 12px",
                        color: "#cbd5e1",
                      }}
                    >
                      Contact and navigation
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {phone && (
                        <>
                          <a
                            href={`tel:${phone}`}
                            style={actionStyle(
                              "#334155"
                            )}
                          >
                            📞 Call
                          </a>

                          <a
                            href={`https://wa.me/${whatsAppNumber(
                              job.phone
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            style={actionStyle(
                              "#166534"
                            )}
                          >
                            💬 WhatsApp
                          </a>
                        </>
                      )}

                      {job.collection && (
                        <a
                          href={wazeLink(
                            job.collection
                          )}
                          target="_blank"
                          rel="noreferrer"
                          style={actionStyle(
                            "#2563eb"
                          )}
                        >
                          📍 Waze Collection
                        </a>
                      )}

                      {job.delivery && (
                        <a
                          href={wazeLink(
                            job.delivery
                          )}
                          target="_blank"
                          rel="noreferrer"
                          style={actionStyle(
                            "#1d4ed8"
                          )}
                        >
                          📍 Waze Delivery
                        </a>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: "22px 0 12px",
                        color: "#cbd5e1",
                      }}
                    >
                      Customer tracking link
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          copyTrackingLink(job)
                        }
                        style={actionStyle(
                          "#9333ea"
                        )}
                      >
                        {copiedJobId === job.id
                          ? "Link Copied ✓"
                          : "🔗 Copy Tracking Link"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          sendTrackingLink(job)
                        }
                        style={actionStyle(
                          "#15803d"
                        )}
                      >
                        💬 Send Tracking Link
                      </button>
                    </div>

                    <h3
                      style={{
                        margin: "22px 0 12px",
                        color: "#cbd5e1",
                      }}
                    >
                      Update job status
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(
                            job.id,
                            "On Route"
                          )
                        }
                        style={actionStyle(
                          "#1d4ed8"
                        )}
                      >
                        🚚 On Route
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(
                            job.id,
                            "In Progress"
                          )
                        }
                        style={actionStyle(
                          "#0f766e"
                        )}
                      >
                        📦 In Progress
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateStatus(
                            job.id,
                            "Completed"
                          )
                        }
                        style={actionStyle(
                          "#15803d"
                        )}
                      >
                        ✅ Completed
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          markPaid(job.id)
                        }
                        style={actionStyle(
                          "#7c3aed"
                        )}
                      >
                        💷 Mark Paid
                      </button>

                      <Link
                        href={`/jobs/edit/${job.id}`}
                        style={actionStyle(
                          "#475569"
                        )}
                      >
                        ✏️ Edit Job
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
  padding: "20px",
};

const summaryTitleStyle = {
  color: "#96a3b5",
  margin: "0 0 10px",
  fontWeight: "bold",
};

const summaryValueStyle = {
  fontSize: "30px",
};

const emptyCardStyle = {
  background: "#111823",
  border: "1px solid #243247",
  borderRadius: "16px",
  padding: "28px",
};