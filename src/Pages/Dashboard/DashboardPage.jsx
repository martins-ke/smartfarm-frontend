import useAuth from '../../useAuth';
import SupervisorDashboard from './SupervisorDashboard';
import ManagerDashboard from './ManagerDashboard';

export function DashboardPage() {
  const currentUser = useAuth((state) => state.user);
  const isSupervisor = currentUser?.role?.toUpperCase() === 'SUPERVISOR';

  if (isSupervisor) {
    return <SupervisorDashboard user={currentUser} />;
  }

  return <ManagerDashboard user={currentUser} />;
}
