import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Pagination from '../../components/Pagination';

export default function Interns() {
  const [interns, setInterns] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback((p = page) => {
    api.get('/admin/interns', { params: { q, status, page: p } }).then((res) => {
      setInterns(res.data.interns);
      setPages(res.data.pages);
      setPage(res.data.page);
    });
  }, [q, status, page]);

  useEffect(() => { load(1); }, [q, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this intern record permanently?')) return;
    await api.delete(`/admin/interns/${id}`);
    load(page);
  };

  const handleVerifyPayment = async (id) => {
    await api.post(`/admin/interns/${id}/verify-payment`);
    load(page);
  };

  return (
    <DashboardLayout title="JAMB Intern Management">
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '.6rem' }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <input placeholder="Search name, email, matric no..." value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 180 }}>
            <option value="">All Status</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <Link to="/admin/interns/new" className="btn btn-primary"><i className="fa-solid fa-user-plus" /> Register JAMB Intern</Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th></th><th>Name</th><th>School</th><th>Matric No</th><th>Phone</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {interns.map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.photo
                      ? <img src={`/uploads/photos/${i.photo}`} className="avatar-sm" alt="" />
                      : <div className="avatar-sm flex" style={{ alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-user" /></div>}
                  </td>
                  <td><Link to={`/admin/interns/${i.id}`}>{i.full_name}</Link></td>
                  <td>{i.institution || '—'}</td>
                  <td>{i.matric_number}</td>
                  <td>{i.phone}</td>
                  <td>
                    <span className={`badge ${
                      i.status === 'active' ? 'badge-success' :
                      i.status === 'completed' ? 'badge-secondary' :
                      i.status === 'pending_payment' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {i.status === 'pending_payment' ? 'Pending Payment' : i.status}
                    </span>
                  </td>
                  <td>
                    {i.status === 'pending_payment' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleVerifyPayment(i.id)}>Verify Payment</button>
                    )}{' '}
                    <Link to={`/admin/interns/${i.id}`} className="btn btn-outline btn-sm"><i className="fa-solid fa-eye" /></Link>{' '}
                    <Link to={`/admin/interns/${i.id}/edit`} className="btn btn-outline btn-sm"><i className="fa-solid fa-pen" /></Link>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(i.id)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </tr>
              ))}
              {interns.length === 0 && <tr><td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>No JAMB interns found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pages={pages} onChange={load} />
    </DashboardLayout>
  );
}
