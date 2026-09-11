import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { role } = useAuth();
  const token = localStorage.getItem('token');

  if (!token || !role) {
    return <Navigate to="/" replace />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
