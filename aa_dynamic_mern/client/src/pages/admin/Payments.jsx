import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

export default function Payments() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ customer_id: '', service_id: '', quantity: 1 });

  const load = () => api.get('/admin/payments').then((res) => setData(res.data));
  useEffect(() => { load(); }, []);

  if (!data) return <DashboardLayout title="Payments & Revenue"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { customers, services, recent, revenue } = data;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_id) return;
    await api.post('/admin/payments', form);
    setForm({ customer_id: '', service_id: '', quantity: 1 });
    load();
  };

  const handleApprove = async (id) => { await api.post(`/admin/payments/${id}/approve`); load(); };

  return (
    <DashboardLayout title="Payments & Revenue">
      <div className="grid grid-cols-4 mb-3">
        <StatCard icon="fa-naira-sign" value={`₦${revenue.daily.toLocaleString()}`} label="Daily Revenue" />
        <StatCard icon="fa-naira-sign" value={`₦${revenue.weekly.toLocaleString()}`} label="Weekly Revenue" />
        <StatCard icon="fa-naira-sign" value={`₦${revenue.monthly.toLocaleString()}`} label="Monthly Revenue" />
        <StatCard icon="fa-naira-sign" value={`₦${revenue.yearly.toLocaleString()}`} label="Yearly Revenue" />
      </div>

      <div className="grid grid-cols-3">
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Record a Payment</h6>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="small">Customer (optional / walk-in)</label>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">Walk-in customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="small">Service</label>
              <select required value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                <option value="">Select a service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} (₦{Number(s.price).toLocaleString()})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="small">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block">Record Payment</button>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h6 style={{ marginTop: 0 }}>Recent Transactions</h6>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Receipt</th><th>Customer</th><th>Service</th><th>Amount</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>{p.receipt_no}</td><td>{p.customer_name || 'Walk-in'}</td><td>{p.service_name}</td>
                    <td>₦{Number(p.amount).toLocaleString()}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                    <td>{p.status !== 'paid' && <button className="btn btn-outline btn-sm" onClick={() => handleApprove(p.id)}>Mark Paid</button>}</td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '1.5rem' }}>No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
