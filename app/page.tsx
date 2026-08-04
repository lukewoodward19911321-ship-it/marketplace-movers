"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
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

type DatabaseExpense = {
  amount: number | string;
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

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Home() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const activeBusiness = window.localStorage.getItem("active-business");

    if (activeBusiness === "pest") {
      router.replace("/pest-control");
    }
  }, [router]);

  useEffect(() => {
    async function loadDashboard() {
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

        const [
          { data: jobsData, error: jobsError },
          { data: expensesData, error: expensesError },
        ] = await Promise.all([
          supabase
            .from("jobs")
            .select(
              `
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
              `
            )
            .eq("user_id", user.id),

          supabase
            .from("expenses")
            .select("amount")
            .eq("user_id", user.id),
        ]);

        if (jobsError) {
          throw jobsError;
        }

        if (expensesError) {
          throw expensesError;
        }

        const formattedJobs: Job[] = (
          (jobsData || []) as DatabaseJob[]
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

        const expensesTotal = (
          (expensesData || []) as DatabaseExpense[]
        ).reduce(
          (total, expense) =>
            total + Number(expense.amount || 0),
          0
        );

        setJobs(formattedJobs);
        setTotalExpenses(expensesTotal);
      } catch (error: unknown) {
        console.error("Dashboard load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "The dashboard could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const today = getLocalDate();

  const todaysJobs = jobs
    .filter(
      (job) =>
        job.date === today &&
        job.status !== "Cancelled"
    )
    .sort((a, b) =>
      (a.time || "").localeCompare(b.time || "")
    );

  const todaysRevenue = todaysJobs.reduce(
    (total, job) => total + Number(job.price || 0),
    0
  );

  const todaysMileage = todaysJobs.reduce(
    (total, job) => total + Number(job.mileage || 0),
    0
  );

  const totalRevenue = jobs.reduce(
    (total, job) => total + Number(job.price || 0),
    0
  );

  const outstandingPayments = jobs
    .filter(
      (job) =>
        job.paymentStatus !== "Paid" &&
        job.status !== "Cancelled"
    )
    .reduce(
      (total, job) => total + Number(job.price || 0),
      0
    );

  const estimatedProfit = totalRevenue - totalExpenses;

  const upcomingJobs = [...jobs]
    .filter(
      (job) =>
        job.date &&
        job.date > today &&
        job.status !== "Cancelled"
    )
    .sort((a, b) => {
      const first = `${a.date} ${a.time || ""}`;
      const second = `${b.date} ${b.time || ""}`;

      return first.localeCompare(second);
    })
    .slice(0, 5);

  const cards = [
    {
      title: "Today's Jobs",
      value: String(todaysJobs.length),
      subtitle: "Bookings today",
    },
    {
      title: "Today's Revenue",
      value: `£${todaysRevenue.toFixed(2)}`,
      subtitle: "Booked value today",
    },
    {
      title: "Outstanding",
      value: `£${outstandingPayments.toFixed(2)}`,
      subtitle: "Not marked as paid",
    },
    {
      title: "Miles Today",
      value: todaysMileage.toFixed(1),
      subtitle: "Estimated mileage",
    },
    {
      title: "Total Expenses",
      value: `£${totalExpenses.toFixed(2)}`,
      subtitle: "Cloud expenses",
    },
    {
      title: "Estimated Profit",
      value: `£${estimatedProfit.toFixed(2)}`,
      subtitle: "Revenue minus expenses",
    },
  ];

  function cleanPhoneNumber(phone: string) {
    return phone.replace(/\D/g, "");
  }

  function whatsAppNumber(phone: string) {
    const digits = cleanPhoneNumber(phone);

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

  async function openBookingConfirmationOnWhatsApp(job: Job) {
    const number = whatsAppNumber(job.phone);

    if (!number) {
      setErrorMessage("This job does not have a valid phone number.");
      return;
    }

    const siteOrigin =
      window.location.hostname === "localhost"
        ? "https://marketplace-movers.vercel.app"
        : window.location.origin;

    const trackingLink = job.trackingToken
      ? `${siteOrigin}/track/${job.trackingToken}`
      : "";

    const message = [
      `Hi ${job.customer || "there"},`,
      "",
      "Your Marketplace Movers booking is confirmed.",
      "",
      `Job: ${job.jobType || "Moving job"}`,
      `Date: ${formatBookingDate(job.date)}`,
      `Time: ${formatBookingTime(job.time)}`,
      "",
      "Collection:",
      job.collection || "To be confirmed",
      "",
      "Delivery:",
      job.delivery || "To be confirmed",
      "",
      trackingLink
        ? `Track your driver here:\n${trackingLink}`
        : "",
      "",
      "Thank you for choosing Marketplace Movers.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(message);
    } catch (error) {
      console.error("Clipboard error:", error);

      window.prompt(
        "Copy this booking confirmation, then paste it into WhatsApp:",
        message
      );
    }

    window.open(`https://wa.me/${number}`, "_blank");

    window.alert(
      "Booking confirmation copied.\n\nPress Ctrl + V inside WhatsApp, then press Send."
    );
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

      case "Cancelled":
        return "#b91c1c";

      default:
        return "#b45309";
    }
  }

  const actionStyle = (background: string) => ({
    display: "inline-block",
    background,
    color: "white",
    textDecoration: "none",
    borderRadius: "9px",
    padding: "10px 14px",
    fontWeight: "bold",
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
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "35px 24px",
          }}
        >
          <div style={{ marginBottom: "30px" }}>
            <h1
              style={{
                fontSize: "38px",
                marginTop: 0,
                marginBottom: "8px",
              }}
            >
              Business Dashboard
            </h1>

            <p
              style={{
                color: "#aab4c3",
                fontSize: "18px",
                margin: 0,
              }}
            >
              Cloud bookings, payments and quick actions.
            </p>
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
                Loading dashboard...
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Getting jobs and expenses from Supabase.
              </p>
            </div>
          ) : (
            <>
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: "0 0 7px" }}>
                      Today&apos;s Jobs
                    </h2>

                    <p
                      style={{
                        color: "#96a3b5",
                        margin: 0,
                      }}
                    >
                      Your cloud schedule for today.
                    </p>
                  </div>

                  <Link
                    href="/jobs/new"
                    style={{
                      background: "#1565ff",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "10px",
                      padding: "13px 20px",
                      fontWeight: "bold",
                    }}
                  >
                    + Add New Job
                  </Link>
                </div>

                {todaysJobs.length === 0 ? (
                  <div
                    style={{
                      marginTop: "20px",
                      background: "#0b111b",
                      border: "1px solid #26364c",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <p
                      style={{
                        color: "#96a3b5",
                        margin: 0,
                      }}
                    >
                      You have no jobs booked for today.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                      marginTop: "20px",
                    }}
                  >
                    {todaysJobs.map((job) => {
                      const phone = cleanPhoneNumber(
                        job.phone || ""
                      );

                      const destination =
                        job.collection ||
                        job.delivery ||
                        "";

                      return (
                        <article
                          key={job.id}
                          style={{
                            background: "#0b111b",
                            border:
                              "1px solid #26364c",
                            borderRadius: "14px",
                            padding: "18px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "flex-start",
                              gap: "15px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  color: "#66a1ff",
                                  fontWeight: "bold",
                                  margin: "0 0 6px",
                                }}
                              >
                                {job.time ||
                                  "Time not set"}
                              </p>

                              <h3
                                style={{
                                  fontSize: "21px",
                                  margin: "0 0 6px",
                                }}
                              >
                                {job.customer ||
                                  "Unnamed customer"}
                              </h3>

                              <p
                                style={{
                                  color: "#aab4c3",
                                  margin: "0 0 5px",
                                }}
                              >
                                {job.jobType || "Job"}
                              </p>
                            </div>

                            <span
                              style={{
                                background:
                                  statusColour(
                                    job.status ||
                                      "Booked"
                                  ),
                                borderRadius: "999px",
                                padding: "8px 12px",
                                fontWeight: "bold",
                              }}
                            >
                              {job.status || "Booked"}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: "14px",
                              color: "#cbd5e1",
                            }}
                          >
                            <p
                              style={{
                                margin: "5px 0",
                              }}
                            >
                              <strong>
                                Collection:
                              </strong>{" "}
                              {job.collection ||
                                "Not supplied"}
                            </p>

                            <p
                              style={{
                                margin: "5px 0",
                              }}
                            >
                              <strong>
                                Delivery:
                              </strong>{" "}
                              {job.delivery ||
                                "Not supplied"}
                            </p>

                            <p
                              style={{
                                margin: "5px 0",
                              }}
                            >
                              <strong>Price:</strong> £
                              {job.price.toFixed(2)}
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              flexWrap: "wrap",
                              marginTop: "16px",
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
                                  Call
                                </a>

                                <button
  type="button"
  onClick={() => openBookingConfirmationOnWhatsApp(job)}
  style={actionStyle("#166534")}
>
  WhatsApp
</button>
                              </>
                            )}

                            {destination && (
                              <a
                                href={wazeLink(
                                  destination
                                )}
                                target="_blank"
                                rel="noreferrer"
                                style={actionStyle(
                                  "#1d4ed8"
                                )}
                              >
                                Waze
                              </a>
                            )}

                            <Link
                              href={`/jobs/edit/${job.id}`}
                              style={actionStyle(
                                "#475569"
                              )}
                            >
                              Edit
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: "0 0 7px" }}>
                      Upcoming Jobs
                    </h2>

                    <p
                      style={{
                        color: "#96a3b5",
                        margin: 0,
                      }}
                    >
                      Your next five future bookings.
                    </p>
                  </div>

                  <Link
                    href="/jobs"
                    style={{
                      color: "#66a1ff",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    View all jobs →
                  </Link>
                </div>

                {upcomingJobs.length === 0 ? (
                  <p
                    style={{
                      color: "#96a3b5",
                      marginTop: "20px",
                      marginBottom: 0,
                    }}
                  >
                    No future jobs are currently booked.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      marginTop: "20px",
                    }}
                  >
                    {upcomingJobs.map((job) => (
                      <div
                        key={job.id}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "16px",
                          flexWrap: "wrap",
                          background: "#0b111b",
                          border:
                            "1px solid #26364c",
                          borderRadius: "12px",
                          padding: "16px",
                        }}
                      >
                        <div>
                          <strong>
                            {job.customer ||
                              "Unnamed customer"}
                          </strong>

                          <p
                            style={{
                              color: "#aab4c3",
                              margin: "6px 0 0",
                            }}
                          >
                            {job.jobType || "Job"}
                          </p>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                          }}
                        >
                          <strong>
                            {job.date}
                            {job.time
                              ? ` at ${job.time}`
                              : ""}
                          </strong>

                          <p
                            style={{
                              color: "#66a1ff",
                              margin: "6px 0 0",
                              fontWeight: "bold",
                            }}
                          >
                            £{job.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}