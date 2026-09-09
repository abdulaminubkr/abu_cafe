import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

const BLANK = { name: '', price: '', unit: '', category: 'General' };

export default function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(null); // null = form closed; object = editing/creating
  const [error, setError] = useState('');

  const load = () => api.get('/admin/services').then((res) => setServices(res.data.services));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...BLANK }); setError(''); };
  const openEdit = (s) => { setForm({ ...s }); setError(''); };
  const closeForm = () => setForm(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.id) {
        await api.put(`/admin/services/${form.id}`, form);
      } else {
        await api.post('/admin/services', form);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save service.');
    }
  };

  const handleToggle = async (id) => { await api.post(`/admin/services/${id}/toggle`); load(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    await api.delete(`/admin/services/${id}`);
    load();
  };

  return (
    <DashboardLayout title="Service & Pricing Management">
      <div className="flex-between mb-3">
        <p className="text-muted" style={{ margin: 0 }}>Prices can be changed at any time — no code editing required.</p>
        <button className="btn btn-primary" onClick={openNew}><i className="fa-solid fa-plus" /> Add Service</button>
      </div>

      {form && (
        <form onSubmit={handleSubmit} className="card mb-3" style={{ maxWidth: 520 }}>
          <h6 style={{ marginTop: 0 }}>{form.id ? 'Edit Service' : 'Add Service'}</h6>
          <div className="form-group"><label>Service Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label>Price (₦)</label><input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="form-group"><label>Unit</label><input placeholder="e.g. per page, per hour, monthly" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="form-group"><label>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <Alert type="danger" message={error} />
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary">Save Service</button>
            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Unit</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.category}</td>
                  <td>₦{Number(s.price).toLocaleString()}</td>
                  <td>{s.unit}</td>
                  <td>
                    <button className={`btn btn-sm ${s.is_active ? 'btn-success' : 'btn-outline'}`} onClick={() => handleToggle(s.id)}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}><i className="fa-solid fa-pen" /></button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>No services yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
