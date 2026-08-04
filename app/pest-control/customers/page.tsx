"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

type CustomerType = "Residential" | "Commercial";
type CustomerStatus = "Active" | "Follow Up" | "Inactive";

type PestCustomer = {
  id: number;
  name: string;
  businessName?: string;
  type: CustomerType;
  phone: string;
  email: string;
  address: string;
  postcode: string;
  status: CustomerStatus;
  totalJobs: number;
  totalSpent: number;
  lastTreatment: string;
  nextVisit: string | null;
  pestHistory: string[];
  notes: string;
};

const starterCustomers: PestCustomer[] = [
  {
    id: 1001,
    name: "Sarah Williams",
    type: "Residential",
    phone: "07912 345678",
    email: "sarah.williams@example.com",
    address: "24 Oakfield Road, Bridgend",
    postcode: "CF31 4AB",
    status: "Active",
    totalJobs: 4,
    totalSpent: 420,
    lastTreatment: "Rats & Mice — 4 Aug 2026",
    nextVisit: "11 Aug 2026",
    pestHistory: ["Rats", "Mice", "Rodent proofing"],
    notes:
      "Previous activity beneath kitchen units. Check rear drain and external air bricks.",
  },
  {
    id: 1002,
    name: "David Jones",
    type: "Residential",
    phone: "07700 123456",
    email: "david.jones@example.com",
    address: "18 High Street, Porthcawl",
    postcode: "CF36 3BD",
    status: "Active",
    totalJobs: 2,
    totalSpent: 170,
    lastTreatment: "Wasp Nest — 4 Aug 2026",
    nextVisit: null,
    pestHistory: ["Wasps"],
    notes: "Nest above rear bedroom window.",
  },
  {
    id: 1003,
    name: "Helen Morris",
    businessName: "Greenfield School",
    type: "Commercial",
    phone: "01792 123456",
    email: "office@greenfieldschool.co.uk",
    address: "School Road, Neath",
    postcode: "SA10 7AA",
    status: "Follow Up",
    totalJobs: 8,
    totalSpent: 1280,
    lastTreatment: "Rodent Inspection — 1 Aug 2026",
    nextVisit: "8 Aug 2026",
    pestHistory: ["Rats", "Mice", "Flies"],
    notes:
      "Monthly commercial contract. Kitchen, bin store and boiler room require monitoring.",
  },
  {
    id: 1004,
    name: "Mark Evans",
    type: "Residential",
    phone: "07444 555666",
    email: "mark.evans@example.com",
    address: "10 Heol Y Felin, Bridgend",
    postcode: "CF31 1AA",
    status: "Follow Up",
    totalJobs: 3,
    totalSpent: 310,
    lastTreatment: "Mole Control — 3 Aug 2026",
    nextVisit: "10 Aug 2026",
    pestHistory: ["Moles"],
    notes: "Several fresh mole hills in the rear garden.",
  },
  {
    id: 1005,
    name: "Rebecca Brown",
    businessName: "Acme Builders Ltd",
    type: "Commercial",
    phone: "01656 123456",
    email: "rebecca@acmebuilders.co.uk",
    address: "Bridgend Industrial Estate",
    postcode: "CF31 3RT",
    status: "Active",
    totalJobs: 12,
    totalSpent: 2160,
    lastTreatment: "Commercial Inspection — 2 Aug 2026",
    nextVisit: "2 Sep 2026",
    pestHistory: ["Rats", "Mice", "Wasps", "Flies"],
    notes:
      "Monthly inspection contract. Contact reception before entering site.",
  },
  {
    id: 1006,
    name: "Lisa Davies",
    type: "Residential",
    phone: "07888 654321",
    email: "lisa.davies@example.com",
    address: "7 Park Avenue, Swansea",
    postcode: "SA1 4PQ",
    status: "Inactive",
    totalJobs: 1,
    totalSpent: 95,
    lastTreatment: "Ant Treatment — 12 Jun 2026",
    nextVisit: null,
    pestHistory: ["Ants"],
    notes: "Treatment completed successfully.",
  },
];

const filters = [
  "All",
  "Residential",
  "Commercial",
  "Active",
  "Follow Up",
  "Inactive",
] as const;

type Filter = (typeof filters)[number];

export default function PestCustomersPage() {
  const [customers, setCustomers] =
    useState<PestCustomer[]>(starterCustomers);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<number>(starterCustomers[0].id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [message, setMessage] = useState("");

  const selectedCustomer =
    customers.find(
      (customer) => customer.id === selectedCustomerId,
    ) || customers[0];

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        if (filter === "Residential") {
          return customer.type === "Residential";
        }

        if (filter === "Commercial") {
          return customer.type === "Commercial";
        }

        if (
          filter === "Active" ||
          filter === "Follow Up" ||
          filter === "Inactive"
        ) {
          return customer.status === filter;
        }

        return true;
      })
      .filter((customer) => {
        if (!query) {
          return true;
        }

        return [
          customer.name,
          customer.businessName || "",
          customer.phone,
          customer.email,
          customer.address,
          customer.postcode,
          customer.pestHistory.join(" "),
          String(customer.id),
        ].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, filter, search]);

  const totalCustomers = customers.length;

  const residentialCustomers = customers.filter(
    (customer) => customer.type === "Residential",
  ).length;

  const commercialCustomers = customers.filter(
    (customer) => customer.type === "Commercial",
  ).length;

  const followUpsDue = customers.filter(
    (customer) => customer.status === "Follow Up",
  ).length;

  const lifetimeValue = customers.reduce(
    (total, customer) => total + customer.totalSpent,
    0,
  );

  function updateCustomer(
    id: number,
    updates: Partial<PestCustomer>,
    confirmation: string,
  ) {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              ...updates,
            }
          : customer,
      ),
    );

    setMessage(confirmation);
  }

  function addCustomer() {
    const nextId =
      Math.max(...customers.map((customer) => customer.id)) + 1;

    const newCustomer: PestCustomer = {
      id: nextId,
      name: "New Customer",
      type: "Residential",
      phone: "07900 000000",
      email: "customer@example.com",
      address: "Address required",
      postcode: "Postcode",
      status: "Active",
      totalJobs: 0,
      totalSpent: 0,
      lastTreatment: "No previous treatment",
      nextVisit: null,
      pestHistory: [],
      notes: "Edit this customer to add their details.",
    };

    setCustomers((current) => [
      newCustomer,
      ...current,
    ]);

    setSelectedCustomerId(nextId);
    setMessage(`Customer #${nextId} created.`);
  }

  function createJobForCustomer() {
    setMessage(
      `A new pest-control booking can now be created for ${selectedCustomer.name}.`,
    );
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#05070b",
    color: "white",
  } as const;

  const contentStyle = {
    flex: 1,
    minWidth: 0,
    padding: "28px",
  } as const;

  const panelStyle = {
    background: "#0b1411",
    border: "1px solid #294332",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 12px 35px rgba(0, 0, 0, 0.22)",
  } as const;

  const smallLabelStyle = {
    color: "#a3e635",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "1.3px",
    textTransform: "uppercase",
  } as const;

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "10px 13px",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  } as const;

  const statusColour = (
    status: CustomerStatus,
  ) => {
    if (status === "Active") {
      return "#166534";
    }

    if (status === "Follow Up") {
      return "#7e22ce";
    }

    return "#475569";
  };

  return (
    <div style={pageStyle}>
      <Header />

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 100px)",
        }}
      >
        <Sidebar />

        <main style={contentStyle}>
          <section
            style={{
              position: "relative",
              minHeight: "220px",
              marginBottom: "24px",
              overflow: "hidden",
              borderRadius: "18px",
              border: "1px solid #4d7c0f",
              background:
                "linear-gradient(90deg, rgba(2,8,5,.98) 0%, rgba(5,20,10,.84) 52%, rgba(5,20,10,.14) 100%), url('/banners/pest-customers.jpg') center/cover",
            }}
          >
            <div
              style={{
                maxWidth: "760px",
                padding: "34px",
              }}
            >
              <div style={smallLabelStyle}>
                Terminator Pest Control
              </div>

              <h1
                style={{
                  margin: "8px 0 7px",
                  fontSize: "clamp(38px, 6vw, 68px)",
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                }}
              >
                Pest{" "}
                <span style={{ color: "#84cc16" }}>
                  Customers
                </span>
              </h1>

              <p
                style={{
                  margin: "16px 0 22px",
                  color: "#d1d5db",
                  fontSize: "17px",
                  maxWidth: "640px",
                }}
              >
                Keep contact details, pest history, treatment
                records, follow-ups and customer value together.
              </p>

              <button
                type="button"
                onClick={addCustomer}
                style={{
                  ...buttonStyle,
                  background: "#65a30d",
                  padding: "12px 18px",
                }}
              >
                + Add New Customer
              </button>
            </div>
          </section>

          {message && (
            <div
              style={{
                marginBottom: "18px",
                padding: "13px 16px",
                borderRadius: "12px",
                background: "#16351f",
                border: "1px solid #3f7d45",
                color: "#bbf7d0",
                fontWeight: 700,
              }}
            >
              {message}
            </div>
          )}

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "14px",
              marginBottom: "22px",
            }}
          >
            {[
              {
                label: "Total Customers",
                value: totalCustomers,
                detail: "All customer records",
                icon: "👥",
              },
              {
                label: "Residential",
                value: residentialCustomers,
                detail: "Household customers",
                icon: "🏠",
              },
              {
                label: "Commercial",
                value: commercialCustomers,
                detail: "Business accounts",
                icon: "🏢",
              },
              {
                label: "Follow-ups Due",
                value: followUpsDue,
                detail: "Customers requiring another visit",
                icon: "🔁",
              },
              {
                label: "Customer Value",
                value: `£${lifetimeValue.toFixed(2)}`,
                detail: "Total recorded spend",
                icon: "£",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={panelStyle}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      background: "#17351f",
                      color: "#a3e635",
                      fontSize: "21px",
                      fontWeight: 900,
                    }}
                  >
                    {stat.icon}
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#91a79a",
                        fontSize: "13px",
                      }}
                    >
                      {stat.label}
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "27px",
                        fontWeight: 900,
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    color: "#718078",
                    fontSize: "13px",
                  }}
                >
                  {stat.detail}
                </div>
              </div>
            ))}
          </section>

          <section
            style={{
              ...panelStyle,
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(240px, 1fr) auto",
                gap: "14px",
                alignItems: "center",
              }}
            >
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, business, phone, address, postcode, pest or customer number..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #35503f",
                  borderRadius: "11px",
                  background: "#07100d",
                  color: "white",
                  padding: "13px 15px",
                  fontSize: "15px",
                }}
              />

              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                Showing {filteredCustomers.length} customer
                {filteredCustomers.length === 1 ? "" : "s"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  style={{
                    border:
                      filter === item
                        ? "1px solid #a3e635"
                        : "1px solid #31443a",
                    borderRadius: "999px",
                    background:
                      filter === item
                        ? "#315314"
                        : "#09110f",
                    color: "white",
                    padding: "8px 12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(300px, 0.9fr) minmax(440px, 1.5fr)",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <div style={panelStyle}>
              <div style={smallLabelStyle}>
                Customer records
              </div>

              <h2
                style={{
                  margin: "7px 0 18px",
                }}
              >
                Customers
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "11px",
                }}
              >
                {filteredCustomers.map((customer) => {
                  const selected =
                    customer.id === selectedCustomer.id;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setMessage("");
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "15px",
                        borderRadius: "12px",
                        border: selected
                          ? "1px solid #84cc16"
                          : "1px solid #273831",
                        background: selected
                          ? "#17341e"
                          : "#09110f",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "16px",
                          }}
                        >
                          {customer.businessName ||
                            customer.name}
                        </strong>

                        <span
                          style={{
                            borderRadius: "999px",
                            padding: "5px 9px",
                            background: statusColour(
                              customer.status,
                            ),
                            fontSize: "11px",
                            fontWeight: 900,
                          }}
                        >
                          {customer.status}
                        </span>
                      </div>

                      {customer.businessName && (
                        <div
                          style={{
                            marginTop: "6px",
                            color: "#b8c4bd",
                          }}
                        >
                          Contact: {customer.name}
                        </div>
                      )}

                      <div
                        style={{
                          color: "#718078",
                          marginTop: "5px",
                          fontSize: "13px",
                        }}
                      >
                        {customer.address},{" "}
                        {customer.postcode}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                          marginTop: "9px",
                          color: "#9eb0a6",
                          fontSize: "12px",
                        }}
                      >
                        <span>
                          {customer.totalJobs} jobs
                        </span>

                        <span>
                          £{customer.totalSpent.toFixed(2)}
                        </span>

                        <span>{customer.type}</span>
                      </div>
                    </button>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <div
                    style={{
                      padding: "30px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No customers match your search or filter.
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              <article style={panelStyle}>
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
                    <div style={smallLabelStyle}>
                      Customer #{selectedCustomer.id}
                    </div>

                    <h2
                      style={{
                        margin: "7px 0 4px",
                        fontSize: "29px",
                      }}
                    >
                      {selectedCustomer.businessName ||
                        selectedCustomer.name}
                    </h2>

                    {selectedCustomer.businessName && (
                      <div
                        style={{
                          color: "#b8c4bd",
                        }}
                      >
                        Contact: {selectedCustomer.name}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#8fa095",
                      }}
                    >
                      {selectedCustomer.type} customer
                    </div>
                  </div>

                  <span
                    style={{
                      borderRadius: "999px",
                      padding: "8px 13px",
                      background: statusColour(
                        selectedCustomer.status,
                      ),
                      fontWeight: 900,
                    }}
                  >
                    {selectedCustomer.status}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "12px",
                    marginTop: "20px",
                  }}
                >
                  {[
                    [
                      "☎ Phone",
                      selectedCustomer.phone,
                    ],
                    [
                      "✉ Email",
                      selectedCustomer.email,
                    ],
                    [
                      "📍 Property",
                      `${selectedCustomer.address}, ${selectedCustomer.postcode}`,
                    ],
                    [
                      "📋 Total Jobs",
                      String(selectedCustomer.totalJobs),
                    ],
                    [
                      "£ Total Spent",
                      `£${selectedCustomer.totalSpent.toFixed(
                        2,
                      )}`,
                    ],
                    [
                      "🔁 Next Visit",
                      selectedCustomer.nextVisit ||
                        "No visit booked",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: "13px",
                        borderRadius: "11px",
                        background: "#07100d",
                        border: "1px solid #263a30",
                      }}
                    >
                      <div
                        style={{
                          color: "#789084",
                          fontSize: "12px",
                          marginBottom: "5px",
                        }}
                      >
                        {label}
                      </div>

                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    flexWrap: "wrap",
                    marginTop: "16px",
                  }}
                >
                  <a
                    href={`tel:${selectedCustomer.phone.replace(
                      /\s/g,
                      "",
                    )}`}
                    style={{
                      ...buttonStyle,
                      background: "#475569",
                    }}
                  >
                    ☎ Call
                  </a>

                  <a
                    href={`https://wa.me/44${selectedCustomer.phone
                      .replace(/\s/g, "")
                      .replace(/^0/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...buttonStyle,
                      background: "#15803d",
                    }}
                  >
                    WhatsApp
                  </a>

                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    style={{
                      ...buttonStyle,
                      background: "#2563eb",
                    }}
                  >
                    ✉ Email
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedCustomer.address} ${selectedCustomer.postcode}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...buttonStyle,
                      background: "#0f766e",
                    }}
                  >
                    📍 Navigate
                  </a>

                  <button
                    type="button"
                    onClick={createJobForCustomer}
                    style={{
                      ...buttonStyle,
                      background: "#65a30d",
                    }}
                  >
                    + New Booking
                  </button>
                </div>
              </article>

              <article style={panelStyle}>
                <div style={smallLabelStyle}>
                  Pest and service history
                </div>

                <h2
                  style={{
                    margin: "7px 0 15px",
                  }}
                >
                  Previous activity
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "9px",
                  }}
                >
                  {selectedCustomer.pestHistory.length >
                  0 ? (
                    selectedCustomer.pestHistory.map(
                      (pest) => (
                        <span
                          key={pest}
                          style={{
                            borderRadius: "999px",
                            padding: "8px 11px",
                            background: "#17351f",
                            border:
                              "1px solid #426a4d",
                            color: "#d9f99d",
                            fontWeight: 800,
                          }}
                        >
                          {pest}
                        </span>
                      ),
                    )
                  ) : (
                    <span
                      style={{
                        color: "#9ca3af",
                      }}
                    >
                      No pest history recorded.
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#07100d",
                    border: "1px solid #263a30",
                  }}
                >
                  <div
                    style={{
                      color: "#789084",
                      fontSize: "12px",
                      marginBottom: "6px",
                    }}
                  >
                    Last treatment
                  </div>

                  <strong>
                    {selectedCustomer.lastTreatment}
                  </strong>
                </div>
              </article>

              <article style={panelStyle}>
                <div style={smallLabelStyle}>
                  Property and customer notes
                </div>

                <h2
                  style={{
                    margin: "7px 0 14px",
                  }}
                >
                  Important information
                </h2>

                <textarea
                  value={selectedCustomer.notes}
                  onChange={(event) =>
                    updateCustomer(
                      selectedCustomer.id,
                      {
                        notes: event.target.value,
                      },
                      "",
                    )
                  }
                  style={{
                    width: "100%",
                    minHeight: "130px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid #35503f",
                    background: "#07100d",
                    color: "white",
                    fontFamily: "inherit",
                    fontSize: "15px",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    flexWrap: "wrap",
                    marginTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        `Notes saved for ${selectedCustomer.name}.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#65a30d",
                    }}
                  >
                    Save Notes
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateCustomer(
                        selectedCustomer.id,
                        {
                          status: "Follow Up",
                        },
                        `${selectedCustomer.name} marked for follow-up.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#7e22ce",
                    }}
                  >
                    🔁 Mark Follow Up
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateCustomer(
                        selectedCustomer.id,
                        {
                          status: "Active",
                        },
                        `${selectedCustomer.name} marked as active.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#15803d",
                    }}
                  >
                    ✓ Mark Active
                  </button>
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}