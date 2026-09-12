import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';

export default function Payments() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ customer_id: '', service_id: '', quantity: 1 });

  const load = () => api.get('/admin/payments').then((res) => setData(res.data));
  useEffect(() => { load(); }, []);

  if (!data) return <DashboardLayout title="Payments & Revenue"><p className="text-muted">Loading...</p></DashboardLayout>;
  const { customers, services, recent, intern_receipts, revenue } = data;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_id) return;
    await api.post('/admin/payments', form);
    setForm({ customer_id: '', service_id: '', quantity: 1 });
    load();
  };

  const handleApprove = async (id) => { await api.post(`/admin/payments/${id}/approve`); load(); };

  const handlePrintInternReceipt = (receipt) => {
    const content = `
      <html>
        <head><title>Receipt - ${receipt.receipt_no}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; max-width: 700px; margin: 0 auto; }
            .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 16px; }
            .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; margin-top: 8px; }
            strong { display: inline-block; min-width: 110px; }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="head">
              <div>
                <div style="font-weight: 700; font-size: 20px;">A.A Dynamic Computer Training Center</div>
                <div style="font-size: 12px; color: #666;">Bakori, Katsina State</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; color: #666;">Receipt No</div>
                <strong>${receipt.receipt_no}</strong>
              </div>
            </div>
            <div class="row">
              <div><strong>Student:</strong> ${receipt.intern_name || 'Unknown intern'}</div>
              <div><strong>School:</strong> ${receipt.school || 'Not provided'}</div>
              <div><strong>Amount:</strong> ₦${Number(receipt.amount || 0).toLocaleString()}</div>
              <div><strong>Date:</strong> ${new Date(receipt.verified_at || receipt.created_at).toLocaleDateString()}</div>
              <div><strong>Status:</strong> ${receipt.status}</div>
              <div><strong>Purpose:</strong> JAMB Training Registration</div>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <DashboardLayout title="Payments & Revenue">
      <div className="grid grid-cols-4 mb-3">
        <StatCard icon="fa-naira-sign" value={`₦${revenue.daily.toLocaleString()}`} label="Daily Revenue" />
        <StatCard icon="fa-naira-sign" value={`₦${revenue.weekly.toLocaleString()}`} label="Weekly Revenue" />
        <StatCard icon="fa-naira-sign" value={`₦${revenue.monthly.toLocaleString()}`} label="Monthly Revenue" />
        <StatCard icon="fa-naira-sign" value={`₦${revenue.yearly.toLocaleString()}`} label="Yearly Revenue" />
      </div>

      <div className="grid grid-cols-3">
        <div className="card">
          <h6 style={{ marginTop: 0 }}>Record a Payment</h6>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="small">Customer (optional / walk-in)</label>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">Walk-in customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="small">Service</label>
              <select required value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                <option value="">Select a service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} (₦{Number(s.price).toLocaleString()})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="small">Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block">Record Payment</button>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h6 style={{ marginTop: 0 }}>Recent Transactions</h6>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Receipt</th><th>Customer</th><th>Service</th><th>Amount</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>{p.receipt_no}</td><td>{p.customer_name || 'Walk-in'}</td><td>{p.service_name}</td>
                    <td>₦{Number(p.amount).toLocaleString()}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                    <td>{p.status !== 'paid' && <button className="btn btn-outline btn-sm" onClick={() => handleApprove(p.id)}>Mark Paid</button>}</td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '1.5rem' }}>No transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <h6 style={{ marginTop: 0 }}>JAMB Intern Receipts</h6>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Receipt</th><th>Intern</th><th>School</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {intern_receipts?.map((r) => (
                <tr key={r.id}>
                  <td>{r.receipt_no}</td>
                  <td>{r.intern_name || 'Unknown intern'}</td>
                  <td>{r.school || 'Not provided'}</td>
                  <td>₦{Number(r.amount || 0).toLocaleString()}</td>
                  <td><span className={`badge ${r.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{r.status}</span></td>
                  <td>{new Date(r.verified_at || r.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => handlePrintInternReceipt(r)}>Print</button></td>
                </tr>
              ))}
              {(!intern_receipts || intern_receipts.length === 0) && (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: '1.5rem' }}>No intern payment receipts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
