import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import DashboardLayout from '../../components/DashboardLayout';
import Alert from '../../components/Alert';

const BLANK = {
  full_name: '', gender: 'Male', date_of_birth: '', phone: '', email: '', password: '',
  address: '', school: '', institution: '', department: '', course_of_study: '', matric_number: '',
  it_duration: '', start_date: '', end_date: '', guardian_name: '', guardian_phone: '',
  emergency_contact: '', status: 'active',
};

export default function InternForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/interns/${id}`).then((res) => {
        const intern = res.data.intern;
        setForm({ ...BLANK, ...intern, school: intern.institution || '', password: '' });
        setExistingPhoto(intern.photo);
      });
    }
  }, [id, isEdit]);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'school') return;
      fd.append(k, v ?? '');
    });
    fd.append('institution', form.school || form.institution || '');
    if (photo) fd.append('photo', photo);
    try {
      if (isEdit) {
        await api.put(`/admin/interns/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/admin/interns/${id}`);
      } else {
        const res = await api.post('/admin/interns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/admin/interns/${res.data.intern.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save intern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={isEdit ? 'Edit JAMB Intern' : 'Register New JAMB Intern'}>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 900 }}>
        <div className="grid grid-cols-4 mb-3">
          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Passport Photograph</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
            {existingPhoto && <img src={`/uploads/photos/${existingPhoto}`} className="avatar-sm mt-2" alt="" />}
          </div>
          <div className="form-group"><label>Full Name</label><input required value={form.full_name} onChange={update('full_name')} /></div>
          <div className="form-group">
            <label>Gender</label>
            <select value={form.gender} onChange={update('gender')}><option>Male</option><option>Female</option></select>
          </div>
          <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth || ''} onChange={update('date_of_birth')} /></div>
        </div>

        <div className="grid grid-cols-3 mb-3">
          <div className="form-group"><label>Phone Number</label><input value={form.phone || ''} onChange={update('phone')} /></div>
          <div className="form-group"><label>Email Address</label><input required type="email" value={form.email} onChange={update('email')} /></div>
          <div className="form-group"><label>{isEdit ? 'Reset Password (optional)' : 'Password (default: JAMBIntern@123)'}</label><input type="password" value={form.password} onChange={update('password')} /></div>
        </div>
        <div className="form-group mb-3"><label>Residential Address</label><input value={form.address || ''} onChange={update('address')} /></div>

        <div className="grid grid-cols-4 mb-3">
          <div className="form-group"><label>School</label><input value={form.school || form.institution || ''} onChange={update('school')} /></div>
          <div className="form-group"><label>Department</label><input value={form.department || ''} onChange={update('department')} /></div>
          <div className="form-group"><label>Course of Study</label><input value={form.course_of_study || ''} onChange={update('course_of_study')} /></div>
          <div className="form-group"><label>JAMB Number</label><input value={form.matric_number || ''} onChange={update('matric_number')} /></div>
        </div>
        <div className="grid grid-cols-3 mb-3">
          <div className="form-group"><label>SIWES / IT Duration</label><input placeholder="e.g. 6 months" value={form.it_duration || ''} onChange={update('it_duration')} /></div>
          <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date || ''} onChange={update('start_date')} /></div>
          <div className="form-group"><label>End Date</label><input type="date" value={form.end_date || ''} onChange={update('end_date')} /></div>
        </div>

        <div className="grid grid-cols-4 mb-3">
          <div className="form-group"><label>Guardian Name</label><input value={form.guardian_name || ''} onChange={update('guardian_name')} /></div>
          <div className="form-group"><label>Guardian Phone</label><input value={form.guardian_phone || ''} onChange={update('guardian_phone')} /></div>
          <div className="form-group"><label>Emergency Contact</label><input value={form.emergency_contact || ''} onChange={update('emergency_contact')} /></div>
          {isEdit && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={update('status')}>
                <option value="active">Active</option><option value="completed">Completed</option><option value="suspended">Suspended</option>
              </select>
            </div>
          )}
        </div>

        <Alert type="danger" message={error} />
        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save JAMB Intern'}</button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/interns')}>Cancel</button>
        </div>
      </form>
    </DashboardLayout>
  );
}
