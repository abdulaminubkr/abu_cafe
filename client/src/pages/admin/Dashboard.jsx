import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <DashboardLayout title="Dashboard"><p className="text-muted">Loading...</p></DashboardLayout>;

  const { stats, revenue_by_day, recent } = data;
  const cards = [
    ['Total Interns', stats.total_interns, 'fa-user-graduate'],
    ['Active Interns', stats.active_interns, 'fa-user-check'],
    ['Completed Interns', stats.completed_interns, 'fa-user-clock'],
    ['Total Customers', stats.total_customers, 'fa-users'],
    ["Today's Attendance", stats.today_attendance, 'fa-calendar-day'],
    ['Monthly Revenue', `₦${stats.monthly_revenue.toLocaleString()}`, 'fa-naira-sign'],
    ['Certificates Approved', stats.certificates_approved, 'fa-award'],
    ['Certificates Pending', stats.certificates_pending, 'fa-hourglass-half'],
    ['Active Services', stats.total_services, 'fa-list-check'],
  ];

  const chartData = {
    labels: revenue_by_day.map((r) => r.d),
    datasets: [{
      label: 'Revenue (NGN)',
      data: revenue_by_day.map((r) => Number(r.s)),
      borderColor: '#c8a951',
      backgroundColor: 'rgba(200,169,81,.2)',
      tension: 0.3,
      fill: true,
    }],
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-4 mb-3">
        {cards.map(([label, value, icon]) => (
          <StatCard key={label} icon={icon} value={value} label={label} />
        ))}
      </div>

      <div className="grid grid-cols-2 mb-3">
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Revenue - Last 7 Days</h6>
          <Line data={chartData} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Recent Admin Activity</h6>
          <div style={{ maxHeight: 230, overflowY: 'auto' }}>
            {recent.length === 0 && <p className="text-muted small">No activity yet.</p>}
            {recent.map((r) => (
              <div key={r.id} className="flex-between mb-2" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                <div>
                  <div className="small" style={{ fontWeight: 600 }}>{r.action}</div>
                  <div className="small text-muted">{r.details} &middot; {r.actor_name}</div>
                </div>
                <span className="small text-muted">{r.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <Link to="/admin/interns/new" className="btn btn-outline"><i className="fa-solid fa-user-plus" /> New Intern</Link>
        <Link to="/admin/attendance" className="btn btn-outline"><i className="fa-solid fa-calendar-check" /> Mark Attendance</Link>
        <Link to="/admin/payments" className="btn btn-outline"><i className="fa-solid fa-cash-register" /> Record Payment</Link>
        <Link to="/admin/certificates" className="btn btn-outline"><i className="fa-solid fa-award" /> Certificates</Link>
      </div>
    </DashboardLayout>
  );
}
