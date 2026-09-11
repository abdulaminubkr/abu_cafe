import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import BrandPanel from '../../components/BrandPanel';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';

const ROLE_META = {
  super_admin: { label: 'Super Admin', icon: 'fa-user-shield', home: '/superadmin' },
  admin: { label: 'Admin', icon: 'fa-user-tie', home: '/admin' },
  intern: { label: 'JAMB Intern', icon: 'fa-user-graduate', home: '/intern' },
  customer: { label: 'Customer', icon: 'fa-user', home: '/customer' },
};

export default function Login() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const meta = ROLE_META[role] || ROLE_META.admin;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/auth/login/${role}`, { email, password });
      login(res.data.token, res.data.user, res.data.role);
      navigate(meta.home);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-wrap">
      <BrandPanel />
      <div className="split-panel">
        <div className="split-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to your {meta.label} portal</p>

          <div className="card-box">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <i className={`fa-solid ${meta.icon}`} /> {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <Alert type="danger" message={error} />
            <p className="helper-text" style={{ marginBottom: 0 }}>
              <Link to={`/forgot-password/${role}`}>Forgot password?</Link>
              {role === 'customer' && <> &middot; New here? <Link to="/register">Create account</Link></>}
            </p>
          </div>

          <Link to="/verify" className="verify-link">
            <i className="fa-solid fa-award" /> Need to verify a certificate? Click here
          </Link>
          <p className="text-center mt-3" style={{ marginBottom: 0 }}>
            <Link to="/" className="small text-muted"><i className="fa-solid fa-arrow-left" /> Back to portal selection</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
