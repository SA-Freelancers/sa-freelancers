import Link from "next/link";

export default function EmptyState({
  title,
  description,
  buttonText,
  buttonLink,
  emoji,
}: {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  emoji?: string;
}) {
  return (
    <div className="dark-card" style={card}>
      <div style={{ fontSize: 52, marginBottom: 15 }}>
        {emoji || "📭"}
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

      {buttonText && buttonLink && (
        <Link href={buttonLink} style={button}>
          {buttonText}
        </Link>
      )}
    </div>
  );
}

const card = {
  padding: 35,
  borderRadius: 18,
  textAlign: "center" as const,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const button = {
  display: "inline-block",
  marginTop: 18,
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: "bold",
};