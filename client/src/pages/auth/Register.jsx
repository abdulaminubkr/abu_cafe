import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import BrandPanel from '../../components/BrandPanel';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', school: '', matric_number: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register/intern', form);
      login(res.data.token, res.data.user, res.data.role);
      navigate('/intern');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-wrap">
      <BrandPanel />
      <div className="split-panel">
        <div className="split-card">
          <h2>Create Account</h2>
          <p className="subtitle">Your account will be created automatically</p>

          <div className="card-box">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.full_name} onChange={update('full_name')} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={form.email} onChange={update('email')} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input value={form.phone} onChange={update('phone')} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={update('address')} />
              </div>
              <div className="form-group">
                <label>School</label>
                <input value={form.school} onChange={update('school')} placeholder="e.g. Alhikma Science and Art School Bakori" />
              </div>
              <div className="form-group">
                <label>JAMB Number</label>
                <input value={form.matric_number} onChange={update('matric_number')} placeholder="e.g. 12345678AB" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={update('password')} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
            <Alert type="danger" message={error} />
            <p className="helper-text" style={{ marginBottom: 0 }}>
              Already have an account? <Link to="/login/customer">Login</Link>
            </p>
          </div>

          <p className="text-center mt-3" style={{ marginBottom: 0 }}>
            <Link to="/" className="small text-muted"><i className="fa-solid fa-arrow-left" /> Back to portal selection</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
