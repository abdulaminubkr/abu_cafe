import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import BrandPanel from '../../components/BrandPanel';

const ROLES = [
  { role: 'admin', label: 'Admin Login', icon: 'fa-user-tie' },
  { role: 'super_admin', label: 'Super Admin Login', icon: 'fa-user-shield' },
  { role: 'intern', label: 'Intern Login', icon: 'fa-user-graduate' },
  { role: 'customer', label: 'Customer Login', icon: 'fa-user' },
];

export default function Landing() {
  const [services, setServices] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/public/services')
      .then((res) => setServices(res.data.services || []))
      .catch(() => setLoadError(true));
  }, []);

  const byCategory = services.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <>
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
                New intern? <Link to="/register">Create an account</Link> — it only takes a minute.
              </p>
            </div>

            <Link to="/verify" className="verify-link">
              <i className="fa-solid fa-award" /> Need to verify a certificate? Click here
            </Link>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '.25rem' }}>Our Services</h2>
          <p className="text-center text-muted mb-3">Walk-in pricing at A.A Dynamic Computer Training Center Bakori</p>

          {loadError && <p className="text-center text-muted">Services are temporarily unavailable.</p>}

          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category} className="mb-3">
              <h6 style={{ color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '.04em', fontSize: '.8rem' }}>
                {category}
              </h6>
              <div className="grid grid-cols-4">
                {items.map((s) => (
                  <div key={s.name} className="card">
                    <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{s.name}</div>
                    <div className="small text-muted">{s.unit}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--brand-green)', marginTop: '.4rem' }}>
                      ₦{Number(s.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loadError && services.length === 0 && (
            <p className="text-center text-muted">Loading services...</p>
          )}
        </div>
      </div>
    </>
  );
}
