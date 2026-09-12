import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  super_admin: [
    { to: '/superadmin', label: 'Dashboard', icon: 'fa-gauge', end: true },
    { to: '/superadmin/admins', label: 'Admins', icon: 'fa-user-shield' },
    { to: '/admin/interns', label: 'JAMB Interns', icon: 'fa-user-graduate' },
    { to: '/admin/customers', label: 'Customers', icon: 'fa-users' },
    { to: '/admin/services', label: 'Services', icon: 'fa-list-check' },
    { to: '/admin/reports', label: 'Reports', icon: 'fa-file-lines' },
    { to: '/superadmin/logs', label: 'System Logs', icon: 'fa-clipboard-list' },
    { to: '/superadmin/settings', label: 'Settings', icon: 'fa-gear' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'fa-gauge', end: true },
    { to: '/admin/interns', label: 'JAMB Interns', icon: 'fa-user-graduate' },
    { to: '/admin/attendance', label: 'Attendance', icon: 'fa-calendar-check' },
    { to: '/admin/services', label: 'Services', icon: 'fa-list-check' },
    { to: '/admin/customers', label: 'Customers', icon: 'fa-users' },
    { to: '/admin/payments', label: 'Payments & Revenue', icon: 'fa-naira-sign' },
    { to: '/admin/certificates', label: 'Certificates', icon: 'fa-award' },
    { to: '/admin/notifications', label: 'Notifications', icon: 'fa-bell' },
    { to: '/admin/reports', label: 'Reports', icon: 'fa-file-lines' },
  ],
  intern: [
    { to: '/intern', label: 'Dashboard', icon: 'fa-gauge', end: true },
    { to: '/intern/profile', label: 'My Profile', icon: 'fa-id-card' },
    { to: '/intern/attendance', label: 'Attendance', icon: 'fa-calendar-check' },
  ],
  customer: [
    { to: '/customer', label: 'Dashboard', icon: 'fa-gauge', end: true },
    { to: '/customer/services', label: 'Services', icon: 'fa-shop' },
    { to: '/customer/payments', label: 'My Payments', icon: 'fa-receipt' },
    { to: '/customer/profile', label: 'Profile', icon: 'fa-user' },
  ],
};

export default function DashboardLayout({ title, children }) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_BY_ROLE[role] || [];

  useEffect(() => {
    document.body.classList.toggle('mobile-sidebar-open', mobileOpen);
    return () => document.body.classList.remove('mobile-sidebar-open');
  }, [mobileOpen]);

  const toggleMobileNav = () => {
    setMobileOpen((prev) => {
      const next = !prev;
      document.body.classList.toggle('mobile-sidebar-open', next);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileNav = () => {
    setMobileOpen(false);
    document.body.classList.remove('mobile-sidebar-open');
  };

  return (
    <div className="app-shell">
      <button
        className="mobile-nav-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        onClick={toggleMobileNav}
      >
        <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} />
      </button>

      <div
        className={`mobile-nav-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={closeMobileNav}
        aria-hidden={!mobileOpen}
      />

      <nav className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <i className="fa-solid fa-graduation-cap" />
          <span>A.A Dynamic</span>
        </div>
        <ul className="sidebar-nav">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} onClick={closeMobileNav}>
                <i className={`fa-solid ${item.icon}`} /> {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button className="btn btn-outline btn-block" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" /> Logout
          </button>
        </div>
      </nav>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-right">
            <span style={{ fontWeight: 600 }}>{user?.full_name}</span>
            <span className="badge badge-secondary">{role === 'intern' ? 'JAMB Intern' : role?.replace('_', ' ')}</span>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
