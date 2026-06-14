"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitMessage = async () => {
    setStatusMessage("");

    if (!name.trim() || !email.trim() || !messageText.trim()) {
      setStatusMessage("Please fill in your name, email and message.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message: messageText,
    });

    if (error) {
      setStatusMessage(error.message);
      setLoading(false);
      return;
    }

    setStatusMessage("Your message has been sent successfully.");
    setName("");
    setEmail("");
    setSubject("");
    setMessageText("");
    setLoading(false);
  };

  return (
    <main className="container">
      <div className="dark-card" style={{ padding: "32px" }}>
        <h1>Contact Support</h1>

        <p>
          Need help with your account, jobs, payments, contracts, or reporting a
          user? Send us a message or contact us directly.
        </p>

        <br />

        <label className="form-label">Name</label>
        <input
          className="form-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="form-label">Email</label>
        <input
          className="form-input"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="form-label">Subject</label>
        <input
          className="form-input"
          placeholder="What do you need help with?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <label className="form-label">Message</label>
        <textarea
          className="form-input proposal-textarea"
          placeholder="Write your message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />

        <button
          onClick={submitMessage}
          disabled={loading}
          className="primary-action-btn"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>

        {statusMessage && <p className="upload-message">{statusMessage}</p>}

        <br />
        <br />

        <h2>Email Support</h2>
        <p>
          <a href="mailto:support@freelancehubsa.co.za">
            support@freelancehubsa.co.za
          </a>
        </p>

        <h2>WhatsApp Support</h2>
        <p>
          <a
            href="https://wa.me/27624494338"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </a>
        </p>

        <h2>Business Hours</h2>
        <p>Monday - Friday</p>
        <p>08:00 - 17:00</p>

        <h2>Website</h2>
        <p>https://freelancehubsa.co.za</p>

        <p>Looking for quick answers? Visit our FAQ page.</p>

        <Link href="/faq">Frequently Asked Questions</Link>
      </div>
    </main>
  );
}