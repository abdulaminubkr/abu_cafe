import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function InternAttendance() {
  const [records, setRecords] = useState([]);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    api.get('/intern/attendance').then((res) => {
      setRecords(res.data.records);
      setPct(res.data.pct);
    });
  }, []);

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/intern/attendance/download?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout title="My Attendance">
      <div className="flex-between mb-3">
        <h6 style={{ margin: 0 }}>Overall Attendance: <span style={{ color: 'var(--brand-green)' }}>{pct}%</span></h6>
        <button className="btn btn-outline btn-sm" onClick={handleDownload}><i className="fa-solid fa-download" /> Download Report</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>
                  <span className={`badge ${r.status === 'Present' ? 'badge-success' : r.status === 'Late' || r.status === 'Excused' ? 'badge-warning' : 'badge-danger'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={2} className="text-center text-muted" style={{ padding: '2rem' }}>No attendance records yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
