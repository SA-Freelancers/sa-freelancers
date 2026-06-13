"use client";

import { FaWhatsapp } from "react-icons/fa";

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
        fontSize: "32px",
        textDecoration: "none",
        zIndex: 9999,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      }}
      aria-label="WhatsApp Support"
    >
      <FaWhatsapp />
    </a>
  );
}