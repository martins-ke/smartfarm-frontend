import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import useAuth from '../../useAuth';
import {
  requestDashboardSummary,
  requestDashboardTransactions,
  requestDashboardInventorySummary
} from '../../APIs/dashboard';
import DonutChart from './DonutChart';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
import {
  FaMoneyBillWave, FaProjectDiagram, FaExclamationTriangle,
  FaUsers, FaArrowRight, FaChartLine, FaTractor, FaWallet,
  FaUserShield, FaChartPie, FaChartBar, FaCheckCircle, FaHandHoldingUsd,
  FaExchangeAlt, FaArrowUp, FaArrowDown, FaSearch, FaTruck,
  FaCoins, FaBalanceScale, FaCalendarAlt, FaMapMarkerAlt, FaBoxes,
  FaSeedling, FaClock, FaWarehouse, FaSyncAlt
} from 'react-icons/fa';

const TX_PAGE_SIZE = 5;

// Admin & Manager dashboard only. Supervisors use SupervisorDashboard.
export function UnifiedDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  // Dual-Lens Segmented View Mode: 'OPERATIONS' | 'FINANCIAL'
  const [activeView, setActiveView] = useState(() => {
    try {
      return localStorage.getItem('agrosync_dash_view') || 'OPERATIONS';
    } catch {
      return 'OPERATIONS';
    }
  });

  const handleViewChange = (mode) => {
    setActiveView(mode);
    try {
      localStorage.setItem('agrosync_dash_view', mode);
    } catch {
      // Ignore storage errors
    }
  };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');

  // Operational Activities tab: 'ALL' | 'IN_PROGRESS' | 'SCHEDULED'
  const [opTab, setOpTab] = useState('ALL');

  // Independent Inventory Summary state (fetched asynchronously)
  const [invLoading, setInvLoading] = useState(true);
  const [invData, setInvData] = useState(null);
  const [invError, setInvError] = useState(null);

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

  const fetchSummary = (targetYear) => {
    setLoading(true);
    setFetchError(null);
    requestDashboardSummary(targetYear)
      .then((res) => {
        const payload = res?.body || res?.data || res;
        if (payload && typeof payload === 'object') {
          setData(payload);
          if (payload.yearScope?.selectedYear) {
            setSelectedYear(payload.yearScope.selectedYear);
          }
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

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    fetchSummary(year);
  };

  const fetchInventory = () => {
    setInvLoading(true);
    setInvError(null);
    requestDashboardInventorySummary()
      .then((res) => {
        const payload = res?.body || res?.data || res;
        if (payload) {
          setInvData(payload);
        }
      })
      .catch((err) => {
        console.error('Inventory summary fetch failed:', err);
        setInvError(err.message || 'Could not load inventory summary.');
      })
      .finally(() => {
        setInvLoading(false);
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
    fetchInventory();
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

  const spent = Number(budget?.totalSpent || 0);
  const total = Number(budget?.totalBudget || 1);
  const budgetPct = Math.min(100, (spent / total) * 100);
  const overBudget = spent > total;

  const totalBooked = Number(kpis?.revenue || 0);
  const cashReceived = Number(kpis?.receivedRevenue || 0);
  const collectionRate = totalBooked > 0 ? Math.min(100, Math.round((cashReceived / totalBooked) * 100)) : 100;

  // Operational metrics
  const allOps = tables?.operationalActivities || [];
  const inProgressOpsCount = allOps.filter(a => a.status?.toUpperCase() === 'IN_PROGRESS').length;
  const scheduledOpsCount = allOps.filter(a => a.status?.toUpperCase() !== 'IN_PROGRESS').length;
  const activeProjectsCount = Number(tables?.projectStatusSplit?.active || 0);
  const totalHarvestBatches = Number(invData?.produce?.totalProduceBatches || 0);
  const totalHarvestQuantity = Number(invData?.produce?.totalProduceQuantity || 0);

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1 className={styles.welcomeTitle}>
            Welcome back, <span className={styles.usernameText}>{currentUser?.username || 'User'}</span>
          </h1>
        </div>

        <div className={styles.headerRight}>
          {/* Dual-Lens Segmented View Toggle */}
          <div className={styles.viewModeToggle} role="tablist" aria-label="Dashboard View Selector">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'OPERATIONS'}
              className={`${styles.viewModeBtn} ${activeView === 'OPERATIONS' ? styles.viewModeBtnActive : ''}`}
              onClick={() => handleViewChange('OPERATIONS')}
            >
              <FaTractor size={13} className={styles.viewModeIcon} />
              <span className={styles.btnLabelFull}>Field Operations</span>
              <span className={styles.btnLabelShort}>Operations</span>
              {inProgressOpsCount > 0 && (
                <span className={styles.viewBadge}>
                  <span className={styles.btnLabelFull}>{inProgressOpsCount} active</span>
                  <span className={styles.btnLabelShort}>{inProgressOpsCount}</span>
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'FINANCIAL'}
              className={`${styles.viewModeBtn} ${activeView === 'FINANCIAL' ? styles.viewModeBtnActive : ''}`}
              onClick={() => handleViewChange('FINANCIAL')}
            >
              <FaChartLine size={13} className={styles.viewModeIcon} />
              <span className={styles.btnLabelFull}>Financial & Analytics</span>
              <span className={styles.btnLabelShort}>Finance</span>
            </button>
          </div>

          <div className={styles.headerSubRow}>
            {/* Year Scope Selector (only visible in Financial View) */}
            {activeView === 'FINANCIAL' && data?.yearScope?.availableYears && data.yearScope.availableYears.length > 0 && (
              <div className={styles.yearSelectorWrap}>
                <label htmlFor="dashboard-year-select" className={styles.yearLabel}>
                  <FaCalendarAlt size={12} /> Scope:
                </label>
                <select
                  id="dashboard-year-select"
                  className={styles.yearSelect}
                  value={selectedYear || data.yearScope.selectedYear || ''}
                  onChange={handleYearChange}
                  aria-label="Filter dashboard by year"
                >
                  {data.yearScope.availableYears.map((y) => {
                    const currentYr = String(new Date().getFullYear());
                    const isCurrent = y === currentYr;
                    const isAll = y === 'ALL';
                    let label = y;
                    if (isCurrent) label = `${y} (Current)`;
                    else if (isAll) label = 'All Time (Lifetime)';
                    return (
                      <option key={y} value={y}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Quick Refresh Button */}
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => {
                fetchSummary(selectedYear);
                fetchInventory();
                fetchTransactions(txPage);
              }}
              title="Refresh latest farm records"
            >
              <FaSyncAlt className={loading || invLoading || txLoading ? styles.spinIcon : ''} size={11} />
              <span>Refresh</span>
            </button>

            <div className={styles.headerDate}>
              <span>{new Date().toLocaleDateString('en-KE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── VIEW 1: FIELD OPERATIONS ── */}
      {activeView === 'OPERATIONS' ? (
        <div className={styles.viewContainer} key="ops-view">

          {/* Operational Pulse KPI Strip */}
          <section className={styles.opsPulseGrid}>
            <div className={styles.opsPulseCard} onClick={() => navigate('/categories')} title="View active farm projects">
              <div className={styles.opsPulseInfo}>
                <p className={styles.opsPulseLabel}>Active Projects</p>
                <p className={styles.opsPulseValue} style={{ color: '#10b981' }}>{activeProjectsCount}</p>
                <p className={styles.opsPulseSub}>Farming cycles in progress</p>
              </div>
              <div className={styles.opsPulseIcon} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <FaProjectDiagram size={18} />
              </div>
            </div>

            <div className={styles.opsPulseCard} title="Ongoing tasks currently active in the field">
              <div className={styles.opsPulseInfo}>
                <p className={styles.opsPulseLabel}>Active Field Work</p>
                <p className={styles.opsPulseValue} style={{ color: '#38bdf8' }}>
                  {inProgressOpsCount}
                  {inProgressOpsCount > 0 && <span className={styles.opPulseDot} style={{ display: 'inline-block', marginLeft: '6px' }} />}
                </p>
                <p className={styles.opsPulseSub}>Field tasks underway</p>
              </div>
              <div className={styles.opsPulseIcon} style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
                <FaTractor size={18} />
              </div>
            </div>

            <div className={styles.opsPulseCard} title="Planned tasks scheduled">
              <div className={styles.opsPulseInfo}>
                <p className={styles.opsPulseLabel}>Scheduled Tasks</p>
                <p className={styles.opsPulseValue} style={{ color: '#f59e0b' }}>{scheduledOpsCount}</p>
                <p className={styles.opsPulseSub}>Upcoming operations & inputs</p>
              </div>
              <div className={styles.opsPulseIcon} style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <FaClock size={18} />
              </div>
            </div>

            <div className={styles.opsPulseCard} onClick={() => navigate('/inventory?tab=harvest')} title="Market-ready harvest batches in stock">
              <div className={styles.opsPulseInfo}>
                <p className={styles.opsPulseLabel}>Ready For Market</p>
                <p className={styles.opsPulseValue} style={{ color: '#28e1f5' }}>
                  {totalHarvestBatches} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>batches</span>
                </p>
                <p className={styles.opsPulseSub}>{totalHarvestQuantity.toLocaleString()} total units in stock</p>
              </div>
              <div className={styles.opsPulseIcon} style={{ background: 'rgba(40,225,245,0.12)', color: '#28e1f5' }}>
                <FaSeedling size={18} />
              </div>
            </div>
          </section>

          {/* Field Operations Hub (Ongoing & Scheduled) */}
          <section className={styles.operationsSection}>
            <div className={styles.operationsHeader}>
              <h3 className={styles.operationsTitle}>
                <FaTractor style={{ color: '#10b981' }} /> Field Operations Hub
              </h3>
              <div className={styles.operationsTabs} role="tablist" aria-label="Field operations filter">
                <button
                  type="button"
                  role="tab"
                  aria-selected={opTab === 'ALL'}
                  className={`${styles.opTabBtn} ${opTab === 'ALL' ? styles.opTabBtnActive : ''}`}
                  onClick={() => setOpTab('ALL')}
                >
                  <span>All</span>
                  <span className={styles.txCountPill}>{allOps.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={opTab === 'IN_PROGRESS'}
                  className={`${styles.opTabBtn} ${opTab === 'IN_PROGRESS' ? styles.opTabBtnActive : ''}`}
                  onClick={() => setOpTab('IN_PROGRESS')}
                >
                  <span className={styles.opPulseDot} />
                  <span className={styles.btnLabelFull}>Ongoing Work</span>
                  <span className={styles.btnLabelShort}>Ongoing</span>
                  <span className={styles.txCountPill}>{inProgressOpsCount}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={opTab === 'SCHEDULED'}
                  className={`${styles.opTabBtn} ${opTab === 'SCHEDULED' ? styles.opTabBtnActive : ''}`}
                  onClick={() => setOpTab('SCHEDULED')}
                >
                  <FaCalendarAlt size={10} />
                  <span>Scheduled</span>
                  <span className={styles.txCountPill}>{scheduledOpsCount}</span>
                </button>
              </div>
            </div>

            {(() => {
              const filteredOps = allOps.filter((a) => {
                const isOngoing = a.status?.toUpperCase() === 'IN_PROGRESS';
                if (opTab === 'IN_PROGRESS') return isOngoing;
                if (opTab === 'SCHEDULED') return !isOngoing;
                return true;
              });

              if (filteredOps.length === 0) {
                return (
                  <p className={styles.opEmptyState}>
                    {opTab === 'IN_PROGRESS' ? 'No field activities currently ongoing in the field.' : opTab === 'SCHEDULED' ? 'No upcoming tasks currently scheduled.' : 'No operational activities recorded yet.'}
                  </p>
                );
              }

              return (
                <div className={styles.operationsGrid}>
                  {filteredOps.map((op) => {
                    const isOngoing = op.status?.toUpperCase() === 'IN_PROGRESS';
                    const p = op.priority?.toUpperCase();
                    const prioClass = p === 'URGENT' ? styles.opPriorityUrgent : p === 'HIGH' ? styles.opPriorityHigh : p === 'LOW' ? styles.opPriorityLow : styles.opPriorityMedium;

                    return (
                      <div
                        key={op.id}
                        className={`${styles.opCard} ${isOngoing ? styles.opCardInProgress : styles.opCardScheduled}`}
                      >
                        <div className={styles.opCardTop}>
                          <h4 className={styles.opCardTitle}>{op.title}</h4>
                          {isOngoing ? (
                            <span className={styles.opStatusPillOngoing}>
                              <span className={styles.opPulseDot} /> In Progress
                            </span>
                          ) : (
                            <span className={styles.opStatusPillScheduled}>
                              <FaClock size={9} /> Scheduled
                            </span>
                          )}
                        </div>

                        <div className={styles.opMetaRow}>
                          <span className={styles.opMetaItem}>
                            <FaSeedling size={10} style={{ color: '#10b981' }} />
                            {op.projectName || 'General'}
                          </span>
                          <span>·</span>
                          <span className={`${styles.opPriorityBadge} ${prioClass}`}>
                            {op.priority || 'MEDIUM'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div className={styles.opLaborCount}>
                            <FaUsers size={11} />
                            <span>{op.assignedWorkers > 0 ? `${op.assignedWorkers} laborer${op.assignedWorkers === 1 ? '' : 's'} assigned` : 'No workers assigned'}</span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaCalendarAlt size={10} />
                            {op.scheduledDate ? `Scheduled: ${op.scheduledDate}` : 'Date unassigned'}
                          </span>
                        </div>

                        {op.notes && op.notes.trim() && (
                          <div className={styles.opRequirementBox}>
                            <FaBoxes size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Required Inputs & Notes:</strong> {op.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* Independent Inventory Summary (Loaded Asynchronously) */}
          <section className={styles.inventorySummaryRow}>
            {/* Supplies Storage Valuation */}
            <div className={styles.invCard}>
              <div className={styles.invCardHeader}>
                <h3 className={styles.invCardTitle}>
                  <FaWarehouse style={{ color: '#38bdf8' }} /> Farm Inputs & Supplies
                </h3>
                <button
                  type="button"
                  className={styles.invActionLink}
                  onClick={() => navigate('/inventory')}
                >
                  Manage Catalog <FaArrowRight size={8} />
                </button>
              </div>

              {invLoading ? (
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <Spinner />
                </div>
              ) : invError ? (
                <p style={{ color: '#ef4444', fontSize: '0.82rem', padding: '1rem' }}>{invError}</p>
              ) : (
                <>
                  <div className={styles.invValuationBanner}>
                    <div>
                      <div className={styles.invValuationLabel}>Total Supplies Valuation</div>
                      <div className={styles.invValuationNum}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>KES</span>
                        <span>{Number(invData?.supplies?.totalValuation || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.invValuationLabel}>Total Tracked</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                        {invData?.supplies?.totalItems || 0} items
                      </div>
                    </div>
                  </div>

                  <div className={styles.invStatusStrip}>
                    <span className={`${styles.invStatusPill} ${styles.invStatusInStock}`}>
                      ● {invData?.supplies?.inStockCount || 0} In Stock
                    </span>
                    <span className={`${styles.invStatusPill} ${styles.invStatusLowStock}`}>
                      ▲ {invData?.supplies?.lowStockCount || 0} Low Stock
                    </span>
                    <span className={`${styles.invStatusPill} ${styles.invStatusOutOfStock}`}>
                      ✕ {invData?.supplies?.outOfStockCount || 0} Out of Stock
                    </span>
                  </div>

                  {invData?.supplies?.categories && invData.supplies.categories.length > 0 && (
                    <div className={styles.invCategoryList}>
                      {invData.supplies.categories.slice(0, 4).map((cat) => (
                        <div key={cat.category} className={styles.invCategoryItem}>
                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{cat.category}</span>
                          <span style={{ color: 'var(--muted)' }}>
                            {cat.itemCount} item{cat.itemCount === 1 ? '' : 's'} ·{' '}
                            <strong style={{ color: '#10b981' }}>
                              KES {Number(cat.valuation || 0).toLocaleString()}
                            </strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Harvest Produce Ready for Market */}
            <div className={styles.invCard}>
              <div className={styles.invCardHeader}>
                <h3 className={styles.invCardTitle}>
                  <FaSeedling style={{ color: '#10b981' }} /> Market-Ready Harvest Produce
                </h3>
                <button
                  type="button"
                  className={styles.invActionLink}
                  onClick={() => navigate('/sales')}
                >
                  Sell Produce <FaArrowRight size={8} />
                </button>
              </div>

              {invLoading ? (
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <Spinner />
                </div>
              ) : invError ? (
                <p style={{ color: '#ef4444', fontSize: '0.82rem', padding: '1rem' }}>{invError}</p>
              ) : invData?.produce?.availableProduce && invData.produce.availableProduce.length > 0 ? (
                <>
                  <div className={styles.invValuationBanner}>
                    <div>
                      <div className={styles.invValuationLabel}>Available for Dispatch</div>
                      <div className={styles.invValuationNum} style={{ color: '#38bdf8' }}>
                        <span>{Number(invData?.produce?.totalProduceQuantity || 0).toLocaleString()}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>total units</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.invValuationLabel}>Active Batches</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                        {invData?.produce?.totalProduceBatches || 0} batches
                      </div>
                    </div>
                  </div>

                  <div className={styles.invProduceList}>
                    {invData.produce.availableProduce.slice(0, 4).map((p, idx) => (
                      <div key={idx} className={styles.invProduceItem}>
                        <div>
                          <div className={styles.invProduceName}>{p.itemName}</div>
                          <div className={styles.invProduceProject}>
                            <FaProjectDiagram size={10} style={{ color: '#38bdf8' }} />
                            <span>{p.projectName || 'General'}</span>
                          </div>
                        </div>
                        <span className={styles.invProduceQtyBadge}>
                          {p.availableQuantity} {p.units}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.opEmptyState}>No market-ready produce stock currently in warehouse.</p>
              )}
            </div>
          </section>

          {/* Recent Field Harvests Feed */}
          <section className={styles.tableCard}>
            <div className={styles.tableCardHeader}>
              <h3 className={styles.tableCardTitle} style={{ color: '#10b981' }}>
                <FaTractor size={14} /> Recent Field Harvests
              </h3>
            </div>
            <div className={styles.tableScrollWrap}>
              {tables?.recentHarvests?.length > 0 ? (
                <>
                  <div className={styles.desktopHarvestWrap}>
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
                  </div>

                  <div className={styles.mobileHarvestList}>
                    {tables.recentHarvests.map((h, i) => (
                      <div key={h.id || i} className={styles.harvestMobileCard}>
                        <div className={styles.harvestMobileTop}>
                          <span className={styles.harvestMobileProject}>{h.projectName}</span>
                          <span className={styles.harvestMobileDate}>{h.date}</span>
                        </div>
                        <div className={styles.harvestMobileBottom}>
                          <span className={styles.harvestMobileItem}>{h.item}</span>
                          <span className={styles.badgeSuccess}>
                            {h.quantity} {h.unit || 'units'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ padding: '1.5rem 1.4rem', color: 'var(--muted)', fontSize: '0.87rem' }}>
                  No harvests recorded recently.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : (
        /* ── VIEW 2: FINANCIAL & BUSINESS ANALYTICS ── */
        <div className={styles.viewContainer} key="fin-view">

          {/* KPI Cards */}
          <section className={styles.kpiGrid}>
            {/* 1. Cash Received */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiInfo}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <p className={styles.kpiLabel}>Cash Received</p>
                  <span 
                    className={styles.collectionBadge} 
                    title={`${collectionRate}% of total booked sales collected`}
                  >
                    {collectionRate}% collected
                  </span>
                </div>
                <p className={styles.kpiValue} style={{ color: '#10b981' }}>
                  <span className={styles.currencyPrefix}>KES</span>
                  <span>{cashReceived.toLocaleString()}</span>
                </p>
                <p className={styles.kpiSub} title={`KES ${cashReceived.toLocaleString()} collected out of KES ${totalBooked.toLocaleString()} total booked sales`}>
                  of KES {totalBooked.toLocaleString()} total booked
                </p>
              </div>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <FaCheckCircle size={18} />
              </div>
            </div>

            {/* 2. Estimated Net Farm Profit */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiInfo}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <p className={styles.kpiLabel}>Net Farm Profit</p>
                  <span className={Number(kpis?.netProfit || 0) >= 0 ? styles.marginBadgePositive : styles.marginBadgeNegative}>
                    {Number(kpis?.operatingMargin || 0) >= 0 ? '+' : ''}{kpis?.operatingMargin || 0}%
                  </span>
                </div>
                <p className={styles.kpiValue} style={{ color: Number(kpis?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                  <span className={styles.currencyPrefix}>KES</span>
                  <span>{Number(kpis?.netProfit || 0).toLocaleString()}</span>
                </p>
                <p className={styles.kpiSub}>Cash collected minus all farm outflows</p>
              </div>
              <div 
                className={styles.kpiIconWrap} 
                style={{ 
                  background: Number(kpis?.netProfit || 0) >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', 
                  color: Number(kpis?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444' 
                }}
              >
                <FaCoins size={18} />
              </div>
            </div>

            {/* 3. Net Working Capital */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiInfo}>
                <p className={styles.kpiLabel}>Net Working Capital</p>
                <p className={styles.kpiValue} style={{ color: '#38bdf8' }}>
                  <span className={styles.currencyPrefix}>KES</span>
                  <span>{Number(kpis?.netWorkingCapital || 0).toLocaleString()}</span>
                </p>
                <p className={styles.kpiSub}>Cash in Account + AR − AP Liabilities</p>
              </div>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
                <FaBalanceScale size={18} />
              </div>
            </div>

            {/* 4. Total Farm Outflows */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiInfo}>
                <p className={styles.kpiLabel}>Total Outflows</p>
                <p className={styles.kpiValue} style={{ color: '#f59e0b' }}>
                  <span className={styles.currencyPrefix}>KES</span>
                  <span>{Number(kpis?.totalOutflows || 0).toLocaleString()}</span>
                </p>
                <p className={styles.kpiSub} title={`OPEX: KES ${Number(kpis?.totalExpenses || 0).toLocaleString()} | Supplies: KES ${Number(kpis?.totalSuppliesCost || 0).toLocaleString()}`}>
                  OPEX KES {Number(kpis?.totalExpenses || 0).toLocaleString()} · Supplies KES {Number(kpis?.totalSuppliesCost || 0).toLocaleString()}
                </p>
              </div>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <FaArrowDown size={18} />
              </div>
            </div>

            {/* 5. Cumulative Customer Debts (AR) */}
            {Number(kpis?.pendingDebt || 0) > 0 && (
              <div className={styles.kpiCard}>
                <div className={styles.kpiInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <p className={styles.kpiLabel}>Customer Debts (AR)</p>
                    <button
                      type="button"
                      className={styles.cardViewBtn}
                      onClick={() => navigate('/customers')}
                      title="View Customer Ledger & Debts"
                    >
                      View <FaArrowRight size={8} />
                    </button>
                  </div>
                  <p className={styles.kpiValue} style={{ color: '#f59e0b' }}>
                    <span className={styles.currencyPrefix}>KES</span>
                    <span>{Number(kpis?.pendingDebt || 0).toLocaleString()}</span>
                  </p>
                  <p className={styles.kpiSub}>Uncollected credit owed by buyers</p>
                </div>
                <div className={styles.kpiIconWrap} style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                  <FaHandHoldingUsd size={18} />
                </div>
              </div>
            )}

            {/* 6. Farm Debt to Suppliers (AP) */}
            {Number(kpis?.supplierDebt || 0) > 0 && (
              <div className={styles.kpiCard}>
                <div className={styles.kpiInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <p className={styles.kpiLabel}>Supplier Debts (AP)</p>
                    <button
                      type="button"
                      className={styles.cardViewBtn}
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        borderColor: 'rgba(239,68,68,0.35)',
                        color: '#ef4444'
                      }}
                      onClick={() => navigate('/suppliers')}
                      title="View Supplier Accounts Payable & Invoices"
                    >
                      View <FaArrowRight size={8} />
                    </button>
                  </div>
                  <p className={styles.kpiValue} style={{ color: '#ef4444' }}>
                    <span className={styles.currencyPrefix}>KES</span>
                    <span>{Number(kpis?.supplierDebt || 0).toLocaleString()}</span>
                  </p>
                  <p className={styles.kpiSub}>
                    {`Farm liability owed to ${kpis?.supplierDebtCount || 0} vendor${(kpis?.supplierDebtCount || 0) === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div 
                  className={styles.kpiIconWrap} 
                  style={{ 
                    background: 'rgba(239,68,68,0.12)', 
                    color: '#ef4444' 
                  }}
                >
                  <FaTruck size={18} />
                </div>
              </div>
            )}

            {/* Supervisor Count (Manager only) */}
            {!isAdmin && (
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

          {/* Charts Row */}
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
                {Number(kpis?.totalLaborWages || 0) > 0 && (
                  <div className={styles.budgetRow} style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed var(--border, rgba(255,255,255,0.08))' }}>
                    <span className={styles.budgetLabel} style={{ fontSize: '0.74rem' }}>Workforce Labor Wages</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                      KES {Number(kpis?.totalLaborWages || 0).toLocaleString()}
                    </span>
                  </div>
                )}
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

          {/* Transaction History (Sales & Supplies) */}
          <section className={styles.txSection}>
            <div className={styles.txHeader}>
              <div className={styles.txTitleGroup}>
                <h3 className={styles.txTitle}>
                  <FaExchangeAlt style={{ color: '#38bdf8' }} /> Transaction History
                </h3>
              </div>

              <div className={styles.txControls}>
                <div className={styles.txTabs} role="tablist" aria-label="Transaction filters">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={txFilter === 'ALL'}
                    className={`${styles.txTabBtn} ${txFilter === 'ALL' ? styles.txTabBtnActive : ''}`}
                    onClick={() => handleFilterChange('ALL')}
                  >
                    <span>All</span>
                    <span className={styles.txCountPill}>{totalTxCount}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={txFilter === 'SALES'}
                    className={`${styles.txTabBtn} ${txFilter === 'SALES' ? styles.txTabBtnActive : ''}`}
                    onClick={() => handleFilterChange('SALES')}
                  >
                    <FaArrowUp size={9} style={{ color: '#10b981' }} />
                    <span className={styles.btnLabelFull}>Sales Inflows</span>
                    <span className={styles.btnLabelShort}>Sales</span>
                    <span className={styles.txCountPill}>{salesCount}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={txFilter === 'SUPPLIES'}
                    className={`${styles.txTabBtn} ${txFilter === 'SUPPLIES' ? styles.txTabBtnActive : ''}`}
                    onClick={() => handleFilterChange('SUPPLIES')}
                  >
                    <FaArrowDown size={9} style={{ color: '#f59e0b' }} />
                    <span className={styles.btnLabelFull}>Supplies Outflows</span>
                    <span className={styles.btnLabelShort}>Supplies</span>
                    <span className={styles.txCountPill}>{suppliesCount}</span>
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
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className={styles.desktopTxWrap}>
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
                  </div>

                  {/* Mobile Card List View (< 768px) */}
                  <div className={styles.mobileTxList}>
                    {displayTx.map((tx, idx) => {
                      const isSale = tx.type === 'SALE';
                      const bal = Number(tx.balanceDue || 0);

                      return (
                        <div key={tx.id || idx} className={styles.txMobileCard}>
                          <div className={styles.txMobileTop}>
                            <div className={styles.txMobileBadges}>
                              {isSale ? (
                                <span className={styles.badgeInflow}>
                                  <FaArrowUp size={8} /> Sale
                                </span>
                              ) : (
                                <span className={styles.badgeOutflow}>
                                  <FaArrowDown size={8} /> Supply
                                </span>
                              )}
                              <span className={styles.badgePaymentMode}>
                                {(tx.paymentMode || 'CASH').replace(/_/g, ' ')}
                              </span>
                              {tx.paymentStatus?.toUpperCase() === 'PAID' || tx.paymentStatus?.toUpperCase() === 'PAID_IN_FULL' ? (
                                <span className={styles.badgePaid}>Paid</span>
                              ) : tx.paymentStatus?.toUpperCase() === 'PARTIAL' || tx.paymentStatus?.toUpperCase() === 'PARTIAL_PAYMENT' ? (
                                <span className={styles.badgePartial}>Partial</span>
                              ) : (
                                <span className={styles.badgeUnpaid}>Unpaid</span>
                              )}
                            </div>
                            <span className={styles.txMobileDate}>{tx.date || '—'}</span>
                          </div>

                          <div className={styles.txMobileBody}>
                            <div className={styles.txMobilePartyRow}>
                              <div
                                className={styles.txPartyTitle}
                                style={tx.partyId ? { cursor: 'pointer' } : {}}
                                onClick={() => {
                                  if (tx.partyId) {
                                    navigate(isSale ? `/customers/${tx.partyId}` : `/suppliers/${tx.partyId}`);
                                  }
                                }}
                              >
                                {tx.partyName || (isSale ? 'Buyer' : 'Supplier')}
                              </div>
                              <div className={isSale ? styles.txAmountInflow : styles.txAmountOutflow}>
                                {isSale ? '+' : '-'}KES {Number(tx.totalAmount || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className={styles.txMobileSubRow}>
                              <div className={styles.txPartySub}>
                                {tx.description} {tx.reference ? `· ${tx.reference}` : ''}
                              </div>
                              {bal > 0 && (
                                <span className={styles.txMobileDueBadge}>
                                  Due: KES {bal.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className={styles.txMobileFooter}>
                            <button
                              type="button"
                              className={styles.txMobileActionBtn}
                              onClick={() => {
                                if (isSale) {
                                  navigate(tx.partyId ? `/customers/${tx.partyId}` : '/customers');
                                } else {
                                  navigate(tx.partyId ? `/suppliers/${tx.partyId}` : '/suppliers');
                                }
                              }}
                            >
                              <span>Open {isSale ? 'Customer' : 'Supplier'} Ledger</span>
                              <FaArrowRight size={9} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ padding: '2rem 1.4rem', color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center' }}>
                  {txSearch ? `No transactions match "${txSearch}".` : 'No transactions recorded yet.'}
                </p>
              )}
            </div>

            {/* Transaction Pagination Controls */}
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
                    title="Previous Page"
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
                    title="Next Page"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default UnifiedDashboard;
