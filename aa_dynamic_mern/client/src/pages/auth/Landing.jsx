import { Link } from 'react-router-dom';
import BrandPanel from '../../components/BrandPanel';

const ROLES = [
  { role: 'admin', label: 'Admin Login', icon: 'fa-user-tie' },
  { role: 'super_admin', label: 'Super Admin Login', icon: 'fa-user-shield' },
  { role: 'intern', label: 'Intern Login', icon: 'fa-user-graduate' },
  { role: 'customer', label: 'Customer Login', icon: 'fa-user' },
];

export default function Landing() {
  return (
    <div className="split-wrap">
      <BrandPanel />
      <div className="split-panel">
        <div className="split-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Choose your portal to sign in</p>

          <div className="card-box">
            <div className="role-select-list">
              {ROLES.map((r) => (
                <Link key={r.role} to={`/login/${r.role}`}>
                  <span className="role-icon"><i className={`fa-solid ${r.icon}`} /></span> {r.label}
                </Link>
              ))}
            </div>
            <p className="helper-text">
              New here? <Link to="/register">Create a customer account</Link> — it only takes a minute.
            </p>
          </div>

          <Link to="/verify" className="verify-link">
            <i className="fa-solid fa-award" /> Need to verify a certificate? Click here
          </Link>
        </div>
      </div>
    </div>
  );
}
