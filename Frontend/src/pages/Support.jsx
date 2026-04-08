import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Support.css";

function Support() {
  const [active, setActive] = useState(null);

  return (
    <>
      <Navbar />

      <div className="support-page">
        {/* BACKGROUND LOGO */}
        <div className="support-bg-logo"></div>

        {/* HERO */}
        <section className="support-hero">
          <h1>
            Support <span>Center</span>
          </h1>
          <p>Find answers quickly or contact our support team.</p>
        </section>

        {/* OPTIONS */}
        <section className="support-options">
          <div className="support-card clickable" onClick={() => setActive("help")}>
            <h3>📘 Help & Guidance</h3>
            <p>General help and platform usage.</p>
          </div>

          <div className="support-card clickable" onClick={() => setActive("account")}>
            <h3>🧑‍💻 Account Support</h3>
            <p>Login, verification, profile issues.</p>
          </div>

          <div className="support-card clickable" onClick={() => setActive("booking")}>
            <h3>🚗 Booking Assistance</h3>
            <p>Vehicle booking and trip help.</p>
          </div>

          <div className="support-card clickable" onClick={() => setActive("payment")}>
            <h3>💳 Payments & Billing</h3>
            <p>Payments, refunds, billing issues.</p>
          </div>
        </section>

        {/* FAQ */}
        {active && (
          <section className="support-qa">
            {active === "help" && (
              <>
                <h2>Help & Guidance</h2>
                <ul>
                  <li><strong>Q:</strong> How do I register?<br /><strong>A:</strong> Register using email or Google.</li>
                  <li><strong>Q:</strong> How do bookings work?<br /><strong>A:</strong> Choose vehicle, duration, confirm.</li>
                </ul>
              </>
            )}

            {active === "account" && (
              <>
                <h2>Account Support</h2>
                <ul>
                  <li><strong>Q:</strong> Can’t login?<br /><strong>A:</strong> Reset password.</li>
                  <li><strong>Q:</strong> Email not verified?<br /><strong>A:</strong> Check inbox.</li>
                </ul>
              </>
            )}

            {active === "booking" && (
              <>
                <h2>Booking Assistance</h2>
                <ul>
                  <li><strong>Q:</strong> Vehicle unavailable?<br /><strong>A:</strong> Already booked.</li>
                  <li><strong>Q:</strong> Can I cancel?<br /><strong>A:</strong> Yes, per policy.</li>
                </ul>
              </>
            )}

            {active === "payment" && (
              <>
                <h2>Payments & Billing</h2>
                <ul>
                  <li><strong>Q:</strong> Payment failed?<br /><strong>A:</strong> Auto-refund.</li>
                  <li><strong>Q:</strong> Refund time?<br /><strong>A:</strong> 3–5 business days.</li>
                </ul>
              </>
            )}
          </section>
        )}

        {/* STILL NEED HELP */}
        <section className="support-contact">
          <h2>Still need help?</h2>
          <p>Contact our support team anytime.</p>

          <div className="contact-box">
            <div>
              <span>Email</span>
              <p>wadhvanakaushik@gmail.com</p>
            </div>

            <div>
              <span>Phone</span>
              <p>+91 9876543210</p>
            </div>

            <div>
              <span>Response Time</span>
              <p>Within 24 hours</p>
            </div>
          </div>
        </section>


      </div>

      <Footer />
    </>
  );
}

export default Support;
