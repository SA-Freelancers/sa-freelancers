export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/27624494338"
      target="_blank"
      rel="noreferrer"
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        background: "#25D366",
        color: "white",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        textDecoration: "none",
        zIndex: 9999,
      }}
    >
      💬
    </a>
  );
}