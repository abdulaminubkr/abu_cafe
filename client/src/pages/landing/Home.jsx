import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section id="home" className="landing-section landing-hero">
      <div className="landing-hero-copy">
        <span className="eyebrow">Welcome to our platform</span>
        <h1>Build confidence, skills, and growth with trusted support.</h1>
        <p>
          We help students, JAMB interns, and customers access the right services, track progress,
          and stay connected with a simple digital experience designed for success.
        </p>

        <div className="landing-buttons">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login/admin" className="btn btn-outline">Admin Login</Link>
          <Link to="/login/customer" className="btn btn-outline">Login</Link>
        </div>
      </div>

      <div className="landing-hero-card">
        <div className="mini-stat">
          <span className="mini-stat-label">Active JAMB Interns</span>
          <strong>1,200+</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Customer Satisfaction</span>
          <strong>96%</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Support Services</span>
          <strong>24/7</strong>
        </div>
      </div>
    </section>
  );
}
