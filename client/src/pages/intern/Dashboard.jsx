import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

export default function InternDashboard() {
  const [data, setData] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => api.get('/intern/dashboard').then((res) => setData(res.data));
  useEffect(() => { load(); }, []);

  if (!data) return <DashboardLayout title="Dashboard"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { me, pct, cert, notifications, recent_attendance, receipt } = data;

  const handleDownloadCert = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/intern/certificate/download?token=${token}`, '_blank');
  };

  const handlePrintReceipt = () => window.print();

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!photo) return;
    setUploading(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('photo', photo);
      await api.put('/intern/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Photo uploaded successfully.');
      setPhoto(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title={`Welcome, ${me.full_name}`}>
      <div className="grid grid-cols-3 mb-3">
        <StatCard icon="fa-calendar-check" value={`${pct}%`} label="Attendance Percentage" />
        <StatCard icon="fa-hourglass-half" value={me.status} label="JAMB Intern Status" />
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
            <h6 style={{ marginTop: 0 }}>Profile Photo</h6>
            <div className="mb-2 text-center">
              {me.photo
                ? <img src={`/uploads/photos/${me.photo}`} alt="intern" style={{ width: 110, height: 110, borderRadius: 8, objectFit: 'cover' }} />
                : <div style={{ width: 110, height: 110, borderRadius: 8, background: '#f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><i className="fa-solid fa-user fa-2x text-muted" /></div>}
            </div>
            <form onSubmit={handlePhotoUpload}>
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
              <button className="btn btn-primary btn-sm mt-2" disabled={!photo || uploading}>{uploading ? 'Uploading...' : 'Upload Photo'}</button>
            </form>
            {message && <p className="small text-muted mt-2">{message}</p>}
          </div>

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

          {receipt && (
            <div className="card mb-3" style={{ background: '#fffaf0', border: '1px solid #f2dfac' }}>
              <div className="flex-between mb-2">
                <h6 style={{ margin: 0 }}>Payment Receipt</h6>
                <button className="btn btn-outline btn-sm" onClick={handlePrintReceipt}>Print</button>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e8d7a5', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>A.A Dynamic Computer Training Center</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Bakori, Katsina State</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Receipt No</div>
                    <strong>{receipt.receipt_no}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 14 }}>
                  <div><strong>Student:</strong> {me.full_name}</div>
                  <div><strong>Email:</strong> {me.email}</div>
                  <div><strong>School:</strong> {me.institution || 'Not provided'}</div>
                  <div><strong>Date:</strong> {new Date(receipt.verified_at || receipt.created_at).toLocaleDateString()}</div>
                  <div><strong>Amount:</strong> ₦{Number(receipt.amount || 0).toLocaleString()}</div>
                  <div><strong>Status:</strong> {receipt.status}</div>
                </div>

                <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Paid for:</span>
                  <strong>JAMB Internship Registration</strong>
                </div>
              </div>
            </div>
          )}

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
