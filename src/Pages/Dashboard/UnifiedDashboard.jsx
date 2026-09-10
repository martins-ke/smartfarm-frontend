import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import useAuth from '../../useAuth';
import { requestDashboardSummary, requestDashboardTransactions } from '../../APIs/dashboard';
import DonutChart from './DonutChart';
import LineChart from './LineChart';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
import {
  FaMoneyBillWave, FaProjectDiagram, FaExclamationTriangle,
  FaUsers, FaArrowRight, FaChartLine, FaTractor, FaWallet,
  FaUserShield, FaChartPie, FaChartBar, FaCheckCircle, FaHandHoldingUsd,
  FaExchangeAlt, FaArrowUp, FaArrowDown, FaSearch
} from 'react-icons/fa';

const TX_PAGE_SIZE = 5;

// Admin & Manager dashboard only. Supervisors use SupervisorDashboard.
export function UnifiedDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Server-side paginated transactions state
  const [txFilter, setTxFilter] = useState('ALL'); // 'ALL' | 'SALES' | 'SUPPLIES'
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [txData, setTxData] = useState({
    content: [],
    page: 1,
    size: TX_PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    totalSalesCount: 0,
    totalSuppliesCount: 0,
    totalSalesInflow: 0,
    totalSuppliesOutflow: 0,
  });

  const fetchSummary = () => {
    setLoading(true);
    setFetchError(null);
    requestDashboardSummary()
      .then((res) => {
        const payload = res?.body || res?.data || res;
        if (payload && typeof payload === 'object') {
          setData(payload);
        } else {
          setFetchError('No data payload returned from server.');
        }
      })
      .catch((err) => {
        console.error('Dashboard fetch failed:', err);
        setFetchError(err.message || 'Could not connect to the backend server.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchTransactions = (targetPage = txPage) => {
    setTxLoading(true);
    requestDashboardTransactions({
      page: targetPage,
      size: TX_PAGE_SIZE,
      filter: txFilter,
      search: txSearch,
    })
      .then((res) => {
        const payload = res?.body || res?.data || res;
        if (payload && payload.content) {
          setTxData(payload);
        }
      })
      .catch((err) => {
        console.error('Transactions fetch failed:', err);
      })
      .finally(() => {
        setTxLoading(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Fetch transactions from backend whenever page, filter, or search changes
  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage, txFilter, txSearch]);

  // Reset page when filter or search changes
  const handleFilterChange = (newFilter) => {
    setTxFilter(newFilter);
    setTxPage(1);
  };

  const handleSearchChange = (newSearch) => {
    setTxSearch(newSearch);
    setTxPage(1);
  };

  // Safe fallback to summary transactions if server pagination response hasn't populated yet
  const displayTx = useMemo(() => {
    if (txData.content && txData.content.length > 0) return txData.content;
    if (txData.totalElements === 0 && (data?.tables?.recentTransactions || []).length > 0 && !txSearch && txFilter === 'ALL') {
      return (data?.tables?.recentTransactions || []).slice(0, TX_PAGE_SIZE);
    }
    return txData.content || [];
  }, [txData.content, txData.totalElements, data?.tables?.recentTransactions, txSearch, txFilter]);

  const totalSalesInflow = Number(txData.totalSalesInflow || 0);
  const totalSuppliesOutflow = Number(txData.totalSuppliesOutflow || 0);
  const totalTxCount = Number(txData.totalElements || 0);
  const totalTxPages = Math.max(1, Number(txData.totalPages || 1));
  const salesCount = Number(txData.totalSalesCount || 0);
  const suppliesCount = Number(txData.totalSuppliesCount || 0);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!data || fetchError) {
    return (
      <div className={styles.container}>
        <ErrorState
          error={fetchError || 'Could not load summary data.'}
          title="Dashboard Unavailable"
          onRetry={fetchSummary}
        />
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
    { label: 'Active',    value: Number(tables.projectStatusSplit.active || 0),    color: '#10b981' },
    { label: 'Completed', value: Number(tables.projectStatusSplit.completed || 0), color: '#3b82f6' },
  ] : [];

  const salesTrendData = (charts?.salesTrend || []).map((t) => ({
    label: t.date,
    value: Number(t.amount) || 0,
  }));

  const spent = Number(budget?.totalSpent || 0);
  const total = Number(budget?.totalBudget || 1);
  const budgetPct = Math.min(100, (spent / total) * 100);
  const overBudget = spent > total;

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
              {Number(kpis?.pendingDebt || 0) > 0 && (
                <button
                  type="button"
                  className={styles.cardViewBtn}
                  onClick={() => navigate('/customers')}
                  title="View Customer Ledger & Debts"
                >
                  View <FaArrowRight size={8} />
                </button>
              )}
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
              {(tables?.projectStatusSplit?.completed || 0)} completed projects
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                <p className={styles.kpiLabel}>Active Customers</p>
                <button
                  type="button"
                  className={styles.cardViewBtn}
                  onClick={() => navigate('/customers')}
                  title="View Customer Directory"
                >
                  View <FaArrowRight size={8} />
                </button>
              </div>
              <p className={styles.kpiValue}>{kpis?.customerCount || 0}</p>
              <p className={styles.kpiSub}>Registered produce buyers & offtakers</p>
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
            ? <DonutChart segments={revenueSegments} size={160} thickness={20} centerLabel="" />
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
                onClick={() => handleFilterChange('ALL')}
              >
                All <span className={styles.txCountPill}>{totalTxCount}</span>
              </button>
              <button
                type="button"
                className={`${styles.txTabBtn} ${txFilter === 'SALES' ? styles.txTabBtnActive : ''}`}
                onClick={() => handleFilterChange('SALES')}
              >
                <FaArrowUp size={9} style={{ color: '#10b981' }} /> Sales Inflows <span className={styles.txCountPill}>{salesCount}</span>
              </button>
              <button
                type="button"
                className={`${styles.txTabBtn} ${txFilter === 'SUPPLIES' ? styles.txTabBtnActive : ''}`}
                onClick={() => handleFilterChange('SUPPLIES')}
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
                onChange={(e) => handleSearchChange(e.target.value)}
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

        <div className={styles.tableScrollWrap} style={{ opacity: txLoading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
          {displayTx.length > 0 ? (
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
                {displayTx.map((tx, idx) => {
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
                        {tx.paymentStatus?.toUpperCase() === 'PAID' || tx.paymentStatus?.toUpperCase() === 'PAID_IN_FULL' ? (
                          <span className={styles.badgePaid}>Paid</span>
                        ) : tx.paymentStatus?.toUpperCase() === 'PARTIAL' || tx.paymentStatus?.toUpperCase() === 'PARTIAL_PAYMENT' ? (
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

        {/* ── Transaction Pagination Controls ── */}
        {totalTxCount > TX_PAGE_SIZE && (
          <div className={styles.txPaginationWrap}>
            <div className={styles.txPaginationInfo}>
              Showing <strong>{(txPage - 1) * TX_PAGE_SIZE + 1}</strong> to{' '}
              <strong>{Math.min(txPage * TX_PAGE_SIZE, totalTxCount)}</strong> of{' '}
              <strong>{totalTxCount}</strong> transactions
            </div>
            <div className={styles.txPaginationControls}>
              <button
                type="button"
                className={styles.txPageBtn}
                onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                disabled={txPage <= 1 || txLoading}
                title="Previous Page (Fetches from backend)"
              >
                ← Prev
              </button>

              <div className={styles.txPagePills}>
                {Array.from({ length: totalTxPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`${styles.txPagePill} ${txPage === pageNum ? styles.txPagePillActive : ''}`}
                    onClick={() => setTxPage(pageNum)}
                    disabled={txLoading}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={styles.txPageBtn}
                onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                disabled={txPage >= totalTxPages || txLoading}
                title="Next Page (Fetches from backend)"
              >
                Next →
              </button>
            </div>
          </div>
        )}
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
