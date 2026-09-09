import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/customer/dashboard').then((res) => setData(res.data)); }, []);

  if (!data) return <DashboardLayout title="Dashboard"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { me, recent, notifications, total_spent } = data;

  return (
    <DashboardLayout title={`Welcome, ${me.full_name}`}>
      <div className="grid grid-cols-2 mb-3">
        <StatCard icon="fa-naira-sign" value={`₦${total_spent.toLocaleString()}`} label="Total Spent" />
        <Link to="/customer/services" className="stat-card">
          <div className="icon"><i className="fa-solid fa-shop" /></div>
          <div><div className="value">Browse</div><div className="label">Available Services</div></div>
        </Link>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Recent Payments</h6>
          <table>
            <thead><tr><th>Receipt</th><th>Service</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id}>
                  <td>{p.receipt_no}</td><td>{p.service_name}</td><td>₦{Number(p.amount).toLocaleString()}</td>
                  <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={4} className="text-center text-muted">No payments yet.</td></tr>}
            </tbody>
          </table>
          <Link to="/customer/payments" className="btn btn-outline btn-sm mt-2">View All</Link>
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
    </DashboardLayout>
  );
}
