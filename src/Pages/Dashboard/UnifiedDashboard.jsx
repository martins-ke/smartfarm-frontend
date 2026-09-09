import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import useAuth from '../../useAuth';
import { requestDashboardSummary } from '../../APIs/dashboard';
import DonutChart from './DonutChart';
import LineChart from './LineChart';
import { Spinner } from '../../Components/Spinner/Spinner';
import {
  FaMoneyBillWave, FaProjectDiagram, FaExclamationTriangle,
  FaUsers, FaArrowRight, FaChartLine, FaTractor, FaWallet,
  FaUserShield, FaChartPie, FaChartBar, FaCheckCircle, FaHandHoldingUsd,
  FaExchangeAlt, FaArrowUp, FaArrowDown, FaSearch
} from 'react-icons/fa';

// Admin & Manager dashboard only. Supervisors use SupervisorDashboard.
export function UnifiedDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [txFilter, setTxFilter] = useState('ALL'); // 'ALL' | 'SALES' | 'SUPPLIES'
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    requestDashboardSummary()
      .then(res => { if (mounted && res?.body) setData(res.body); })
      .catch(err => console.error('Dashboard fetch failed:', err))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.zeroStateCard}>
          <div className={styles.zeroStateIconWrap}><FaChartBar /></div>
          <h3 className={styles.zeroStateTitle}>Dashboard Unavailable</h3>
          <p className={styles.zeroStateDesc}>Could not load summary data. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  const { kpis, charts, tables, budget, workforce } = data;

  const revenueSegments = (charts?.revenueByCategory || []).map((c, i) => ({
    label: c.category,
    value: Number(c.revenue) || 0,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][i % 4],
  }));

  const statusSegments = tables?.projectStatusSplit ? [
    { label: 'Active',    value: tables.projectStatusSplit.active,    color: '#10b981' },
    { label: 'Pending',   value: tables.projectStatusSplit.pending,   color: '#f59e0b' },
    { label: 'Completed', value: tables.projectStatusSplit.completed, color: '#6366f1' },
  ] : [];

  const salesTrendData = (charts?.salesTrend || []).map(t => ({
    label: t.date,
    value: Number(t.amount) || 0,
  }));

  const spent = Number(budget?.totalSpent || 0);
  const total = Number(budget?.totalBudget || 1);
  const budgetPct = Math.min(100, (spent / total) * 100);
  const overBudget = spent > total;

  const allTx = tables?.recentTransactions || [];
  const salesCount = (tables?.recentSales || []).length;
  const suppliesCount = (tables?.recentSupplies || []).length;

  const totalSalesInflow = (tables?.recentSales || []).reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const totalSuppliesOutflow = (tables?.recentSupplies || []).reduce((acc, s) => acc + (Number(s.invoiceAmount) || 0), 0);

  const filteredTx = allTx.filter((tx) => {
    if (txFilter === 'SALES' && tx.type !== 'SALE') return false;
    if (txFilter === 'SUPPLIES' && tx.type !== 'SUPPLY') return false;

    if (txSearch.trim()) {
      const q = txSearch.toLowerCase().trim();
      const party = (tx.partyName || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      const ref = (tx.reference || tx.id || '').toLowerCase();
      const status = (tx.paymentStatus || '').toLowerCase();
      const mode = (tx.paymentMode || '').toLowerCase();
      return party.includes(q) || desc.includes(q) || ref.includes(q) || status.includes(q) || mode.includes(q);
    }
    return true;
  });

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Command Center</p>
          <h1 className={styles.welcomeTitle}>
            Welcome back, <span className={styles.usernameText}>{currentUser?.username || 'User'}</span>
          </h1>
        </div>
        <div className={styles.headerDate}>
          <span>{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <section className={styles.kpiGrid}>

        {/* 1. Cash Received (In Account) */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiLabel}>Cash Received</p>
            <p className={styles.kpiValue} style={{ color: '#10b981' }}>
              <span className={styles.currencyPrefix}>KES</span>
              <span>{Number(kpis?.receivedRevenue || 0).toLocaleString()}</span>
            </p>
            <p className={styles.kpiSub}>Actual cash collected in farm account</p>
          </div>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            <FaCheckCircle size={18} />
          </div>
        </div>

        {/* 2. Cumulative Customer Debts (Uncollected) */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <p className={styles.kpiLabel}>Customer Debts</p>
              <button
                type="button"
                className={styles.cardViewBtn}
                onClick={() => navigate('/customers')}
                title="View Customer Ledger & Debts"
              >
                View <FaArrowRight size={8} />
              </button>
            </div>
            <p className={styles.kpiValue} style={{ color: Number(kpis?.pendingDebt || 0) > 0 ? '#f59e0b' : 'var(--text)' }}>
              <span className={styles.currencyPrefix}>KES</span>
              <span>{Number(kpis?.pendingDebt || 0).toLocaleString()}</span>
            </p>
            <p className={styles.kpiSub}>Uncollected credit owed by buyers</p>
          </div>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <FaHandHoldingUsd size={18} />
          </div>
        </div>

        {/* 3. Total Booked Sales */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiLabel}>Total Booked Sales</p>
            <p className={styles.kpiValue}>
              <span className={styles.currencyPrefix}>KES</span>
              <span>{Number(kpis?.revenue || 0).toLocaleString()}</span>
            </p>
            <p className={styles.kpiSub}>Gross recorded sales volume</p>
          </div>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(2,132,199,0.12)', color: '#0284c7' }}>
            <FaMoneyBillWave size={18} />
          </div>
        </div>

        {/* 4. Active Projects */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiLabel}>Active Projects</p>
            <p className={styles.kpiValue}>{kpis?.activeProjects || 0}</p>
            <p className={styles.kpiSub}>
              {(tables?.projectStatusSplit?.pending || 0)} pending · {(tables?.projectStatusSplit?.completed || 0)} completed
            </p>
          </div>
          <div className={styles.kpiIconWrap} style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <FaProjectDiagram size={18} />
          </div>
        </div>

        {/* 5. Inventory Alerts (Only shown when there is low stock) */}
        {Number(kpis?.lowStockCount || 0) > 0 && (
          <div className={styles.kpiCard} style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
            <div className={styles.kpiInfo}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                <p className={styles.kpiLabel} style={{ color: '#ef4444' }}>Inventory Alert</p>
                <button
                  type="button"
                  className={styles.cardViewBtn}
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    borderColor: 'rgba(239,68,68,0.35)',
                    color: '#ef4444'
                  }}
                  onClick={() => navigate('/inventory')}
                  title="View Farm Inventory"
                >
                  View <FaArrowRight size={8} />
                </button>
              </div>
              <p className={styles.kpiValue} style={{ color: '#ef4444' }}>
                {kpis.lowStockCount}
              </p>
              <p className={styles.kpiSub}>Items below reorder threshold</p>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <FaExclamationTriangle size={18} />
            </div>
          </div>
        )}

        {/* 6. Customers (Admin) or Supervisor Count (Manager) */}
        {isAdmin ? (
          <div className={styles.kpiCard}>
            <div className={styles.kpiInfo}>
              <p className={styles.kpiLabel}>Active Customers</p>
              <p className={styles.kpiValue}>{kpis?.customerCount || 0}</p>
              <p className={styles.kpiSub}>{workforce?.totalSupervisors || 0} supervisors · {workforce?.totalManagers || 0} managers</p>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
              <FaUsers size={18} />
            </div>
          </div>
        ) : (
          <div className={styles.kpiCard}>
            <div className={styles.kpiInfo}>
              <p className={styles.kpiLabel}>My Supervisors</p>
              <p className={styles.kpiValue}>{workforce?.mySupervisors || 0}</p>
              <p className={styles.kpiSub}>Field supervisors under your management</p>
            </div>
            <div className={styles.kpiIconWrap} style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <FaUserShield size={18} />
            </div>
          </div>
        )}

      </section>

      {/* ── Charts Row ── */}
      <section className={styles.chartsRow}>

        {/* Revenue By Sector */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><FaChartPie /> Revenue By Sector</h3>
          {revenueSegments.length > 0
            ? <DonutChart segments={revenueSegments} size={160} thickness={20} centerLabel="Sectors" />
            : <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem', fontSize: '0.88rem' }}>No revenue data yet.</p>
          }
        </div>

        {/* Project Status */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><FaProjectDiagram /> Project Status</h3>
          <DonutChart segments={statusSegments} size={160} thickness={20} centerLabel="Projects" />
        </div>

        {/* Budget vs Expenditure */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}><FaWallet /> Budget vs Expenditure</h3>
          <div>
            <div className={styles.budgetRow}>
              <span className={styles.budgetLabel}>Allocated Budget</span>
              <strong style={{ color: 'var(--text)', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>
                <span className={styles.currencyPrefix} style={{ marginRight: '4px' }}>KES</span>
                {Number(budget?.totalBudget || 0).toLocaleString()}
              </strong>
            </div>
            <div className={styles.budgetRow}>
              <span className={styles.budgetLabel}>Total Expenses</span>
              <strong style={{ color: overBudget ? '#ef4444' : '#10b981', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>
                <span className={styles.currencyPrefix} style={{ marginRight: '4px', color: 'inherit' }}>KES</span>
                {spent.toLocaleString()}
              </strong>
            </div>
            <div className={styles.budgetTrack}>
              <div
                className={`${styles.budgetFill} ${overBudget ? styles.budgetFillDanger : ''}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: overBudget ? '#ef4444' : 'var(--muted)', marginTop: '0.6rem', textAlign: 'right' }}>
              {overBudget
                ? `⚠️ Over budget by KES ${(spent - total).toLocaleString()}`
                : `${budgetPct.toFixed(0)}% of budget used`}
            </p>
          </div>
        </div>

      </section>

      {/* ── Sales Trend ── */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}><FaChartLine /> Sales Trend (Last 10 Days)</h3>
        {salesTrendData.length > 0
          ? <LineChart data={salesTrendData} height={220} />
          : <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '2rem', fontSize: '0.88rem' }}>No recent sales recorded.</p>
        }
      </div>

      {/* ── Transaction History (Sales & Supplies) ── */}
      <section className={styles.txSection}>
        <div className={styles.txHeader}>
          <div className={styles.txTitleGroup}>
            <h3 className={styles.txTitle}>
              <FaExchangeAlt style={{ color: '#38bdf8' }} /> Transaction History
            </h3>
          </div>

          <div className={styles.txControls}>
            <div className={styles.txTabs}>
              <button
                type="button"
                className={`${styles.txTabBtn} ${txFilter === 'ALL' ? styles.txTabBtnActive : ''}`}
                onClick={() => setTxFilter('ALL')}
              >
                All <span className={styles.txCountPill}>{allTx.length}</span>
              </button>
              <button
                type="button"
                className={`${styles.txTabBtn} ${txFilter === 'SALES' ? styles.txTabBtnActive : ''}`}
                onClick={() => setTxFilter('SALES')}
              >
                <FaArrowUp size={9} style={{ color: '#10b981' }} /> Sales Inflows <span className={styles.txCountPill}>{salesCount}</span>
              </button>
              <button
                type="button"
                className={`${styles.txTabBtn} ${txFilter === 'SUPPLIES' ? styles.txTabBtnActive : ''}`}
                onClick={() => setTxFilter('SUPPLIES')}
              >
                <FaArrowDown size={9} style={{ color: '#f59e0b' }} /> Supplies Outflows <span className={styles.txCountPill}>{suppliesCount}</span>
              </button>
            </div>

            <div className={styles.txSearchWrap}>
              <FaSearch className={styles.txSearchIcon} />
              <input
                type="text"
                className={styles.txSearchInput}
                placeholder="Search transactions..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className={styles.txSummaryStrip}>
          <div className={styles.txSummaryItem}>
            <span className={styles.txSummaryLabel}>Recent Sales (Inflow):</span>
            <span className={styles.txSummaryValGreen}>+KES {totalSalesInflow.toLocaleString()}</span>
          </div>
          <div className={styles.txSummaryItem}>
            <span className={styles.txSummaryLabel}>Recent Supplies (Outflow):</span>
            <span className={styles.txSummaryValAmber}>-KES {totalSuppliesOutflow.toLocaleString()}</span>
          </div>
          <div className={styles.txSummaryItem}>
            <span className={styles.txSummaryLabel}>Net Cash Flow:</span>
            <span style={{ fontWeight: 700, color: totalSalesInflow >= totalSuppliesOutflow ? '#10b981' : '#ef4444' }}>
              {totalSalesInflow >= totalSuppliesOutflow ? '+' : ''}KES {(totalSalesInflow - totalSuppliesOutflow).toLocaleString()}
            </span>
          </div>
        </div>

        <div className={styles.tableScrollWrap}>
          {filteredTx.length > 0 ? (
            <table className={styles.dashTable}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Party & Details</th>
                  <th>Date</th>
                  <th>Payment Mode</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Ledger</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx, idx) => {
                  const isSale = tx.type === 'SALE';
                  const bal = Number(tx.balanceDue || 0);

                  return (
                    <tr key={tx.id || idx}>
                      <td>
                        {isSale ? (
                          <span className={styles.badgeInflow}>
                            <FaArrowUp size={8} /> Sale
                          </span>
                        ) : (
                          <span className={styles.badgeOutflow}>
                            <FaArrowDown size={8} /> Supply
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          className={styles.txPartyTitle}
                          style={tx.partyId ? { cursor: 'pointer' } : {}}
                          onClick={() => {
                            if (tx.partyId) {
                              navigate(isSale ? `/customers/${tx.partyId}` : `/suppliers/${tx.partyId}`);
                            }
                          }}
                          title={tx.partyId ? `Open ${tx.partyName || (isSale ? 'Customer' : 'Supplier')} page` : undefined}
                        >
                          {tx.partyName || (isSale ? 'Buyer' : 'Supplier')}
                        </div>
                        <div className={styles.txPartySub}>
                          {tx.description} {tx.reference ? `· ${tx.reference}` : ''}
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {tx.date || '—'}
                      </td>
                      <td>
                        <span className={styles.badgePaymentMode}>
                          {(tx.paymentMode || 'CASH').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {isSale ? (
                          <div className={styles.txAmountInflow}>
                            +KES {Number(tx.totalAmount || 0).toLocaleString()}
                          </div>
                        ) : (
                          <div className={styles.txAmountOutflow}>
                            -KES {Number(tx.totalAmount || 0).toLocaleString()}
                          </div>
                        )}
                        {bal > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                            Due: KES {bal.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        {tx.paymentStatus?.toUpperCase() === 'PAID' ? (
                          <span className={styles.badgePaid}>Paid</span>
                        ) : tx.paymentStatus?.toUpperCase() === 'PARTIAL' ? (
                          <span className={styles.badgePartial}>Partial</span>
                        ) : (
                          <span className={styles.badgeUnpaid}>Unpaid</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.txActionBtn}
                          onClick={() => {
                            if (isSale) {
                              navigate(tx.partyId ? `/customers/${tx.partyId}` : '/customers');
                            } else {
                              navigate(tx.partyId ? `/suppliers/${tx.partyId}` : '/suppliers');
                            }
                          }}
                          title={`Open ${isSale ? 'Customer' : 'Supplier'} page`}
                        >
                          <span>{isSale ? 'Customer' : 'Supplier'}</span>
                          <FaArrowRight size={8} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '2rem 1.4rem', color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center' }}>
              {txSearch ? `No transactions match "${txSearch}".` : 'No transactions recorded yet.'}
            </p>
          )}
        </div>
      </section>

      {/* ── Recent Field Harvests ── */}
      <section className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <h3 className={styles.tableCardTitle} style={{ color: '#10b981' }}>
            <FaTractor size={14} /> Recent Field Harvests
          </h3>
        </div>
        <div className={styles.tableScrollWrap}>
          {tables?.recentHarvests?.length > 0 ? (
            <table className={styles.dashTable}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tables.recentHarvests.map((h, i) => (
                  <tr key={h.id || i}>
                    <td style={{ fontWeight: 600 }}>{h.projectName}</td>
                    <td style={{ color: 'var(--muted)' }}>{h.item}</td>
                    <td>
                      <span className={styles.badgeSuccess}>
                        {h.quantity} {h.unit || 'units'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{h.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '1.5rem 1.4rem', color: 'var(--muted)', fontSize: '0.87rem' }}>
              No harvests recorded recently.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default UnifiedDashboard;
