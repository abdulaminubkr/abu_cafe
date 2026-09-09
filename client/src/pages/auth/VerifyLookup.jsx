import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api';
import BrandPanel from '../../components/BrandPanel';

export default function VerifyLookup() {
  const [searchParams] = useSearchParams();
  const [certNo, setCertNo] = useState(searchParams.get('cert_no') || '');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certNo.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/verify/${encodeURIComponent(certNo.trim())}`);
      setResult(res.data.cert);
      setSearched(true);
    } catch (err) {
      setResult(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-wrap">
      <BrandPanel />
      <div className="split-panel">
        <div className="split-card">
          <h2>Verify a Certificate</h2>
          <p className="subtitle">Enter the certificate number to confirm it's authentic</p>

          <div className="card-box">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Certificate Number</label>
                <input
                  value={certNo}
                  onChange={(e) => setCertNo(e.target.value)}
                  placeholder="e.g. AAD/CERT/2026/AB12CD"
                  required autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                <i className="fa-solid fa-magnifying-glass" /> {loading ? 'Checking...' : 'Verify Certificate'}
              </button>
            </form>

            {searched && (
              <>
                <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #eee' }} />
                {result && result.status === 'approved' && (
                  <div className="alert alert-success" style={{ marginTop: 0 }}>
                    <i className="fa-solid fa-circle-check" /> Valid certificate — <strong>{result.full_name}</strong>, issued {result.date_issued}.
                  </div>
                )}
                {result && result.status !== 'approved' && (
                  <div className="alert alert-warning" style={{ marginTop: 0 }}>
                    <i className="fa-solid fa-triangle-exclamation" /> This certificate exists but is currently <strong>{result.status}</strong> and not valid.
                  </div>
                )}
                {!result && (
                  <div className="alert alert-danger" style={{ marginTop: 0 }}>
                    <i className="fa-solid fa-circle-xmark" /> No certificate found with that number.
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-center mt-3" style={{ marginBottom: 0 }}>
            <Link to="/" className="small text-muted"><i className="fa-solid fa-arrow-left" /> Back to portal selection</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
