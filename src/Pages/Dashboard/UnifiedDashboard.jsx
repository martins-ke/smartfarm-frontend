import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import useAuth from '../../useAuth';
import { requestDashboardSummary } from '../../APIs/dashboard';
import DonutChart from './DonutChart';
import { Spinner } from '../../Components/Spinner/Spinner';
import { 
  FaChartBar, FaMoneyBillWave, FaProjectDiagram, 
  FaExclamationTriangle, FaUsers, FaArrowRight 
} from 'react-icons/fa';

export function UnifiedDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isSupervisor = currentUser?.role?.toUpperCase() === 'SUPERVISOR';
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    requestDashboardSummary()
      .then(res => {
        if (isMounted && res?.body) setData(res.body);
      })
      .catch(err => console.error("Failed to fetch dashboard summary", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <h2>Error Loading Dashboard</h2>
        <p>Could not retrieve summary data.</p>
      </div>
    );
  }

  const { kpis, charts, tables } = data;

  // Format charts for DonutChart component
  const revenueSegments = charts?.revenueByCategory?.map((c, i) => ({
    label: c.category,
    value: c.revenue,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][i % 4]
  })) || [];

  const statusSegments = tables?.projectStatusSplit ? [
    { label: 'Active', value: tables.projectStatusSplit.active, color: '#10b981' },
    { label: 'Pending', value: tables.projectStatusSplit.pending, color: '#f59e0b' },
    { label: 'Completed', value: tables.projectStatusSplit.completed, color: '#6366f1' }
  ] : [];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Command Center</p>
          <h1>Welcome back, {currentUser?.username || 'User'}</h1>
        </div>
      </header>

      {/* KPIs Row */}
      <section className={styles.gridContainer} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', display: 'grid', gap: '1rem' }}>
        
        {!isSupervisor && (
          <div className={styles.metricCard} style={{ background: 'var(--header-card-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Total Revenue</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', color: 'var(--text)' }}>
                  KES {kpis?.revenue?.toLocaleString() || '0'}
                </h3>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#10b981' }}>
                <FaMoneyBillWave size={20} />
              </div>
            </div>
          </div>
        )}

        <div className={styles.metricCard} style={{ background: 'var(--header-card-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Active Projects</p>
              <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', color: 'var(--text)' }}>
                {kpis?.activeProjects || 0}
              </h3>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#3b82f6' }}>
              <FaProjectDiagram size={20} />
            </div>
          </div>
        </div>

        {!isSupervisor && (
          <div className={styles.metricCard} style={{ background: 'var(--header-card-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Inventory Alerts</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', color: kpis?.lowStockCount > 0 ? '#ef4444' : 'var(--text)' }}>
                  {kpis?.lowStockCount || 0}
                </h3>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#ef4444' }}>
                <FaExclamationTriangle size={20} />
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className={styles.metricCard} style={{ background: 'var(--header-card-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Active Customers</p>
                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', color: 'var(--text)' }}>
                  {kpis?.customerCount || 0}
                </h3>
              </div>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#8b5cf6' }}>
                <FaUsers size={20} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Analytics Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        
        {!isSupervisor && (
          <div style={{ background: 'var(--header-card-bg)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartBar color="var(--accent)" /> Revenue By Sector
            </h3>
            {revenueSegments.length > 0 ? (
              <DonutChart segments={revenueSegments} size={200} thickness={24} />
            ) : (
              <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem' }}>No revenue data recorded.</p>
            )}
          </div>
        )}

        <div style={{ background: 'var(--header-card-bg)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaProjectDiagram color="var(--accent)" /> Project Status
          </h3>
          <DonutChart segments={statusSegments} size={200} thickness={24} />
        </div>

      </section>

      {/* Tables Row */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        
        {!isSupervisor && tables?.lowStockItems?.length > 0 && (
          <div style={{ background: 'var(--header-card-bg)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                <FaExclamationTriangle /> Critical Inventory Warnings
              </h3>
              <button 
                onClick={() => navigate('/inventory')}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                View All <FaArrowRight size={10} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)' }}>Item Name</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)' }}>Category</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)' }}>Current Stock</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--muted)' }}>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.lowStockItems.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text)' }}>{item.name}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--muted)' }}>{item.category}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#ef4444', fontWeight: 700 }}>{item.currentQuantity}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text)' }}>{item.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </section>

    </div>
  );
}

export default UnifiedDashboard;
