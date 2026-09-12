import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function InternView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [trainingTitle, setTrainingTitle] = useState('');

  const load = useCallback(() => {
    api.get(`/admin/interns/${id}`).then((res) => setData(res.data));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <DashboardLayout title="JAMB Intern Profile"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { intern, attendance, pct, cert, receipt } = data;

  const handleSuspend = async () => {
    await api.post(`/admin/interns/${id}/suspend`);
    load();
  };

  const handlePrintReceipt = () => window.print();

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    await api.post(`/admin/certificates/issue/${id}`, { training_title: trainingTitle });
    load();
  };

  const handleCertAction = async (action) => {
    await api.post(`/admin/certificates/${cert.id}/${action}`);
    load();
  };

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/admin/certificates/${cert.id}/download?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout title="JAMB Intern Profile">
      <div className="grid grid-cols-2">
        <div className="card text-center">
          {intern.photo
            ? <img src={`/uploads/photos/${intern.photo}`} alt="" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover', margin: '0 auto' }} />
            : <div style={{ width: 120, height: 120, borderRadius: 8, background: '#f1f1f1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-user fa-2x text-muted" /></div>}
          <h3 style={{ marginBottom: 0 }}>{intern.full_name}</h3>
          <span className={`badge ${intern.status === 'active' ? 'badge-success' : intern.status === 'completed' ? 'badge-secondary' : 'badge-danger'}`}>{intern.status}</span>
          <table style={{ marginTop: '1rem', textAlign: 'left' }}>
            <tbody>
              <tr><th>Email</th><td>{intern.email}</td></tr>
              <tr><th>Phone</th><td>{intern.phone}</td></tr>
              <tr><th>School</th><td>{intern.institution}</td></tr>
              <tr><th>Department</th><td>{intern.department}</td></tr>
              <tr><th>JAMB Number</th><td>{intern.matric_number}</td></tr>
              <tr><th>Duration</th><td>{intern.it_duration}</td></tr>
              <tr><th>Start</th><td>{intern.start_date}</td></tr>
              <tr><th>End</th><td>{intern.end_date}</td></tr>
            </tbody>
          </table>
          <div className="flex gap-2 mt-3" style={{ justifyContent: 'center' }}>
            <Link to={`/admin/interns/${id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
            <button className="btn btn-warning btn-sm" onClick={handleSuspend}>{intern.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button>
          </div>
        </div>

        <div>
          <div className="card mb-3">
            <div className="flex-between mb-2">
              <h6 style={{ margin: 0 }}>Attendance percentage: <span style={{ color: 'var(--brand-green)' }}>{pct}%</span></h6>
              <Link to={`/admin/attendance-history?intern_id=${id}`} className="btn btn-outline btn-sm">Full History</Link>
            </div>
            <table>
              <thead><tr><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.map((a) => <tr key={a.id}><td>{a.date}</td><td>{a.status}</td></tr>)}
                {attendance.length === 0 && <tr><td colSpan={2} className="text-center text-muted">No attendance recorded.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h6 style={{ marginTop: 0 }}>Certificate</h6>
            {cert ? (
              <>
                <p>No: <strong>{cert.certificate_no}</strong> &middot; Status:{' '}
                  <span className={`badge ${cert.status === 'approved' ? 'badge-success' : cert.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{cert.status}</span>
                </p>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {cert.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleCertAction('approve')}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCertAction('reject')}>Reject</button>
                    </>
                  )}
                  {cert.status === 'approved' && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={handleDownload}>Download PDF</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleCertAction('regenerate')}>Regenerate</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCertAction('revoke')}>Revoke</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleIssueCertificate} className="flex gap-2">
                <input placeholder="Training title (optional)" value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} />
                <button className="btn btn-primary btn-sm">Issue Certificate</button>
              </form>
            )}
          </div>

          {receipt && (
            <div className="card mt-3" style={{ background: '#fffaf0', border: '1px solid #f2dfac' }}>
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
                  <div><strong>Intern:</strong> {intern.full_name}</div>
                  <div><strong>Email:</strong> {intern.email}</div>
                  <div><strong>School:</strong> {intern.institution || 'Not provided'}</div>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
