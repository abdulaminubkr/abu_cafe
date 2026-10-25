import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

export default function Settings() {
  const [settings, setSettings] = useState({
    centre_name: '',
    centre_address: '',
    currency_symbol: '',
    payment_bank_name: 'Zenith Bank',
    payment_account_name: 'A.A Dynamic Computer Training Center Bakori',
    payment_account_number: '0116118501',
    payment_amount: '3500',
    payment_note: 'Come along with your receipt to the training center for payment verification.',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/superadmin/settings').then((res) => setSettings({ ...settings, ...res.data.settings }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key) => (e) => setSettings({ ...settings, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.put('/superadmin/settings', settings);
    setMessage('Settings saved.');
  };

  return (
    <DashboardLayout title="System Settings">
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 560 }}>
        <div className="form-group"><label>Centre Name</label><input value={settings.centre_name} onChange={update('centre_name')} /></div>
        <div className="form-group"><label>Centre Address</label><input value={settings.centre_address} onChange={update('centre_address')} /></div>
        <div className="form-group"><label>Currency Symbol</label><input value={settings.currency_symbol} onChange={update('currency_symbol')} /></div>
        <h3>Registration Payment Account</h3>
        <div className="form-group"><label>Bank Name</label><input value={settings.payment_bank_name} onChange={update('payment_bank_name')} /></div>
        <div className="form-group"><label>Account Name</label><input value={settings.payment_account_name} onChange={update('payment_account_name')} /></div>
        <div className="form-group"><label>Account Number</label><input value={settings.payment_account_number} onChange={update('payment_account_number')} /></div>
        <div className="form-group"><label>Amount</label><input type="number" min="0" step="0.01" value={settings.payment_amount} onChange={update('payment_amount')} /></div>
        <div className="form-group"><label>Payment Note</label><textarea value={settings.payment_note} onChange={update('payment_note')} rows={3} /></div>
        <Alert type="success" message={message} />
        <button className="btn btn-primary mt-2">Save Settings</button>
      </form>
      <div className="alert alert-info mt-3" style={{ maxWidth: 560 }}>
        <i className="fa-solid fa-circle-info" /> Database backups: this app uses the same Supabase project as
        before — Supabase takes automatic backups on paid plans (Project Settings → Database → Backups), or you
        can run <code>pg_dump</code> against your <code>DATABASE_URL</code> manually.
      </div>
    </DashboardLayout>
  );
}
