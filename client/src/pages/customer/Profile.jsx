import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfile() {
  const { refreshMe } = useAuth();
  const [me, setMe] = useState(null);
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => { api.get('/customer/dashboard').then((res) => setMe(res.data.me)); }, []);

  if (!me) return <DashboardLayout title="My Profile"><p className="text-muted">Loading...</p></DashboardLayout>;

  const update = (key) => (e) => setMe({ ...me, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.put('/customer/profile', { full_name: me.full_name, phone: me.phone, address: me.address });
    setMessage('Profile updated.');
    refreshMe();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwMessage('');
    try {
      const res = await api.post('/customer/change-password', pwForm);
      setPwMessage(res.data.message);
      setPwForm({ current_password: '', new_password: '' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Could not change password.');
    }
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="grid grid-cols-2">
        <form onSubmit={handleSubmit} className="card">
          <h6 style={{ marginTop: 0 }}>Profile Information</h6>
          <div className="form-group"><label className="small">Full Name</label><input value={me.full_name} onChange={update('full_name')} /></div>
          <div className="form-group"><label className="small">Email</label><input value={me.email} disabled /></div>
          <div className="form-group"><label className="small">Phone</label><input value={me.phone || ''} onChange={update('phone')} /></div>
          <div className="form-group"><label className="small">Address</label><input value={me.address || ''} onChange={update('address')} /></div>
          <Alert type="success" message={message} />
          <button className="btn btn-primary btn-sm">Save Changes</button>
        </form>

        <form onSubmit={handlePasswordChange} className="card">
          <h6 style={{ marginTop: 0 }}>Change Password</h6>
          <div className="form-group"><label className="small">Current Password</label><input type="password" required value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} /></div>
          <div className="form-group"><label className="small">New Password</label><input type="password" required minLength={6} value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} /></div>
          <Alert type="danger" message={pwError} />
          <Alert type="success" message={pwMessage} />
          <button className="btn btn-outline btn-sm">Update Password</button>
        </form>
      </div>
    </DashboardLayout>
  );
}
