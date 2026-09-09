import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';

export default function CustomerPayments() {
  const [records, setRecords] = useState([]);
  useEffect(() => { api.get('/customer/payments').then((res) => setRecords(res.data.records)); }, []);

  const handleReceipt = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/customer/payments/${id}/receipt?token=${token}`, '_blank');
  };

  return (
    <DashboardLayout title="Payment History">
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Receipt No</th><th>Service</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {records.map((p) => (
                <tr key={p.id}>
                  <td>{p.receipt_no}</td><td>{p.service_name}</td><td>{p.quantity}</td>
                  <td>₦{Number(p.amount).toLocaleString()}</td>
                  <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                  <td>{p.created_at}</td>
                  <td>{p.status === 'paid' && <button className="btn btn-outline btn-sm" onClick={() => handleReceipt(p.id)}><i className="fa-solid fa-download" /></button>}</td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={7} className="text-center text-muted" style={{ padding: '2rem' }}>No payment history yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
