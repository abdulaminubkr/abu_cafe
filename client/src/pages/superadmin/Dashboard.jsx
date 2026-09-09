import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/superadmin/dashboard').then((res) => setData(res.data)); }, []);

  if (!data) return <DashboardLayout title="Super Admin Dashboard"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { stats, logs } = data;

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="grid grid-cols-4 mb-3">
        <StatCard icon="fa-user-shield" value={stats.total_admins} label="Total Admins" />
        <StatCard icon="fa-user-check" value={stats.active_admins} label="Active Admins" />
        <StatCard icon="fa-user-graduate" value={stats.total_interns} label="Total Interns" />
        <StatCard icon="fa-users" value={stats.total_customers} label="Total Customers" />
      </div>
      <div className="card mb-3">
        <StatCard icon="fa-naira-sign" value={`₦${stats.monthly_revenue.toLocaleString()}`} label="Monthly Revenue (system-wide)" />
      </div>

      <div className="grid grid-cols-4 mb-3">
        <Link to="/superadmin/admins" className="btn btn-outline"><i className="fa-solid fa-user-plus" /> New Admin</Link>
        <Link to="/admin/reports" className="btn btn-outline"><i className="fa-solid fa-file-lines" /> All Reports</Link>
        <Link to="/superadmin/logs" className="btn btn-outline"><i className="fa-solid fa-clipboard-list" /> System Logs</Link>
        <Link to="/superadmin/settings" className="btn btn-outline"><i className="fa-solid fa-gear" /> Settings</Link>
      </div>

      <div className="card">
        <h6 style={{ marginTop: 0 }}>Recent System Activity</h6>
        <table>
          <thead><tr><th>Actor</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}><td>{l.actor_name} ({l.actor_type})</td><td>{l.action}</td><td>{l.details}</td><td>{l.created_at}</td></tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="text-center text-muted" style={{ padding: '1.5rem' }}>No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
