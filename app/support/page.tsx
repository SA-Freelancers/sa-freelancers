export default function SupportPage() {
  return (
    <main className="container">
      <div className="dark-card" style={{ padding: "32px" }}>
        <h1>Contact Support</h1>

        <p>
          Need help with your account, jobs, payments, contracts, or reporting
          a user? Contact us using the details below.
        </p>

        <br />

        <h2>Email Support</h2>

        <p>
          <a href="mailto:support@freelancehubsa.co.za">
            support@freelancehubsa.co.za
          </a>
        </p>

        <br />

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

        <br />

        <h2>Business Hours</h2>

        <p>Monday - Friday</p>
        <p>08:00 - 17:00</p>

        <br />

        <h2>Website</h2>

        <p>https://freelancehubsa.co.za</p>
        <p>
  Looking for quick answers? Visit our FAQ page.
</p>

<Link href="/faq">
  Frequently Asked Questions
</Link>
      </div>
    </main>
  );
}