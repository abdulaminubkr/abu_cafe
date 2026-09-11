import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function Notifications() {
  const [interns, setInterns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sent, setSent] = useState([]);
  const [form, setForm] = useState({ recipient_type: 'intern', recipient_id: '', title: '', message: '' });

  const load = () => api.get('/admin/notifications').then((res) => {
    setInterns(res.data.interns);
    setCustomers(res.data.customers);
    setSent(res.data.sent);
  });
  useEffect(() => { load(); }, []);

  const recipients = form.recipient_type === 'intern' ? interns : customers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipient_id) return;
    await api.post('/admin/notifications', form);
    setForm({ recipient_type: form.recipient_type, recipient_id: '', title: '', message: '' });
    load();
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="grid grid-cols-3">
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Send Notification</h6>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="small">Recipient Type</label>
              <select value={form.recipient_type} onChange={(e) => setForm({ ...form, recipient_type: e.target.value, recipient_id: '' })}>
                <option value="intern">Intern</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="small">Recipient</label>
              <select required value={form.recipient_id} onChange={(e) => setForm({ ...form, recipient_id: e.target.value })}>
                <option value="">Select recipient</option>
                {recipients.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="small">Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label className="small">Message</label><textarea required rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <button className="btn btn-primary btn-block">Send</button>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h6 style={{ marginTop: 0 }}>Recently Sent</h6>
          {sent.map((n) => (
            <div key={n.id} className="mb-2" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{n.title} <span className="badge badge-secondary">{n.recipient_type}#{n.recipient_id}</span></div>
              <div className="small text-muted">{n.message}</div>
              <div className="small text-muted">{n.created_at}</div>
            </div>
          ))}
          {sent.length === 0 && <p className="text-muted">No notifications sent yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
