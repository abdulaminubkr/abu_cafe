import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

const BLANK = { full_name: '', email: '', phone: '', password: '' };

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/superadmin/admins').then((res) => setAdmins(res.data.admins));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...BLANK }); setError(''); };
  const openEdit = (a) => { setForm({ ...a }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.id) {
        await api.put(`/superadmin/admins/${form.id}`, form);
      } else {
        await api.post('/superadmin/admins', form);
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save admin.');
    }
  };

  const handleSuspend = async (id) => { await api.post(`/superadmin/admins/${id}/suspend`); load(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin account?')) return;
    await api.delete(`/superadmin/admins/${id}`);
    load();
  };

  return (
    <DashboardLayout title="Admin Accounts">
      <div className="flex-between mb-3">
        <div />
        <button className="btn btn-primary" onClick={openNew}><i className="fa-solid fa-plus" /> New Admin</button>
      </div>

      {form && (
        <form onSubmit={handleSubmit} className="card mb-3" style={{ maxWidth: 480 }}>
          <h6 style={{ marginTop: 0 }}>{form.id ? 'Edit Admin' : 'Create Admin Account'}</h6>
          <div className="form-group"><label>Full Name</label><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          {!form.id && (
            <div className="form-group"><label>Password (default: Admin@123)</label><input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          )}
          <Alert type="danger" message={error} />
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.full_name}</td><td>{a.email}</td><td>{a.phone}</td>
                  <td><span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span></td>
                  <td>{a.created_at}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}><i className="fa-solid fa-pen" /></button>{' '}
                    <button className="btn btn-warning btn-sm" onClick={() => handleSuspend(a.id)}>{a.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>No admin accounts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
