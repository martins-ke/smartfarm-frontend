import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../useAuth';
import { canAccessRoute } from '../utils/accessControl';

export function ProtectedRoute({ allowedRoles = [] }) {
  const user = useAuth((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.length && !canAccessRoute(user, allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
