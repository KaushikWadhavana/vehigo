import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer-clean">
      <div className="footer-grid">

        <div className="footer-col footer-about">
          <h4>Vehigo</h4>
          <p>
            Vehigo is a smart vehicle rental platform that helps users
            access cars and bikes easily, securely, and on demand.
          </p>
          <span className="footer-email">wadhvanakaushik@gmail.com</span>
          
    <div>
      
      <p>+91 9876543210</p>
    </div>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/support">Support</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 Vehigo · Built for smart mobility
      </div>
    </footer>
  );
}

export default Footer;
