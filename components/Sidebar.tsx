import Link from "next/link";

export default function Sidebar() {
  const links = [
    { name: "Dashboard", href: "/" },
    { name: "Driver Mode", href: "/driver" },
    { name: "Jobs", href: "/jobs" },
    { name: "Customers", href: "/customers" },
    { name: "Calendar", href: "/calendar" },
    { name: "Finance", href: "/finance" },
    { name: "Expenses", href: "/expenses" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "#05070b",
        borderRight: "1px solid #243247",
        padding: "24px 18px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h2
          style={{
            margin: 0,
            color: "white",
            fontSize: "22px",
          }}
        >
          Marketplace Movers
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            color: "#718096",
            fontSize: "13px",
          }}
        >
          Business Control Centre
        </p>
      </div>

      <nav
        style={{
          display: "grid",
          gap: "8px",
        }}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: "white",
              textDecoration: "none",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#111823",
              fontWeight: "bold",
            }}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}