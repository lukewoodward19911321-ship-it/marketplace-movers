"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

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

type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  jobs: number;
  totalSpent: number;
  outstanding: number;
  lastJobDate: string;
  lastJobType: string;
};

export default function CustomersPage() {
  const router = useRouter();

const [jobs, setJobs] = useState<Job[]>([]);
const [search, setSearch] = useState("");
const [loading, setLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
  async function loadCustomers() {
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
        .select("*")
        .eq("user_id", user.id)
        .order("job_date", { ascending: false });

      if (error) {
        throw error;
      }

    const formattedJobs: Job[] = (data || []).map((job) => ({
        id: job.id,
        customer: job.customer,
        phone: job.phone,
        jobType: job.job_type,
        collection: job.collection,
        delivery: job.delivery,
        date: job.job_date || "",
        time: job.job_time || "",
        price: Number(job.price || 0),
        mileage: Number(job.mileage || 0),
        paymentStatus: job.payment_status,
        notes: job.notes,
        status: job.status,
      }));

      setJobs(formattedJobs);
    } catch (error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error
      ? String(error.message)
      : "The customers could not be loaded.";

  setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  loadCustomers();
}, [router]);

  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerSummary>();

    jobs.forEach((job) => {
      const name = (job.customer || "Unnamed customer").trim();
      const phone = (job.phone || "").trim();
      const key = phone || name.toLowerCase();

      const existing = customerMap.get(key);

      const jobPrice = Number(job.price || 0);
      const isPaid = job.paymentStatus === "Paid";

      if (!existing) {
        customerMap.set(key, {
          key,
          name,
          phone,
          jobs: 1,
          totalSpent: jobPrice,
          outstanding: isPaid ? 0 : jobPrice,
          lastJobDate: job.date || "",
          lastJobType: job.jobType || "Job",
        });

        return;
      }

      existing.jobs += 1;
      existing.totalSpent += jobPrice;

      if (!isPaid) {
        existing.outstanding += jobPrice;
      }

      if ((job.date || "") > existing.lastJobDate) {
        existing.lastJobDate = job.date || "";
        existing.lastJobType = job.jobType || "Job";
      }
    });

    return Array.from(customerMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [jobs]);

  const filteredCustomers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.lastJobType,
        customer.lastJobDate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText)
    );
  }, [customers, search]);

  const totalCustomerRevenue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0
  );

  const totalOutstanding = customers.reduce(
    (total, customer) => total + customer.outstanding,
    0
  );

  function cleanPhone(phone: string) {
    return phone.replace(/\s/g, "");
  }

  function whatsAppNumber(phone: string) {
    return cleanPhone(phone).replace(/^0/, "44");
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
          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                fontSize: "38px",
                margin: "0 0 8px",
              }}
            >
              Customers
            </h1>

            <p
              style={{
                color: "#aab4c3",
                fontSize: "18px",
                margin: 0,
              }}
            >
              Customer history, spending and outstanding balances.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "22px",
            }}
          >
            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>Total Customers</p>
              <strong style={summaryValueStyle}>
                {customers.length}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>Total Jobs</p>
              <strong style={summaryValueStyle}>
                {jobs.length}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>Customer Revenue</p>
              <strong style={summaryValueStyle}>
                £{totalCustomerRevenue.toFixed(2)}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>Outstanding</p>
              <strong style={summaryValueStyle}>
                £{totalOutstanding.toFixed(2)}
              </strong>
            </div>
          </div>
{errorMessage && (
  <div
    style={{
      background: "#451a1a",
      border: "1px solid #991b1b",
      borderRadius: "10px",
      padding: "12px",
      marginBottom: "20px",
    }}
  >
    {errorMessage}
  </div>
)}

{loading && (
  <p style={{ color: "#96a3b5" }}>
    Loading customers...
  </p>
)}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer name, phone or last job..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "22px",
              background: "#111823",
              color: "white",
              border: "1px solid #2a3a50",
              borderRadius: "12px",
              fontSize: "16px",
            }}
          />

          <p style={{ color: "#96a3b5" }}>
            Showing {filteredCustomers.length} customer
            {filteredCustomers.length === 1 ? "" : "s"}
          </p>

          {filteredCustomers.length === 0 ? (
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>No customers found</h2>

              <p style={{ color: "#96a3b5", marginBottom: 0 }}>
                Customers are created automatically from saved jobs.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {filteredCustomers.map((customer) => {
                const phone = cleanPhone(customer.phone);

                return (
                  <article
                    key={customer.key}
                    style={{
                      background: "#111823",
                      border: "1px solid #243247",
                      borderRadius: "16px",
                      padding: "22px",
                    }}
                  >
                    <h2 style={{ margin: "0 0 8px" }}>
                      {customer.name}
                    </h2>

                    <p
                      style={{
                        color: "#aab4c3",
                        margin: "0 0 18px",
                      }}
                    >
                      {customer.phone || "No phone number saved"}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      <div style={detailBoxStyle}>
                        <span style={detailLabelStyle}>Jobs</span>
                        <strong>{customer.jobs}</strong>
                      </div>

                      <div style={detailBoxStyle}>
                        <span style={detailLabelStyle}>
                          Total spent
                        </span>
                        <strong>
                          £{customer.totalSpent.toFixed(2)}
                        </strong>
                      </div>

                      <div style={detailBoxStyle}>
                        <span style={detailLabelStyle}>
                          Outstanding
                        </span>
                        <strong
                          style={{
                            color:
                              customer.outstanding > 0
                                ? "#f59e0b"
                                : "#4ade80",
                          }}
                        >
                          £{customer.outstanding.toFixed(2)}
                        </strong>
                      </div>

                      <div style={detailBoxStyle}>
                        <span style={detailLabelStyle}>Last job</span>
                        <strong>
                          {customer.lastJobDate || "No date"}
                        </strong>
                      </div>
                    </div>

                    <p
                      style={{
                        color: "#c5cfdb",
                        margin: "16px 0 0",
                      }}
                    >
                      <strong>Last job type:</strong>{" "}
                      {customer.lastJobType}
                    </p>

                    {phone && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginTop: "18px",
                        }}
                      >
                        <a
                          href={`tel:${phone}`}
                          style={actionStyle("#334155")}
                        >
                          Call
                        </a>

                        <a
                          href={`https://wa.me/${whatsAppNumber(
                            customer.phone
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={actionStyle("#166534")}
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
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

const detailBoxStyle = {
  background: "#0b111b",
  border: "1px solid #26364c",
  borderRadius: "10px",
  padding: "12px",
  display: "grid",
  gap: "6px",
};

const detailLabelStyle = {
  color: "#96a3b5",
  fontSize: "13px",
};