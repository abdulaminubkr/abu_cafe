import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function Logs() {
  const [entries, setEntries] = useState([]);
  const [q, setQ] = useState('');

  const load = (query = q) => api.get('/superadmin/logs', { params: { q: query } }).then((res) => setEntries(res.data.entries));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => { setQ(e.target.value); load(e.target.value); };

  return (
    <DashboardLayout title="System / Audit Logs">
      <input placeholder="Search action, actor, details..." value={q} onChange={handleSearch} style={{ maxWidth: 320, marginBottom: '1rem' }} />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Actor</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.actor_name} <span className="text-muted">({e.actor_type})</span></td>
                  <td>{e.action}</td><td>{e.details}</td><td>{e.created_at}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={5} className="text-center text-muted" style={{ padding: '2rem' }}>No log entries.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
