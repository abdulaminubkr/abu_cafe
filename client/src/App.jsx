import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/landing/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyLookup from './pages/auth/VerifyLookup';

import AdminDashboard from './pages/admin/Dashboard';
import Interns from './pages/admin/Interns';
import InternForm from './pages/admin/InternForm';
import InternView from './pages/admin/InternView';
import Attendance from './pages/admin/Attendance';
import AttendanceHistory from './pages/admin/AttendanceHistory';
import Services from './pages/admin/Services';
import Customers from './pages/admin/Customers';
import Payments from './pages/admin/Payments';
import Certificates from './pages/admin/Certificates';
import Notifications from './pages/admin/Notifications';
import Reports from './pages/admin/Reports';

import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Admins from './pages/superadmin/Admins';
import Logs from './pages/superadmin/Logs';
import Settings from './pages/superadmin/Settings';

import InternDashboard from './pages/intern/Dashboard';
import InternProfile from './pages/intern/Profile';
import InternAttendance from './pages/intern/Attendance';

import CustomerDashboard from './pages/customer/Dashboard';
import CustomerServices from './pages/customer/Services';
import CustomerPayments from './pages/customer/Payments';
import CustomerProfile from './pages/customer/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public / auth */}
          <Route path="/" element={<Landing />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password/:role" element={<ForgotPassword />} />
          <Route path="/verify" element={<VerifyLookup />} />

          {/* Admin + Super Admin (super admin can reach all admin-level pages too) */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/interns" element={<ProtectedRoute roles={['admin', 'super_admin']}><Interns /></ProtectedRoute>} />
          <Route path="/admin/interns/new" element={<ProtectedRoute roles={['admin', 'super_admin']}><InternForm /></ProtectedRoute>} />
          <Route path="/admin/interns/:id" element={<ProtectedRoute roles={['admin', 'super_admin']}><InternView /></ProtectedRoute>} />
          <Route path="/admin/interns/:id/edit" element={<ProtectedRoute roles={['admin', 'super_admin']}><InternForm /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute roles={['admin', 'super_admin']}><Attendance /></ProtectedRoute>} />
          <Route path="/admin/attendance-history" element={<ProtectedRoute roles={['admin', 'super_admin']}><AttendanceHistory /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute roles={['admin', 'super_admin']}><Services /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute roles={['admin', 'super_admin']}><Customers /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute roles={['admin', 'super_admin']}><Payments /></ProtectedRoute>} />
          <Route path="/admin/certificates" element={<ProtectedRoute roles={['admin', 'super_admin']}><Certificates /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin', 'super_admin']}><Notifications /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin', 'super_admin']}><Reports /></ProtectedRoute>} />

          {/* Super Admin only */}
          <Route path="/superadmin" element={<ProtectedRoute roles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/admins" element={<ProtectedRoute roles={['super_admin']}><Admins /></ProtectedRoute>} />
          <Route path="/superadmin/logs" element={<ProtectedRoute roles={['super_admin']}><Logs /></ProtectedRoute>} />
          <Route path="/superadmin/settings" element={<ProtectedRoute roles={['super_admin']}><Settings /></ProtectedRoute>} />

          {/* Intern portal */}
          <Route path="/intern" element={<ProtectedRoute roles={['intern']}><InternDashboard /></ProtectedRoute>} />
          <Route path="/intern/profile" element={<ProtectedRoute roles={['intern']}><InternProfile /></ProtectedRoute>} />
          <Route path="/intern/attendance" element={<ProtectedRoute roles={['intern']}><InternAttendance /></ProtectedRoute>} />

          {/* Customer portal */}
          <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/services" element={<ProtectedRoute roles={['customer']}><CustomerServices /></ProtectedRoute>} />
          <Route path="/customer/payments" element={<ProtectedRoute roles={['customer']}><CustomerPayments /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute roles={['customer']}><CustomerProfile /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
