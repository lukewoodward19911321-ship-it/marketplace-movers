"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

type TreatmentStatus =
  | "Scheduled"
  | "In Progress"
  | "Follow Up"
  | "Completed";

type RiskLevel = "Low" | "Medium" | "High";

type Treatment = {
  id: number;
  customer: string;
  property: string;
  pestType: string;
  productUsed: string;
  quantity: string;
  technician: string;
  treatmentDate: string;
  nextVisit: string | null;
  status: TreatmentStatus;
  riskLevel: RiskLevel;
  durationMinutes: number;
  baitPoints: number;
  notes: string;
};

type Product = {
  name: string;
  category: string;
  stock: number;
  unit: string;
  lowStockLevel: number;
};

const starterTreatments: Treatment[] = [
  {
    id: 3001,
    customer: "Sarah Williams",
    property: "24 Oakfield Road, Bridgend, CF31 4AB",
    pestType: "Rats & Mice",
    productUsed: "Contrac Blox",
    quantity: "120g",
    technician: "Luke Woodward",
    treatmentDate: "2026-08-04",
    nextVisit: "2026-08-11",
    status: "In Progress",
    riskLevel: "High",
    durationMinutes: 55,
    baitPoints: 6,
    notes:
      "Rodent activity beneath kitchen units and near rear drain. Six bait points installed. External air brick requires proofing.",
  },
  {
    id: 3002,
    customer: "David Jones",
    property: "18 High Street, Porthcawl, CF36 3BD",
    pestType: "Wasps",
    productUsed: "Digrain Wasp Killer",
    quantity: "25g",
    technician: "Luke Woodward",
    treatmentDate: "2026-08-04",
    nextVisit: null,
    status: "Scheduled",
    riskLevel: "Medium",
    durationMinutes: 30,
    baitPoints: 0,
    notes:
      "Nest reported above rear bedroom window. Access available from rear garden.",
  },
  {
    id: 3003,
    customer: "Lisa Davies",
    property: "7 Park Avenue, Swansea, SA1 4PQ",
    pestType: "Ants",
    productUsed: "Advion Ant Gel",
    quantity: "15g",
    technician: "Luke Woodward",
    treatmentDate: "2026-08-03",
    nextVisit: "2026-08-10",
    status: "Follow Up",
    riskLevel: "Low",
    durationMinutes: 40,
    baitPoints: 8,
    notes:
      "Gel treatment applied beneath kitchen units and around patio-door entry points.",
  },
  {
    id: 3004,
    customer: "Greenfield School",
    property: "School Road, Neath, SA10 7AA",
    pestType: "Rodents",
    productUsed: "Storm Secure",
    quantity: "250g",
    technician: "Luke Woodward",
    treatmentDate: "2026-08-02",
    nextVisit: "2026-08-09",
    status: "Completed",
    riskLevel: "High",
    durationMinutes: 90,
    baitPoints: 12,
    notes:
      "Commercial monitoring completed in kitchen, bin store and boiler room. Follow-up booked.",
  },
];

const starterProducts: Product[] = [
  {
    name: "Contrac Blox",
    category: "Rodenticide",
    stock: 4,
    unit: "tubs",
    lowStockLevel: 2,
  },
  {
    name: "Storm Secure",
    category: "Rodenticide",
    stock: 2,
    unit: "tubs",
    lowStockLevel: 2,
  },
  {
    name: "Advion Ant Gel",
    category: "Insecticide",
    stock: 8,
    unit: "tubes",
    lowStockLevel: 3,
  },
  {
    name: "Digrain Wasp Killer",
    category: "Insecticide",
    stock: 3,
    unit: "containers",
    lowStockLevel: 2,
  },
  {
    name: "Wire Wool",
    category: "Proofing",
    stock: 12,
    unit: "rolls",
    lowStockLevel: 4,
  },
  {
    name: "Expanding Foam",
    category: "Proofing",
    stock: 6,
    unit: "cans",
    lowStockLevel: 3,
  },
];

const filters = [
  "All",
  "Scheduled",
  "In Progress",
  "Follow Up",
  "Completed",
] as const;

type Filter = (typeof filters)[number];

export default function PestTreatmentsPage() {
  const [treatments, setTreatments] =
    useState<Treatment[]>(starterTreatments);

  const [products] = useState<Product[]>(starterProducts);

  const [selectedTreatmentId, setSelectedTreatmentId] =
    useState(starterTreatments[0].id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [message, setMessage] = useState("");

  const selectedTreatment =
    treatments.find(
      (treatment) =>
        treatment.id === selectedTreatmentId,
    ) || treatments[0];

  const filteredTreatments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return treatments
      .filter((treatment) => {
        if (filter === "All") {
          return true;
        }

        return treatment.status === filter;
      })
      .filter((treatment) => {
        if (!query) {
          return true;
        }

        return [
          String(treatment.id),
          treatment.customer,
          treatment.property,
          treatment.pestType,
          treatment.productUsed,
          treatment.technician,
        ].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .sort((a, b) =>
        b.treatmentDate.localeCompare(a.treatmentDate),
      );
  }, [treatments, filter, search]);

  const activeTreatments = treatments.filter(
    (treatment) =>
      treatment.status === "In Progress",
  ).length;

  const completedToday = treatments.filter(
    (treatment) =>
      treatment.status === "Completed" &&
      treatment.treatmentDate === "2026-08-04",
  ).length;

  const followUpsDue = treatments.filter(
    (treatment) =>
      treatment.status === "Follow Up" ||
      treatment.nextVisit === "2026-08-04",
  ).length;

  const productsUsedToday = new Set(
    treatments
      .filter(
        (treatment) =>
          treatment.treatmentDate === "2026-08-04",
      )
      .map((treatment) => treatment.productUsed),
  ).size;

  const completedTreatments = treatments.filter(
    (treatment) =>
      treatment.status === "Completed",
  ).length;

  const successRate =
    treatments.length === 0
      ? 0
      : Math.round(
          (completedTreatments / treatments.length) *
            100,
        );

  function updateTreatment(
    id: number,
    updates: Partial<Treatment>,
    confirmation: string,
  ) {
    setTreatments((current) =>
      current.map((treatment) =>
        treatment.id === id
          ? {
              ...treatment,
              ...updates,
            }
          : treatment,
      ),
    );

    if (confirmation) {
      setMessage(confirmation);
    }
  }

  function addTreatment() {
    const nextId =
      Math.max(
        ...treatments.map(
          (treatment) => treatment.id,
        ),
      ) + 1;

    const newTreatment: Treatment = {
      id: nextId,
      customer: "New Customer",
      property: "Property address required",
      pestType: "Pest Inspection",
      productUsed: "Product not selected",
      quantity: "0",
      technician: "Luke Woodward",
      treatmentDate: "2026-08-04",
      nextVisit: null,
      status: "Scheduled",
      riskLevel: "Low",
      durationMinutes: 0,
      baitPoints: 0,
      notes:
        "Edit this treatment to add the inspection and treatment details.",
    };

    setTreatments((current) => [
      newTreatment,
      ...current,
    ]);

    setSelectedTreatmentId(nextId);
    setMessage(`Treatment #${nextId} created.`);
  }

  function riskColour(risk: RiskLevel) {
    if (risk === "High") {
      return "#b91c1c";
    }

    if (risk === "Medium") {
      return "#b45309";
    }

    return "#166534";
  }

  function statusColour(
    status: TreatmentStatus,
  ) {
    if (status === "Completed") {
      return "#166534";
    }

    if (status === "In Progress") {
      return "#0f766e";
    }

    if (status === "Follow Up") {
      return "#7e22ce";
    }

    return "#1d4ed8";
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
    boxShadow:
      "0 12px 35px rgba(0, 0, 0, 0.22)",
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
                "linear-gradient(90deg, rgba(2,8,5,.98), rgba(5,20,10,.82), rgba(5,20,10,.15)), url('/banners/pest-treatments.jpg') center/cover",
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
                  fontSize:
                    "clamp(38px, 6vw, 68px)",
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                }}
              >
                Pest{" "}
                <span
                  style={{
                    color: "#84cc16",
                  }}
                >
                  Treatments
                </span>
              </h1>

              <p
                style={{
                  margin: "16px 0 22px",
                  color: "#d1d5db",
                  fontSize: "17px",
                  maxWidth: "650px",
                }}
              >
                Record treatments, products,
                quantities, bait points, follow-ups
                and inspection evidence.
              </p>

              <button
                type="button"
                onClick={addTreatment}
                style={{
                  ...buttonStyle,
                  background: "#65a30d",
                  padding: "12px 18px",
                }}
              >
                + Add Treatment
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
                label: "Active Treatments",
                value: activeTreatments,
                detail: "Currently in progress",
                icon: "🧪",
              },
              {
                label: "Completed Today",
                value: completedToday,
                detail: "Finished treatments",
                icon: "✅",
              },
              {
                label: "Follow-ups Due",
                value: followUpsDue,
                detail: "Further visits required",
                icon: "🔁",
              },
              {
                label: "Products Used Today",
                value: productsUsedToday,
                detail: "Different products",
                icon: "📦",
              },
              {
                label: "Success Rate",
                value: `${successRate}%`,
                detail: "Completed treatments",
                icon: "📈",
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
                placeholder="Search customer, property, pest, product, technician or treatment number..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #35503f",
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
                Showing{" "}
                {filteredTreatments.length} treatment
                {filteredTreatments.length === 1
                  ? ""
                  : "s"}
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
                "minmax(300px, .85fr) minmax(460px, 1.55fr)",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              <div style={panelStyle}>
                <div style={smallLabelStyle}>
                  Treatment records
                </div>

                <h2
                  style={{
                    margin: "7px 0 18px",
                  }}
                >
                  Treatments
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: "11px",
                  }}
                >
                  {filteredTreatments.map(
                    (treatment) => {
                      const selected =
                        treatment.id ===
                        selectedTreatment.id;

                      return (
                        <button
                          key={treatment.id}
                          type="button"
                          onClick={() => {
                            setSelectedTreatmentId(
                              treatment.id,
                            );
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
                              justifyContent:
                                "space-between",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <strong>
                              #{treatment.id} ·{" "}
                              {treatment.pestType}
                            </strong>

                            <span
                              style={{
                                padding: "5px 9px",
                                borderRadius:
                                  "999px",
                                background:
                                  statusColour(
                                    treatment.status,
                                  ),
                                fontSize: "11px",
                                fontWeight: 900,
                              }}
                            >
                              {treatment.status}
                            </span>
                          </div>

                          <div
                            style={{
                              marginTop: "7px",
                              color: "#b8c4bd",
                            }}
                          >
                            {treatment.customer}
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              color: "#718078",
                              fontSize: "13px",
                            }}
                          >
                            {treatment.property}
                          </div>

                          <div
                            style={{
                              marginTop: "8px",
                              color: "#9eb0a6",
                              fontSize: "12px",
                            }}
                          >
                            {treatment.productUsed} ·{" "}
                            {treatment.quantity}
                          </div>
                        </button>
                      );
                    },
                  )}

                  {filteredTreatments.length ===
                    0 && (
                    <div
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "#9ca3af",
                      }}
                    >
                      No treatments match your
                      search or filter.
                    </div>
                  )}
                </div>
              </div>

              <div style={panelStyle}>
                <div style={smallLabelStyle}>
                  Product stock
                </div>

                <h2
                  style={{
                    margin: "7px 0 18px",
                  }}
                >
                  Products and materials
                </h2>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {products.map((product) => {
                    const lowStock =
                      product.stock <=
                      product.lowStockLevel;

                    return (
                      <div
                        key={product.name}
                        style={{
                          padding: "13px",
                          borderRadius: "11px",
                          background: "#07100d",
                          border: lowStock
                            ? "1px solid #b45309"
                            : "1px solid #263a30",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            <div
                              style={{
                                marginTop: "4px",
                                color: "#789084",
                                fontSize: "12px",
                              }}
                            >
                              {product.category}
                            </div>
                          </div>

                          <div
                            style={{
                              textAlign: "right",
                            }}
                          >
                            <strong
                              style={{
                                color: lowStock
                                  ? "#fb923c"
                                  : "#a3e635",
                              }}
                            >
                              {product.stock}{" "}
                              {product.unit}
                            </strong>

                            {lowStock && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  color: "#fb923c",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                }}
                              >
                                LOW STOCK
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                    justifyContent:
                      "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={smallLabelStyle}>
                      Treatment #
                      {selectedTreatment.id}
                    </div>

                    <h2
                      style={{
                        margin: "7px 0 4px",
                        fontSize: "29px",
                      }}
                    >
                      {selectedTreatment.pestType}
                    </h2>

                    <div
                      style={{
                        color: "#b8c4bd",
                      }}
                    >
                      {selectedTreatment.customer}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "8px 12px",
                        background: riskColour(
                          selectedTreatment.riskLevel,
                        ),
                        fontWeight: 900,
                      }}
                    >
                      {selectedTreatment.riskLevel} Risk
                    </span>

                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "8px 12px",
                        background: statusColour(
                          selectedTreatment.status,
                        ),
                        fontWeight: 900,
                      }}
                    >
                      {selectedTreatment.status}
                    </span>
                  </div>
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
                      "📍 Property",
                      selectedTreatment.property,
                    ],
                    [
                      "🧪 Product",
                      selectedTreatment.productUsed,
                    ],
                    [
                      "📏 Quantity",
                      selectedTreatment.quantity,
                    ],
                    [
                      "📅 Treatment Date",
                      selectedTreatment.treatmentDate,
                    ],
                    [
                      "🔁 Next Visit",
                      selectedTreatment.nextVisit ||
                        "No follow-up booked",
                    ],
                    [
                      "👤 Technician",
                      selectedTreatment.technician,
                    ],
                    [
                      "⏱ Duration",
                      `${selectedTreatment.durationMinutes} minutes`,
                    ],
                    [
                      "📦 Bait Points",
                      String(
                        selectedTreatment.baitPoints,
                      ),
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
                  <button
                    type="button"
                    onClick={() =>
                      updateTreatment(
                        selectedTreatment.id,
                        {
                          status: "In Progress",
                        },
                        `Treatment #${selectedTreatment.id} started.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#0f766e",
                    }}
                  >
                    ▶ Start Treatment
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateTreatment(
                        selectedTreatment.id,
                        {
                          status: "Completed",
                        },
                        `Treatment #${selectedTreatment.id} completed.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#15803d",
                    }}
                  >
                    ✓ Complete Treatment
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateTreatment(
                        selectedTreatment.id,
                        {
                          status: "Follow Up",
                        },
                        `Treatment #${selectedTreatment.id} marked for follow-up.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#7e22ce",
                    }}
                  >
                    🔁 Schedule Follow-up
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        `Photo upload for treatment #${selectedTreatment.id} will be connected next.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#334155",
                    }}
                  >
                    📷 Upload Photos
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        `Treatment report #${selectedTreatment.id} will be generated next.`,
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#334155",
                    }}
                  >
                    📝 Generate Report
                  </button>
                </div>
              </article>

              <article style={panelStyle}>
                <div style={smallLabelStyle}>
                  Inspection and treatment notes
                </div>

                <h2
                  style={{
                    margin: "7px 0 14px",
                  }}
                >
                  Findings and actions
                </h2>

                <textarea
                  value={selectedTreatment.notes}
                  onChange={(event) =>
                    updateTreatment(
                      selectedTreatment.id,
                      {
                        notes: event.target.value,
                      },
                      "",
                    )
                  }
                  style={{
                    width: "100%",
                    minHeight: "150px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    padding: "14px",
                    borderRadius: "12px",
                    border:
                      "1px solid #35503f",
                    background: "#07100d",
                    color: "white",
                    fontFamily: "inherit",
                    fontSize: "15px",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      `Treatment notes saved for #${selectedTreatment.id}.`,
                    )
                  }
                  style={{
                    ...buttonStyle,
                    marginTop: "12px",
                    background: "#65a30d",
                  }}
                >
                  Save Treatment Notes
                </button>
              </article>

              <article style={panelStyle}>
                <div style={smallLabelStyle}>
                  Treatment evidence
                </div>

                <h2
                  style={{
                    margin: "7px 0 16px",
                  }}
                >
                  Photos and documentation
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {[
                    ["📷", "Before Photos"],
                    ["🧪", "Products Used"],
                    ["🛠️", "Proofing Work"],
                    ["📸", "After Photos"],
                  ].map(([icon, label]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setMessage(
                          `${label} for treatment #${selectedTreatment.id} will be connected next.`,
                        )
                      }
                      style={{
                        minHeight: "130px",
                        borderRadius: "12px",
                        border:
                          "1px dashed #426a4d",
                        background: "#07100d",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "30px",
                        }}
                      >
                        {icon}
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "8px",
                        }}
                      >
                        {label}
                      </strong>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}