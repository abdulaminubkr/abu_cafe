import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import BrandPanel from '../../components/BrandPanel';
import Alert from '../../components/Alert';

export default function ForgotPassword() {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/auth/forgot-password/${role}`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-wrap">
      <BrandPanel />
      <div className="split-panel">
        <div className="split-card">
          <h2>Reset Password</h2>
          <p className="subtitle">Enter your email and we'll send a temporary password</p>

          <div className="card-box">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <Alert type="info" message={message} />
          </div>

          <p className="text-center mt-3" style={{ marginBottom: 0 }}>
            <Link to={`/login/${role}`} className="small text-muted"><i className="fa-solid fa-arrow-left" /> Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
