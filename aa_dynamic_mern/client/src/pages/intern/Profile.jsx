import { useEffect, useState } from 'react';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

export default function InternProfile() {
  const [me, setMe] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const load = () => api.get('/intern/dashboard').then((res) => setMe(res.data.me));
  useEffect(() => { load(); }, []);

  if (!me) return <DashboardLayout title="My Profile"><p className="text-muted">Loading...</p></DashboardLayout>;

  const update = (key) => (e) => setMe({ ...me, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('phone', me.phone || '');
    fd.append('address', me.address || '');
    fd.append('guardian_name', me.guardian_name || '');
    fd.append('guardian_phone', me.guardian_phone || '');
    fd.append('emergency_contact', me.emergency_contact || '');
    if (photo) fd.append('photo', photo);
    await api.put('/intern/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setMessage('Profile updated.');
    load();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwMessage('');
    try {
      const res = await api.post('/intern/change-password', pwForm);
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
          <div className="grid grid-cols-2 mb-2">
            <div className="text-center">
              {me.photo
                ? <img src={`/uploads/photos/${me.photo}`} alt="" style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }} />
                : <div style={{ width: 100, height: 100, borderRadius: 8, background: '#f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><i className="fa-solid fa-user fa-2x text-muted" /></div>}
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="mt-2" />
            </div>
            <div>
              <div className="form-group"><label className="small">Full Name</label><input value={me.full_name} disabled /></div>
              <div className="form-group"><label className="small">Email</label><input value={me.email} disabled /></div>
              <div className="form-group"><label className="small">Phone</label><input value={me.phone || ''} onChange={update('phone')} /></div>
            </div>
          </div>
          <div className="form-group"><label className="small">Address</label><input value={me.address || ''} onChange={update('address')} /></div>
          <div className="grid grid-cols-3 mb-2">
            <div className="form-group"><label className="small">Guardian Name</label><input value={me.guardian_name || ''} onChange={update('guardian_name')} /></div>
            <div className="form-group"><label className="small">Guardian Phone</label><input value={me.guardian_phone || ''} onChange={update('guardian_phone')} /></div>
            <div className="form-group"><label className="small">Emergency Contact</label><input value={me.emergency_contact || ''} onChange={update('emergency_contact')} /></div>
          </div>
          <p className="small text-muted">Institution: {me.institution} &middot; Department: {me.department} &middot; Matric No: {me.matric_number}</p>
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
