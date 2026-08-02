"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";

type DatabaseJob = {
  id: string;
  customer: string;
  job_type: string;
  job_date: string | null;
  job_time: string | null;
  status: string;
};

type Job = {
  id: string;
  customer: string;
  jobType: string;
  date: string;
  time: string;
  status: string;
};

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
          .select(
            `
              id,
              customer,
              job_type,
              job_date,
              job_time,
              status
            `
          )
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
          customer: job.customer || "",
          jobType: job.job_type || "",
          date: job.job_date || "",
          time: job.job_time
            ? job.job_time.slice(0, 5)
            : "",
          status: job.status || "Booked",
        }));

        setJobs(formattedJobs);
      } catch (error: unknown) {
        console.error("Calendar load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "The calendar jobs could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [router]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    year,
    month,
    1
  ).getDay();

  const calendarDays = useMemo(() => {
    const days: Array<number | null> = [];

    const mondayBasedStart =
      firstDayOfMonth === 0
        ? 6
        : firstDayOfMonth - 1;

    for (
      let index = 0;
      index < mondayBasedStart;
      index += 1
    ) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {
      days.push(day);
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [daysInMonth, firstDayOfMonth]);

  function formatDate(day: number) {
    return `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
  }

  function jobsForDay(day: number) {
    const date = formatDate(day);

    return jobs
      .filter((job) => job.date === date)
      .sort((a, b) =>
        (a.time || "").localeCompare(b.time || "")
      );
  }

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
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

  const today = getLocalDate();

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
            maxWidth: "1400px",
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
                Calendar
              </h1>

              <p
                style={{
                  color: "#aab4c3",
                  margin: 0,
                  fontSize: "18px",
                }}
              >
                View all cloud jobs by date.
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
                Loading calendar...
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
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={previousMonth}
                  style={buttonStyle}
                >
                  ← Previous
                </button>

                <div style={{ textAlign: "center" }}>
                  <h2 style={{ margin: 0 }}>
                    {monthName}
                  </h2>

                  <button
                    type="button"
                    onClick={goToToday}
                    style={{
                      ...buttonStyle,
                      marginTop: "8px",
                      background: "#1d4ed8",
                    }}
                  >
                    Today
                  </button>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  style={buttonStyle}
                >
                  Next →
                </button>
              </div>

              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(7, minmax(120px, 1fr))",
                    gap: "8px",
                    minWidth: "850px",
                  }}
                >
                  {[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ].map((dayName) => (
                    <div
                      key={dayName}
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        color: "#96a3b5",
                        fontWeight: "bold",
                      }}
                    >
                      {dayName}
                    </div>
                  ))}

                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${index}`}
                          style={{
                            minHeight: "130px",
                            background: "#0a0f18",
                            borderRadius: "10px",
                            opacity: 0.45,
                          }}
                        />
                      );
                    }

                    const date = formatDate(day);
                    const dayJobs = jobsForDay(day);
                    const isToday = date === today;

                    return (
                      <div
                        key={date}
                        style={{
                          minHeight: "130px",
                          background: "#0b111b",
                          border: isToday
                            ? "2px solid #2f7cff"
                            : "1px solid #26364c",
                          borderRadius: "10px",
                          padding: "10px",
                          boxSizing: "border-box",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <strong
                            style={{
                              color: isToday
                                ? "#66a1ff"
                                : "white",
                            }}
                          >
                            {day}
                          </strong>

                          {dayJobs.length > 0 && (
                            <span
                              style={{
                                background: "#243247",
                                color: "#cbd5e1",
                                borderRadius: "999px",
                                padding: "3px 7px",
                                fontSize: "12px",
                              }}
                            >
                              {dayJobs.length}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: "7px",
                          }}
                        >
                          {dayJobs.map((job) => (
                            <Link
                              key={job.id}
                              href={`/jobs/edit/${job.id}`}
                              style={{
                                background: statusColour(
                                  job.status ||
                                    "Booked"
                                ),
                                color: "white",
                                textDecoration: "none",
                                borderRadius: "8px",
                                padding: "8px",
                                fontSize: "13px",
                                lineHeight: 1.3,
                              }}
                            >
                              <strong>
                                {job.time || "No time"} ·{" "}
                                {job.customer ||
                                  "Customer"}
                              </strong>

                              <div>
                                {job.jobType || "Job"}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const buttonStyle = {
  background: "#334155",
  color: "white",
  border: "none",
  borderRadius: "9px",
  padding: "10px 14px",
  fontWeight: "bold",
  cursor: "pointer",
};