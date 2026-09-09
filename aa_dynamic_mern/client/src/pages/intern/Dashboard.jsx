import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

export default function InternDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/intern/dashboard').then((res) => setData(res.data)); }, []);

  if (!data) return <DashboardLayout title="Dashboard"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { me, pct, cert, notifications, recent_attendance } = data;

  const handleDownloadCert = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/intern/certificate/download?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout title={`Welcome, ${me.full_name}`}>
      <div className="grid grid-cols-3 mb-3">
        <StatCard icon="fa-calendar-check" value={`${pct}%`} label="Attendance Percentage" />
        <StatCard icon="fa-hourglass-half" value={me.status} label="Internship Status" />
        <StatCard icon="fa-award" value={cert ? cert.status : 'Not issued'} label="Certificate Status" />
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Recent Attendance</h6>
          <table>
            <thead><tr><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {recent_attendance.map((a) => <tr key={a.id}><td>{a.date}</td><td>{a.status}</td></tr>)}
              {recent_attendance.length === 0 && <tr><td colSpan={2} className="text-center text-muted">No records yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div>
          <div className="card mb-3">
            <h6 style={{ marginTop: 0 }}>Certificate</h6>
            {cert && cert.status === 'approved' && (
              <>
                <p>Your certificate <strong>{cert.certificate_no}</strong> has been approved.</p>
                <button className="btn btn-success btn-sm" onClick={handleDownloadCert}><i className="fa-solid fa-download" /> Download Certificate</button>
              </>
            )}
            {cert && cert.status !== 'approved' && (
              <p className="text-muted">Your certificate is currently <strong>{cert.status}</strong>. You'll be notified once it's approved.</p>
            )}
            {!cert && <p className="text-muted">No certificate has been issued yet. This happens once your internship is completed and reviewed by the admin.</p>}
          </div>

          <div className="card">
            <h6 style={{ marginTop: 0 }}>Notifications</h6>
            {notifications.map((n) => (
              <div key={n.id} className="mb-2" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{n.title}</div>
                <div className="small text-muted">{n.message}</div>
                <div className="small text-muted">{n.created_at}</div>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-muted">No notifications yet.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
