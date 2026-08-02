"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/lib/supabase";

type DatabaseExpense = {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number | string;
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

export default function ExpensesPage() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyExpenseId, setBusyExpenseId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function loadExpenses() {
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
          .eq("user_id", user.id)
          .order("expense_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const formattedExpenses: Expense[] = (
          (data || []) as DatabaseExpense[]
        ).map((expense) => ({
          id: expense.id,
          date: expense.expense_date || "",
          category: expense.category || "Other",
          description: expense.description || "",
          amount: Number(expense.amount || 0),
        }));

        setExpenses(formattedExpenses);
      } catch (error: unknown) {
        console.error("Expenses load error:", error);

        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error
            ? String(error.message)
            : "The expenses could not be loaded.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [router]);

  async function addExpense(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formElement = event.currentTarget;

    setSaving(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const form = new FormData(formElement);

      const expenseData = {
        user_id: user.id,
        expense_date: String(form.get("date") || ""),
        category: String(form.get("category") || "Other"),
        description: String(form.get("description") || ""),
        amount: Number(form.get("amount") || 0),
      };

      const { data, error } = await supabase
        .from("expenses")
        .insert(expenseData)
        .select(
          `
            id,
            expense_date,
            category,
            description,
            amount
          `
        )
        .single();

      if (error) {
        throw error;
      }

      const savedExpense = data as DatabaseExpense;

      const newExpense: Expense = {
        id: savedExpense.id,
        date: savedExpense.expense_date || "",
        category: savedExpense.category || "Other",
        description: savedExpense.description || "",
        amount: Number(savedExpense.amount || 0),
      };

      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ]);

      setSavedMessage("Expense saved successfully.");
      formElement.reset();
    } catch (error: unknown) {
      console.error("Expense save error:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The expense could not be saved.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    setBusyExpenseId(id);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== id)
      );
    } catch (error: unknown) {
      console.error("Expense delete error:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error
          ? String(error.message)
          : "The expense could not be deleted.";

      setErrorMessage(message);
    } finally {
      setBusyExpenseId(null);
    }
  }

  const filteredExpenses = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return expenses;
    }

    return expenses.filter((expense) =>
      [
        expense.date,
        expense.category,
        expense.description,
        expense.amount,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText)
    );
  }, [expenses, search]);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const currentMonth = getLocalDate().slice(0, 7);

  const monthlyExpenses = expenses
    .filter((expense) =>
      expense.date.startsWith(currentMonth)
    )
    .reduce(
      (total, expense) => total + Number(expense.amount || 0),
      0
    );

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    expenses.forEach((expense) => {
      totals.set(
        expense.category,
        (totals.get(expense.category) || 0) +
          Number(expense.amount || 0)
      );
    });

    return Array.from(totals.entries()).sort(
      (first, second) => second[1] - first[1]
    );
  }, [expenses]);

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
              Expenses
            </h1>

            <p
              style={{
                color: "#aab4c3",
                fontSize: "18px",
                margin: 0,
              }}
            >
              Record and manage your cloud business expenses.
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

          {savedMessage && (
            <div
              style={{
                background: "#12351f",
                border: "1px solid #258343",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              {savedMessage}
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
              <p style={summaryTitleStyle}>Total Expenses</p>
              <strong style={summaryValueStyle}>
                £{totalExpenses.toFixed(2)}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>This Month</p>
              <strong style={summaryValueStyle}>
                £{monthlyExpenses.toFixed(2)}
              </strong>
            </div>

            <div style={summaryCardStyle}>
              <p style={summaryTitleStyle}>Expense Entries</p>
              <strong style={summaryValueStyle}>
                {expenses.length}
              </strong>
            </div>
          </div>

          <div
            style={{
              background: "#111823",
              border: "1px solid #243247",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Add Expense</h2>

            <form onSubmit={addExpense}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                }}
              >
                <label style={labelStyle}>
                  Date
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={getLocalDate()}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Category
                  <select
                    name="category"
                    style={inputStyle}
                    defaultValue="Fuel"
                  >
                    <option>Fuel</option>
                    <option>Van Repairs</option>
                    <option>Insurance</option>
                    <option>Advertising</option>
                    <option>Helper Payment</option>
                    <option>Parking</option>
                    <option>Tolls</option>
                    <option>Equipment</option>
                    <option>Other</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Amount (£)
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    style={inputStyle}
                  />
                </label>
              </div>

              <label
                style={{
                  ...labelStyle,
                  marginTop: "18px",
                }}
              >
                Description
                <input
                  name="description"
                  placeholder="Diesel, tyre repair, Facebook advert..."
                  style={inputStyle}
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: "20px",
                  background: "#1565ff",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px 20px",
                  fontWeight: "bold",
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Expense"}
              </button>
            </form>
          </div>

          <div
            style={{
              background: "#111823",
              border: "1px solid #243247",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Spending by Category
            </h2>

            {categoryTotals.length === 0 ? (
              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Your category totals will appear here.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {categoryTotals.map(([category, total]) => (
                  <div
                    key={category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "15px",
                      background: "#0b111b",
                      border: "1px solid #26364c",
                      borderRadius: "10px",
                      padding: "13px",
                    }}
                  >
                    <strong>{category}</strong>
                    <strong>£{total.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search expenses..."
            style={{
              ...inputStyle,
              marginTop: 0,
              marginBottom: "20px",
            }}
          />

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
                Loading expenses...
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Getting your expenses from Supabase.
              </p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div
              style={{
                background: "#111823",
                border: "1px solid #243247",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                No expenses found
              </h2>

              <p
                style={{
                  color: "#96a3b5",
                  marginBottom: 0,
                }}
              >
                Add your first cloud expense using the form above.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {filteredExpenses.map((expense) => {
                const isBusy = busyExpenseId === expense.id;

                return (
                  <article
                    key={expense.id}
                    style={{
                      background: "#111823",
                      border: "1px solid #243247",
                      borderRadius: "14px",
                      padding: "18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "18px",
                      flexWrap: "wrap",
                      opacity: isBusy ? 0.7 : 1,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 7px" }}>
                        {expense.category}
                      </h3>

                      <p
                        style={{
                          color: "#aab4c3",
                          margin: "0 0 5px",
                        }}
                      >
                        {expense.description ||
                          "No description"}
                      </p>

                      <p style={{ margin: 0 }}>
                        {expense.date}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "22px",
                          marginBottom: "10px",
                        }}
                      >
                        £{expense.amount.toFixed(2)}
                      </strong>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          deleteExpense(expense.id)
                        }
                        style={{
                          background: "#b91c1c",
                          color: "white",
                          border: "none",
                          borderRadius: "9px",
                          padding: "9px 13px",
                          fontWeight: "bold",
                          cursor: isBusy ? "wait" : "pointer",
                        }}
                      >
                        {isBusy ? "Deleting..." : "Delete"}
                      </button>
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