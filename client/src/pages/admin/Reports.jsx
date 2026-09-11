import DashboardLayout from '../../components/DashboardLayout';

const REPORTS = [
  ['interns', 'fa-user-graduate'],
  ['customers', 'fa-users'],
  ['attendance', 'fa-calendar-check'],
  ['revenue', 'fa-naira-sign'],
  ['services', 'fa-list-check'],
  ['certificates', 'fa-award'],
  ['payments', 'fa-receipt'],
];

export default function Reports() {
  const download = (type, fmt) => {
    const token = localStorage.getItem('token');
    window.open(`/api/admin/reports/${type}/${fmt}?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout title="Reports">
      <div className="grid grid-cols-4">
        {REPORTS.map(([type, icon]) => (
          <div key={type} className="card text-center">
            <i className={`fa-solid ${icon} fa-2x mb-2`} style={{ color: 'var(--brand-green)' }} />
            <h6 style={{ textTransform: 'capitalize' }}>{type} Report</h6>
            <div className="flex gap-2" style={{ justifyContent: 'center' }}>
              <button className="btn btn-danger btn-sm" onClick={() => download(type, 'pdf')}><i className="fa-solid fa-file-pdf" /> PDF</button>
              <button className="btn btn-success btn-sm" onClick={() => download(type, 'excel')}><i className="fa-solid fa-file-excel" /> Excel</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
