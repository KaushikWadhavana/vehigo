import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/About.css";

function About() {
  return (
    <>
      <Navbar />

      <div className="about-clear">
        <div className="about-bg"></div>

        <section className="about-header">
          <h1>
            What is
            <span> Vehigo?</span>
          </h1>
          <p>
            Vehigo is a digital vehicle rental platform that enables users to
            access cars and bikes instantly, without ownership or long-term
            commitments.
          </p>
        </section>

        <section className="about-details">
          <div className="detail">
            <h3>🚗 What We Offer</h3>
            <p>
              Vehigo allows users to search, book, and manage vehicle rentals
              through a single web platform with real-time availability.
            </p>
          </div>

          <div className="detail">
            <h3>👥 Who Can Use It</h3>
            <p>
              Students, professionals, tourists, and daily commuters who need
              flexible transportation without purchasing a vehicle.
            </p>
          </div>

          <div className="detail">
            <h3>⚙️ How It Works</h3>
            <p>
              Users register, verify their identity, browse vehicles by location,
              and book instantly. Vehicle owners manage listings and pricing
              digitally.
            </p>
          </div>

          <div className="detail">
            <h3>🔐 Security & Trust</h3>
            <p>
              Vehigo uses secure authentication, verified users, and controlled
              access to ensure trust between renters and owners.
            </p>
          </div>

          <div className="detail highlight">
            <h3>🚀 Vision</h3>
            <p>
              To build a scalable, city-ready mobility platform that adapts to
              modern transportation needs.
            </p>
          </div>
        </section>
      
      </div>
      <Footer />
    </>
  );
}

export default About;
