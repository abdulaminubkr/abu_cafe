import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

export default function Settings() {
  const [settings, setSettings] = useState({ centre_name: '', centre_address: '', currency_symbol: '' });
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
