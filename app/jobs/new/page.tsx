"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import { supabase } from "@/lib/supabase";

type SavedJob = {
  id: string;
  tracking_token: string | null;
};

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
  if (!time) {
    return "Time to be confirmed";
  }

  return time.slice(0, 5);
}

export default function AddJobPage() {
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const customer = String(form.get("customer") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const jobType = String(form.get("jobType") || "").trim();
    const collection = String(form.get("collection") || "").trim();
    const delivery = String(form.get("delivery") || "").trim();
    const date = String(form.get("date") || "");
    const time = String(form.get("time") || "");

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

      const jobData = {
        user_id: user.id,
        customer,
        phone,
        job_type: jobType,
        collection,
        delivery,
        job_date: date || null,
        job_time: time || null,
        price: Number(form.get("price") || 0),
        mileage: Number(form.get("mileage") || 0),
        payment_status: String(
          form.get("paymentStatus") || "Not Paid"
        ),
        notes: String(form.get("notes") || ""),
        status: "Booked",
      };

      const { data, error } = await supabase
        .from("jobs")
        .insert(jobData)
        .select("id, tracking_token")
        .single();

      if (error) {
        throw error;
      }

      const savedJob = data as SavedJob;

      // Temporary browser copy while the rest of the pages
      // are still being moved over to Supabase.
      const localJob = {
        id: savedJob.id,
        trackingToken: savedJob.tracking_token || "",
        customer: jobData.customer,
        phone: jobData.phone,
        jobType: jobData.job_type,
        collection: jobData.collection,
        delivery: jobData.delivery,
        date: jobData.job_date || "",
        time: jobData.job_time || "",
        price: jobData.price,
        mileage: jobData.mileage,
        paymentStatus: jobData.payment_status,
        notes: jobData.notes,
        status: jobData.status,
      };

      const existingJobs = JSON.parse(
        localStorage.getItem("marketplace-movers-jobs") || "[]"
      );

      localStorage.setItem(
        "marketplace-movers-jobs",
        JSON.stringify([localJob, ...existingJobs])
      );

      setSaved(true);
      formElement.reset();

      if (phone) {
        const trackingLink = savedJob.tracking_token
          ? `${window.location.origin}/track/${savedJob.tracking_token}`
          : "";

        const message = [
          `Hi ${customer || "there"},`,
          "",
          "Your Marketplace Movers booking is confirmed.",
          "",
          `Job: ${jobType || "Moving job"}`,
          `Date: ${formatBookingDate(date)}`,
          `Time: ${formatBookingTime(time)}`,
          `Collection: ${collection || "To be confirmed"}`,
          `Delivery: ${delivery || "To be confirmed"}`,
          "",
          trackingLink
            ? `You can view your booking and track the driver here:\n${trackingLink}`
            : "",
          "",
          "Thank you,\nMarketplace Movers",
        ]
          .filter(Boolean)
          .join("\n");

        const number = whatsAppNumber(phone);
        const whatsAppUrl =
          `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;

        window.location.href = whatsAppUrl;

        window.setTimeout(() => {
          router.push("/jobs");
        }, 1200);

        return;
      }

      window.setTimeout(() => {
        router.push("/jobs");
      }, 1000);
    } catch (error: unknown) {
      console.error("Supabase save error:", error);

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
            maxWidth: "900px",
            margin: "0 auto",
            padding: "35px 24px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "transparent",
              color: "#4b8cff",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            ← Back to dashboard
          </button>

          <div
            style={{
              background: "#111823",
              border: "1px solid #243247",
              borderRadius: "18px",
              padding: "28px",
            }}
          >
            <h1 style={{ marginTop: 0, fontSize: "34px" }}>
              Add New Job
            </h1>

            <p style={{ color: "#96a3b5", marginBottom: "28px" }}>
              Enter the booking details below. When a phone number is
              supplied, WhatsApp will open with a confirmation message
              ready for you to send.
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
                    name="customer"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    placeholder="07..."
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Job type
                  <input
                    name="jobType"
                    placeholder="Sofa delivery, house move..."
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Date
                  <input
                    name="date"
                    type="date"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Booked time
                  <input
                    name="time"
                    type="time"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Price (£)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Collection address
                  <input
                    name="collection"
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Delivery address
                  <input
                    name="delivery"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Estimated mileage
                  <input
                    name="mileage"
                    type="number"
                    min="0"
                    step="0.1"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Payment status
                  <select
                    name="paymentStatus"
                    style={inputStyle}
                  >
                    <option>Not Paid</option>
                    <option>Deposit Paid</option>
                    <option>Paid</option>
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
                  name="notes"
                  rows={5}
                  placeholder="Items, stairs, access, helper required..."
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
                  Job saved successfully. WhatsApp is opening with the
                  confirmation message.
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
                  background: "#15803d",
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
                  : "Save Job & Open WhatsApp"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}