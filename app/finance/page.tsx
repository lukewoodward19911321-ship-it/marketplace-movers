"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";

type DatabaseJob = {
  price: number | string;
  mileage: number | string;
  payment_status: string;
  job_date: string | null;
};

type DatabaseExpense = {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number | string;
};

type Job = {
  price: number;
  mileage: number;
  paymentStatus: string;
  date: string;
};

type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
};

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function FinancePage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadFinanceData() {
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
                price,
                mileage,
                payment_status,
                job_date
              `
            )
            .eq("user_id", user.id),

          supabase
            .from("expenses")
            .select(
              `
                id,
                expense_date,
                category,
                description,
                amount
              `
            )
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
          price: Number(job.price || 0),
          mileage: Number(job.mileage || 0),
          paymentStatus: job.payment_status || "Not Paid",
          date: job.job_date || "",
        }));

        const formattedExpenses: Expense[] = (
          (expensesData || []) as DatabaseExpense[]
        ).map((expense) => ({
          id: expense.id,
          date: expense.expense_date || "",
          category: expense.category || "Other",
          description: expense.description || "",
          amount: Number(expense.amount || 0),
        }));

        setJobs(formattedJobs);
        setExpenses(formattedExpenses);
      } catch (error: unknown) {
        console.error("Finance load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "The finance information could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceData();
  }, [router]);

  const today = getLocalDate();

  const todaysJobs = jobs.filter((job) => job.date === today);

  const todayRevenue = todaysJobs.reduce(
    (total, job) => total + Number(job.price || 0),
    0
  );

  const totalRevenue = jobs.reduce(
    (total, job) => total + Number(job.price || 0),
    0
  );

  const outstanding = jobs
    .filter((job) => job.paymentStatus !== "Paid")
    .reduce((total, job) => total + Number(job.price || 0), 0);

  const paid = jobs
    .filter((job) => job.paymentStatus === "Paid")
    .reduce((total, job) => total + Number(job.price || 0), 0);

  const mileage = jobs.reduce(
    (total, job) => total + Number(job.mileage || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const profit = totalRevenue - totalExpenses;

  const average =
    jobs.length > 0 ? totalRevenue / jobs.length : 0;

  const cardStyle = {
    background: "#111823",
    border: "1px solid #243247",
    borderRadius: "16px",
    padding: "24px",
  };

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
          <h1
            style={{
              fontSize: "40px",
              marginBottom: "10px",
            }}
          >
            Finance
          </h1>

          <p
            style={{
              color: "#96a3b5",
              marginBottom: "30px",
            }}
          >
            Cloud revenue, expenses, payments and mileage overview.
          </p>

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
                Loading finance data...
              </h2>

              <p style={{ color: "#96a3b5", marginBottom: 0 }}>
                Getting jobs and expenses from Supabase.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "20px",
                }}
              >
                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Today&apos;s Revenue
                  </p>
                  <h2>£{todayRevenue.toFixed(2)}</h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Total Revenue
                  </p>
                  <h2>£{totalRevenue.toFixed(2)}</h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>Paid</p>
                  <h2 style={{ color: "#4ade80" }}>
                    £{paid.toFixed(2)}
                  </h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Outstanding
                  </p>
                  <h2 style={{ color: "#f59e0b" }}>
                    £{outstanding.toFixed(2)}
                  </h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Total Mileage
                  </p>
                  <h2>{mileage.toFixed(1)} miles</h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Average Job Value
                  </p>
                  <h2>£{average.toFixed(2)}</h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Total Expenses
                  </p>
                  <h2 style={{ color: "#ef4444" }}>
                    £{totalExpenses.toFixed(2)}
                  </h2>
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#96a3b5" }}>
                    Estimated Profit
                  </p>
                  <h2
                    style={{
                      color:
                        profit >= 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    £{profit.toFixed(2)}
                  </h2>
                </div>
              </div>

              <div
                style={{
                  marginTop: "35px",
                  background: "#111823",
                  border: "1px solid #243247",
                  borderRadius: "16px",
                  padding: "25px",
                }}
              >
                <h2>Business Summary</h2>

                <p>Total Jobs: {jobs.length}</p>
                <p>Total Revenue: £{totalRevenue.toFixed(2)}</p>
                <p>Total Expenses: £{totalExpenses.toFixed(2)}</p>
                <p>Estimated Profit: £{profit.toFixed(2)}</p>
                <p>
                  Outstanding Payments: £{outstanding.toFixed(2)}
                </p>
                <p>Total Mileage: {mileage.toFixed(1)} miles</p>
                <p>Average Job: £{average.toFixed(2)}</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}