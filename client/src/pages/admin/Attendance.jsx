import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

const STATUSES = ['Present', 'Absent', 'Late', 'Excused'];

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [selDate, setSelDate] = useState(today);
  const [interns, setInterns] = useState([]);
  const [marked, setMarked] = useState({});
  const [message, setMessage] = useState('');

  const load = (date) => {
    api.get('/admin/attendance', { params: { date } }).then((res) => {
      setInterns(res.data.interns);
      setMarked(res.data.marked || {});
      setSelDate(res.data.sel_date || date);
    }).catch((err) => {
      setMessage(err.response?.data?.error || 'Failed to load attendance.');
    });
  };

  useEffect(() => { load(selDate); }, [selDate]);

  const setStatus = (internId, status) => {
    setMarked((prev) => ({ ...prev, [internId]: status }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/attendance', {
        date: selDate,
        statuses: Object.fromEntries(Object.entries(marked).filter(([, value]) => value)),
      });
      setMessage('Attendance saved.');
      load(selDate);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Attendance could not be saved.');
    }
  };

  return (
    <DashboardLayout title="Mark Attendance">
      <div className="card">
        <div className="flex gap-2 mb-3" style={{ alignItems: 'center' }}>
          <label style={{ marginBottom: 0 }}>Date:</label>
          <input type="date" value={selDate} max={today} onChange={(e) => load(e.target.value)} style={{ width: 'auto' }} />
          <Link to="/admin/attendance-history" className="btn btn-outline btn-sm">View History / Reports</Link>
        </div>

        <form onSubmit={handleSave}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>JAMB Intern</th>{STATUSES.map((s) => <th key={s} style={{ textAlign: 'center' }}>{s}</th>)}</tr></thead>
              <tbody>
                {interns.map((i) => (
                  <tr key={i.id}>
                    <td>{i.full_name}</td>
                    {STATUSES.map((s) => (
                      <td key={s} style={{ textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`status_${i.id}`}
                          value={s}
                          checked={String(marked[i.id] || '') === s}
                          onChange={() => setStatus(i.id, s)}
                          style={{ width: 'auto' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                {interns.length === 0 && <tr><td colSpan={5} className="text-center text-muted" style={{ padding: '1.5rem' }}>No active JAMB interns.</td></tr>}
              </tbody>
            </table>
          </div>
          <Alert type="success" message={message} />
          <button className="btn btn-primary mt-3">Save Attendance</button>
        </form>
      </div>
    </DashboardLayout>
  );
}
