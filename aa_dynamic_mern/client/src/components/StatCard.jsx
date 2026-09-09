export default function StatCard({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="icon"><i className={`fa-solid ${icon}`} /></div>
      <div>
        <div className="value">{value}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}
