import { Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Services from './Services';
import Contact from './Contact';

export default function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-mark">AA</span>
          A.A Dynamic Computer Training Center Bakori
        </div>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="landing-actions">
          <Link to="/login/admin" className="btn btn-outline btn-small">Admin Login</Link>
          <Link to="/login/customer" className="btn btn-outline btn-small">Login</Link>
          <Link to="/register" className="btn btn-primary btn-small">Register</Link>
        </div>
      </header>

      <main>
        <Home />
        <About />
        <Services />
        <Contact />
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div>
            <strong>A.A Dynamic Computer Training Center Bakori</strong>
            <p>Training and support for talented individuals and businesses.</p>
          </div>

          <div className="footer-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>
        </div>

        <div className="footer-bottom">
          Developed by Abdulmalik Aminu
        </div>
      </footer>
    </div>
  );
}
