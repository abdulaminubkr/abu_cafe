import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';

const ADDITIONAL_JAMB_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature in English',
  'Commerce',
  'Accounting',
  'Geography',
  'Agricultural Science',
  'History',
  'Islamic Studies',
  'Christian Religious Studies',
];

const INITIAL_FORM = {
  first_name: '',
  surname: '',
  date_of_birth: '',
  place_of_birth: '',
  state: '',
  lga: '',
  phone_number: '',
  home_address: '',
  gender: 'Male',
  email: '',
  jamb_registration_number: '',
  jamb_profile_code: '',
  passport: null,
  passportPreview: '',
  bring_laptop: '',
  password: '',
  confirm_password: '',
  school_name: '',
  graduation_year: '',
  subjectRows: ['', '', ''],
  training_day: '',
  training_time: '',
  parent_name: '',
  parent_phone: '',
};

const timeOptions = [
  { value: 'MORNING', label: 'MORNING: 10:00 AM – 12:30 PM' },
  { value: 'AFTERNOON', label: 'AFTERNOON: 2:00 PM – 4:30 PM' },
  { value: 'EVENING', label: 'EVENING: 4:00 PM – 6:00 PM' },
];

const DEFAULT_PAYMENT_SETTINGS = {
  payment_bank_name: 'MONOIEPIONT',
  payment_account_name: 'ABUBAKAR AHMED',
  payment_account_number: '6758677018',
  payment_amount: '3500',
  payment_note: 'Come along with your receipt to the training center for payment verification.',
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [registrationType, setRegistrationType] = useState('jamb');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm_password: false,
  });
  const [consents, setConsents] = useState({
    paid: false,
    rules: false,
  });
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  useEffect(() => {
    api.get('/registration-settings')
      .then((res) => setPaymentSettings((current) => ({ ...current, ...res.data.settings })))
      .catch(() => {});
  }, []);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRegistrationType = (event) => {
    const nextType = event.target.value;
    setRegistrationType(nextType);
    if (nextType === 'intern') {
      setForm((current) => ({
        ...current,
        jamb_registration_number: '',
        jamb_profile_code: '',
        subjectRows: ['', '', ''],
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const toggleConsent = (field) => {
    setConsents((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handlePassportChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isValid = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    if (!isValid) {
      setError('Only JPG, JPEG, or PNG files are allowed for passport upload.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, passportPreview: reader.result, passport: file }));
    };
    reader.readAsDataURL(file);
  };

  const updateSubjectRow = (index, value) => {
    setForm((current) => {
      const nextRows = [...current.subjectRows];
      nextRows[index] = value;
      return { ...current, subjectRows: nextRows };
    });
  };

  const handleDayChange = (day) => {
    setForm((current) => ({
      ...current,
      training_day: day,
      training_time: day === 'weekend' ? 'EVENING' : current.training_time,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const subjectList = registrationType === 'jamb'
      ? ['English Language', ...form.subjectRows.filter(Boolean)]
      : null;
    if (registrationType === 'jamb') {
      if (subjectList.length !== 4) {
        setError('Please choose exactly three additional JAMB subjects.');
        return;
      }
      if (new Set(subjectList).size !== 4) {
        setError('Duplicate JAMB subjects are not allowed.');
        return;
      }
      if (!form.jamb_registration_number || !form.jamb_profile_code) {
        setError('Please enter your JAMB registration number and profile code.');
        return;
      }
    }
    if (!form.training_day) {
      setError('Please select your preferred training schedule.');
      return;
    }
    if (!form.training_time) {
      setError('Please select a training time slot.');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Password and confirm password do not match.');
      return;
    }

    const payload = {
      full_name: `${form.first_name} ${form.surname}`.trim(),
      email: form.email,
      phone: form.phone_number,
      address: form.home_address,
      school: form.school_name,
      institution: form.school_name,
      gender: form.gender,
      password: form.password,
      applicant_marked_paid: consents.paid,
      rules_accepted: consents.rules,
      ...form,
      matric_number: registrationType === 'jamb' ? form.jamb_registration_number : null,
      jamb_profile_code: registrationType === 'jamb' ? form.jamb_profile_code : null,
      jamb_subjects: subjectList,
      registration_type: registrationType,
    };

    const registrationData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'passportPreview' || key === 'confirm_password' || key === 'subjectRows') return;
      if (key === 'passport') {
        if (value) registrationData.append('passport', value);
        return;
      }
      if (key === 'jamb_subjects') {
        registrationData.append(key, value === null ? 'null' : JSON.stringify(value));
        return;
      }
      if (value !== null && value !== undefined) registrationData.append(key, String(value));
    });
    registrationData.set('registration_type', registrationType);
    registrationData.set('matric_number', registrationType === 'jamb' ? form.jamb_registration_number : '');
    registrationData.set('jamb_profile_code', registrationType === 'jamb' ? form.jamb_profile_code : '');
    registrationData.set('jamb_subjects', subjectList === null ? 'null' : JSON.stringify(subjectList));

    setLoading(true);
    try {
      const res = await api.post('/auth/register/intern', registrationData);
      login(res.data.token, res.data.user, res.data.role);
      navigate(res.data.role === 'customer' ? '/customer' : '/intern');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setForm({ ...INITIAL_FORM });
    setRegistrationType('jamb');
    setError('');
  };

  const sectionStyle = {
    background: '#fff',
    border: '1px solid #dfeafc',
    borderRadius: 12,
    padding: '18px 20px',
    marginBottom: 20,
    boxShadow: '0 4px 14px rgba(26, 67, 164, 0.06)',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: 600,
    color: '#123d70',
    marginBottom: 8,
    fontSize: 13,
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid #80acff',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    background: '#fff',
    color: '#123',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
  };

  const radioOptionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f7faff',
    border: '1px solid #d3e2ff',
    borderRadius: 8,
    padding: '10px 12px',
    minHeight: 44,
  };

  const getSubjectOptionsForRow = (index) =>
    ADDITIONAL_JAMB_SUBJECTS.filter(
      (subject) => !form.subjectRows.some((rowValue, rowIndex) => rowIndex !== index && rowValue === subject)
    );

  return (
    <div className="jamb-registration-page" style={{ minHeight: '100vh', background: '#eef4ff', padding: '32px 16px' }}>
      <div className="jamb-registration-card" style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 8px 35px rgba(23, 54, 108, 0.08)' }}>
        <h1 className="jamb-registration-title" style={{ textAlign: 'center', margin: 0, fontSize: '2rem', color: '#0d4db3', fontWeight: 800, letterSpacing: 0.3 }}>JAMB TRAINING REGISTRATION APPLICATION FORM</h1>

        <form className="jamb-registration-form" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <section style={sectionStyle}>
            <div style={{ background: '#e9f1ff', color: '#0e4fb2', borderRadius: 10, padding: '10px 14px', fontWeight: 800, letterSpacing: 0.3, marginBottom: 18 }}>
              SECTION 1 — FOR APPLICANT USE ONLY
            </div>

            <div className="registration-applicant-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 24, alignItems: 'start' }}>
              <div className="registration-field-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} value={form.first_name} onChange={updateField('first_name')} required />
                </div>
                <div>
                  <label style={labelStyle}>Surname</label>
                  <input style={inputStyle} value={form.surname} onChange={updateField('surname')} required />
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" style={inputStyle} value={form.date_of_birth} onChange={updateField('date_of_birth')} required />
                </div>
                <div>
                  <label style={labelStyle}>Place of Birth</label>
                  <input style={inputStyle} value={form.place_of_birth} onChange={updateField('place_of_birth')} required />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input style={inputStyle} value={form.state} onChange={updateField('state')} required />
                </div>
                <div>
                  <label style={labelStyle}>L.G.A.</label>
                  <input style={inputStyle} value={form.lga} onChange={updateField('lga')} required />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input style={inputStyle} value={form.phone_number} onChange={updateField('phone_number')} required />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={updateField('email')} required />
                </div>
                {registrationType === 'jamb' && (
                  <>
                    <div>
                      <label style={labelStyle}>JAMB Registration Number</label>
                      <input style={inputStyle} value={form.jamb_registration_number} onChange={updateField('jamb_registration_number')} required />
                    </div>
                    <div>
                      <label style={labelStyle}>JAMB Profile Code</label>
                      <input style={inputStyle} value={form.jamb_profile_code} onChange={updateField('jamb_profile_code')} required />
                    </div>
                  </>
                )}
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select style={selectStyle} value={form.gender} onChange={updateField('gender')}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Home Address</label>
                  <input style={inputStyle} value={form.home_address} onChange={updateField('home_address')} required />
                </div>
              </div>

              <div className="registration-passport-card" style={{ border: '1px solid #d8e7ff', borderRadius: 10, background: '#f9fbff', padding: 12 }}>
                <label style={labelStyle}>Passport Photograph</label>
                <input className="registration-passport-input" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handlePassportChange} style={{ width: '100%', border: '1px solid #7eaaff', borderRadius: 8, padding: 8, background: '#fff' }} />
                <div className="registration-passport-preview" style={{ marginTop: 12, border: '1px dashed #9dbaf8', borderRadius: 10, background: '#fff', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {form.passportPreview ? (
                    <img className="registration-passport-image" src={form.passportPreview} alt="Passport preview" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#6b7fa3', fontSize: 13 }}>No passport selected</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>Do you want to bring your laptop during training?</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['Yes', 'No'].map((option) => (
                  <label key={option} style={{ ...radioOptionStyle, flex: 1, minWidth: 170 }}>
                    <input type="radio" name="bring_laptop" checked={form.bring_laptop === option} onChange={() => setForm((current) => ({ ...current, bring_laptop: option }))} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <fieldset className="registration-type-group">
              <legend>I want to register for:</legend>
              <div className="registration-type-options">
                <label className="registration-type-option">
                  <input type="radio" name="registration_type_choice" value="jamb" checked={registrationType === 'jamb'} onChange={updateRegistrationType} />
                  <span>JAMB Training</span>
                </label>
                <label className="registration-type-option">
                  <input type="radio" name="registration_type_choice" value="intern" checked={registrationType === 'intern'} onChange={updateRegistrationType} />
                  <span>Internship</span>
                </label>
              </div>
            </fieldset>
          </section>

          <section style={sectionStyle}>
            <div style={{ background: '#e9f1ff', color: '#0e4fb2', borderRadius: 10, padding: '10px 14px', fontWeight: 800, letterSpacing: 0.3, marginBottom: 18 }}>
              SECTION 2
            </div>

            <div className="registration-two-column-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
              <div>
                <label style={labelStyle}>School Name</label>
                <input style={inputStyle} value={form.school_name} onChange={updateField('school_name')} required />
              </div>
              <div>
                <label style={labelStyle}>Graduation Year</label>
                <input style={inputStyle} value={form.graduation_year} onChange={updateField('graduation_year')} placeholder="e.g. 2026" required />
              </div>
            </div>
          </section>

          {registrationType === 'jamb' && (
          <section style={{ ...sectionStyle, overflow: 'hidden' }}>
            <div style={{ background: '#e9f1ff', color: '#0e4fb2', borderRadius: 10, padding: '10px 14px', fontWeight: 800, letterSpacing: 0.3, marginBottom: 18, textAlign: 'center' }}>
              WRITE YOUR JAMB SUBJECTS
            </div>

            <p style={{ textAlign: 'center', color: '#3c5a8a', marginBottom: 8, marginTop: 0 }}>
              <em>“English Language is compulsory. Add the remaining three subjects.”</em>
            </p>
            <p style={{ textAlign: 'center', color: '#5a6f8e', marginBottom: 16, marginTop: 0, fontSize: 12 }}>
              Accepted subject names: Mathematics, Physics, Chemistry, Biology, Economics, Government, Literature in English, Commerce, Accounting, Geography, Agricultural Science, History, Islamic Studies, Christian Religious Studies.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #b9d2ff', minWidth: 420 }}>
                <thead>
                  <tr style={{ background: '#1d5ec8', color: '#fff' }}>
                    <th style={{ border: '1px solid #b9d2ff', padding: '12px 10px', textAlign: 'center', width: 70 }}>S/N</th>
                    <th style={{ border: '1px solid #b9d2ff', padding: '12px 10px', textAlign: 'left' }}>SUBJECT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#f8fbff' }}>
                    <td style={{ border: '1px solid #b9d2ff', padding: '12px 10px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #b9d2ff', padding: '12px 10px' }}>English Language</td>
                  </tr>
                  {form.subjectRows.map((value, index) => (
                    <tr key={`subject-row-${index}`}>
                      <td style={{ border: '1px solid #b9d2ff', padding: '12px 10px', textAlign: 'center' }}>{index + 2}</td>
                      <td style={{ border: '1px solid #b9d2ff', padding: '12px 10px' }}>
                        <select
                          style={selectStyle}
                          value={value}
                          onChange={(event) => updateSubjectRow(index, event.target.value)}
                          required={index < 3}
                        >
                          <option value="">Select subject</option>
                          {getSubjectOptionsForRow(index).map((subject) => (
                            <option key={`${subject}-${index}`} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          )}

          <section style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: 15 }}>Select your preferred schedule for training:</label>
            <div className="registration-two-column-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {[
                { value: 'weekend', label: 'Saturday and Sunday' },
                { value: 'weekday', label: 'Tuesday and Thursday' },
              ].map((option) => (
                <label key={option.value} style={{ ...radioOptionStyle, justifyContent: 'flex-start' }}>
                  <input type="radio" name="training_day" checked={form.training_day === option.value} onChange={() => handleDayChange(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {form.training_day === 'weekend' && (
              <div style={{ marginTop: 14, background: '#ecf7ee', border: '1px solid #bbddc2', borderRadius: 8, color: '#2f6e3f', padding: '10px 12px', fontSize: 14 }}>
                Evening is compulsory for Saturday and Sunday training. Morning and afternoon are disabled for this schedule.
              </div>
            )}
          </section>

          <section style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: 15 }}>Training Time</label>
            <div className="registration-three-column-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {timeOptions.map((slot) => {
                const isDisabled = form.training_day === 'weekend' && slot.value !== 'EVENING';
                const isChecked = form.training_time === slot.value;
                return (
                  <label
                    key={slot.value}
                    style={{
                      ...radioOptionStyle,
                      opacity: isDisabled ? 0.55 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      borderColor: isChecked ? '#1d5ec8' : '#d3e2ff',
                      background: isChecked ? '#edf4ff' : '#f7faff',
                    }}
                  >
                    <input
                      type="radio"
                      name="training_time"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => setForm((current) => ({ ...current, training_time: slot.value }))}
                    />
                    <span style={{ fontWeight: 700 }}>{slot.label}</span>
                  </label>
                );
              })}
            </div>
            {form.training_day === 'weekend' && (
              <div style={{ marginTop: 12, color: '#2d6cdf', fontWeight: 600 }}>
                Selected schedule: Saturday and Sunday — Evening slot is automatically assigned.
              </div>
            )}
          </section>

          <section style={sectionStyle}>
            <div className="registration-two-column-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
              <div>
                <label style={labelStyle}>Parent/Guardian Name</label>
                <input style={inputStyle} value={form.parent_name} onChange={updateField('parent_name')} required />
              </div>
              <div>
                <label style={labelStyle}>Parent/Guardian Phone Number</label>
                <input style={inputStyle} value={form.parent_phone} onChange={updateField('parent_phone')} required />
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <div className="registration-two-column-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
              <div>
                <label style={labelStyle}>Password</label>
                  <div className="registration-password-control">
                  <input
                    type={showPassword.password ? 'text' : 'password'}
                      style={inputStyle}
                    value={form.password}
                    onChange={updateField('password')}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="registration-password-toggle"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0d4db3',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    {showPassword.password ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                  <div className="registration-password-control">
                  <input
                    type={showPassword.confirm_password ? 'text' : 'password'}
                      style={inputStyle}
                    value={form.confirm_password}
                    onChange={updateField('confirm_password')}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm_password')}
                    className="registration-password-toggle"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0d4db3',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    {showPassword.confirm_password ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section style={{ ...sectionStyle, borderColor: '#9bc5a2', background: '#f7fcf7' }}>
            <h2 style={{ margin: '0 0 14px', color: '#245c32', fontSize: 18 }}>Payment Details</h2>
            <div className="registration-payment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, color: '#243b2a' }}>
              <div><strong>Bank Name:</strong> {paymentSettings.payment_bank_name}</div>
              <div><strong>Account Name:</strong> {paymentSettings.payment_account_name}</div>
              <div><strong>Account Number:</strong> {paymentSettings.payment_account_number}</div>
              <div><strong>Amount to be Paid:</strong> ₦{Number(registrationType === 'intern' ? 10000 : paymentSettings.payment_amount || 0).toLocaleString()}</div>
            </div>
            <p style={{ margin: '14px 0 0', color: '#245c32', fontWeight: 700 }}>
              {paymentSettings.payment_note}
            </p>
          </section>

          <section style={{ ...sectionStyle, borderColor: '#c9d7ff', background: '#fbfcff' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#123d70', fontSize: 13, cursor: 'pointer' }}>
                <input className="registration-consent-checkbox" type="checkbox" checked={consents.paid} onChange={() => toggleConsent('paid')} />
                <span>Paid</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#123d70', fontSize: 13, cursor: 'pointer' }}>
                <input className="registration-consent-checkbox" type="checkbox" checked={consents.rules} onChange={() => toggleConsent('rules')} />
                <span>I agree to the organization rules</span>
              </label>
            </div>
          </section>

          {error && (
            <div style={{ marginBottom: 18 }}>
              <Alert type="danger" message={error} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !consents.paid || !consents.rules} style={{ minWidth: 180, opacity: loading || !consents.paid || !consents.rules ? 0.6 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <button type="button" className="btn btn-outline" onClick={clearForm} style={{ minWidth: 140 }}>
              Clear Form
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => window.print()} disabled={!consents.paid || !consents.rules} style={{ minWidth: 140, opacity: !consents.paid || !consents.rules ? 0.6 : 1 }}>
              Print Form
            </button>
          </div>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <Link to="/login/customer" style={{ color: '#0d4db3', textDecoration: 'none' }}>
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
