import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function AttendanceHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [interns, setInterns] = useState([]);
  const [records, setRecords] = useState([]);
  const [pct, setPct] = useState(null);
  const internId = searchParams.get('intern_id') || '';
  const [month, setMonth] = useState(searchParams.get('month') || new Date().toISOString().slice(0, 7));

  const load = (iid, mo) => {
    api.get('/admin/attendance-history', { params: { intern_id: iid || undefined, month: mo } }).then((res) => {
      setInterns(res.data.interns);
      setRecords(res.data.records);
      setPct(res.data.pct);
    });
  };

  useEffect(() => { load(internId, month); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleView = (e) => {
    e.preventDefault();
    setSearchParams({ intern_id: internId, month });
    load(internId, month);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/admin/attendance/${id}`);
    load(internId, month);
  };

  return (
    <DashboardLayout title="Attendance History">
      <div className="card mb-3">
        <form onSubmit={handleView} className="grid grid-cols-3" style={{ alignItems: 'end' }}>
          <div className="form-group">
            <label>Intern</label>
            <select value={internId} onChange={(e) => setSearchParams({ intern_id: e.target.value, month })}>
              <option value="">Select intern</option>
              {interns.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <button className="btn btn-primary">View</button>
        </form>
      </div>

      {internId && (
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Attendance percentage (overall): <span style={{ color: 'var(--brand-green)' }}>{pct}%</span></h6>
          <table>
            <thead><tr><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td><td>{r.status}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash" /></button></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={3} className="text-center text-muted" style={{ padding: '1.5rem' }}>No records for this month.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
