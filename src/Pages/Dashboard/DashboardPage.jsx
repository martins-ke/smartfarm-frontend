import useAuth from '../../useAuth';
import SupervisorDashboard from './SupervisorDashboard';
import UnifiedDashboard from './UnifiedDashboard';

export function DashboardPage() {
  const currentUser = useAuth((state) => state.user);
  const isSupervisor = currentUser?.role?.toUpperCase() === 'SUPERVISOR';

  if (isSupervisor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <UnifiedDashboard />
        <SupervisorDashboard user={currentUser} />
      </div>
    );
  }

  return <UnifiedDashboard />;
}
