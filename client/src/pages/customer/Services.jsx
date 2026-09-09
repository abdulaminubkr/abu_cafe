import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function CustomerServices() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState('');
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState('');

  const load = (query = q) => api.get('/customer/services', { params: { q: query } }).then((res) => setServices(res.data.services));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => { setQ(e.target.value); load(e.target.value); };

  const handleRequest = async (id) => {
    const qty = quantities[id] || 1;
    const res = await api.post(`/customer/services/${id}/request`, { quantity: qty });
    setMessage(`Service requested. Reference: ${res.data.payment.receipt_no}. Please pay/complete at the front desk.`);
  };

  return (
    <DashboardLayout title="Available Services">
      <input placeholder="Search services..." value={q} onChange={handleSearch} style={{ maxWidth: 320, marginBottom: '1rem' }} />
      {message && <div className="alert alert-success mb-3">{message}</div>}

      <div className="grid grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="card">
            <span className="badge badge-secondary">{s.category}</span>
            <h6>{s.name}</h6>
            <p className="small text-muted">{s.unit}</p>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--brand-green)', marginBottom: '.75rem' }}>
              ₦{Number(s.price).toLocaleString()}
            </div>
            <div className="flex gap-2">
              <input
                type="number" min={1} defaultValue={1} style={{ width: 70 }}
                onChange={(e) => setQuantities({ ...quantities, [s.id]: e.target.value })}
              />
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleRequest(s.id)}>Request</button>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="text-muted text-center" style={{ gridColumn: '1 / -1', padding: '3rem 0' }}>No services found.</p>}
      </div>
    </DashboardLayout>
  );
}
