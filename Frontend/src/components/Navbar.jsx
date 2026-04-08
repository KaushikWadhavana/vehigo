import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <div className="brand-box">
          <Link to="/" className="brand-link">
            <img src="/logo.png" alt="Vehigo Logo" className="brand-logo" />
          </Link>
          <h1 className="brand-text">Vehigo</h1>
        </div>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/support">Support</Link></li>
          <li><Link to="/login" className="login-btn">Sign In/Up</Link></li>
        </ul>

      </div>
    </nav>
  );
}

export default Navbar;
