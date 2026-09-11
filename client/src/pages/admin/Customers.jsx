import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = (query = q) => api.get('/admin/customers', { params: { q: query } }).then((res) => setCustomers(res.data.customers));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => { setQ(e.target.value); load(e.target.value); };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/admin/customers/${editing.id}`, editing);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save customer.');
    }
  };

  const handleSuspend = async (id) => { await api.post(`/admin/customers/${id}/suspend`); load(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await api.delete(`/admin/customers/${id}`);
    load();
  };

  return (
    <DashboardLayout title="Customer Management">
      <input placeholder="Search by name or email..." value={q} onChange={handleSearch} style={{ maxWidth: 300, marginBottom: '1rem' }} />

      {editing && (
        <form onSubmit={handleSave} className="card mb-3" style={{ maxWidth: 520 }}>
          <h6 style={{ marginTop: 0 }}>Edit Customer</h6>
          <div className="form-group"><label>Full Name</label><input required value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input required type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
          <div className="form-group"><label>Phone</label><input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
          <div className="form-group"><label>Address</label><input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
          <Alert type="danger" message={error} />
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td><td>{c.email}</td><td>{c.phone}</td>
                  <td><span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(c)}><i className="fa-solid fa-pen" /></button>{' '}
                    <button className="btn btn-warning btn-sm" onClick={() => handleSuspend(c.id)}>{c.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
