import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const load = () => api.get('/admin/certificates').then((res) => setCerts(res.data.certificates));
  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => { await api.post(`/admin/certificates/${id}/${action}`); load(); };
  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/admin/certificates/${id}/download?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout title="Certificate Management">
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Certificate No</th><th>Intern</th><th>Institution</th><th>Training</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id}>
                  <td>{c.certificate_no}</td><td>{c.full_name}</td><td>{c.institution}</td><td>{c.training_title}</td>
                  <td><span className={`badge ${c.status === 'approved' ? 'badge-success' : c.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{c.status}</span></td>
                  <td>
                    {c.status === 'pending' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleAction(c.id, 'approve')}>Approve</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(c.id, 'reject')}>Reject</button>
                      </>
                    )}
                    {c.status === 'approved' && (
                      <>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDownload(c.id)}>Download</button>{' '}
                        <button className="btn btn-outline btn-sm" onClick={() => handleAction(c.id, 'regenerate')}>Regenerate</button>{' '}
                        <button className="btn btn-danger btn-sm" onClick={() => handleAction(c.id, 'revoke')}>Revoke</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {certs.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '2rem' }}>No certificates issued yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
