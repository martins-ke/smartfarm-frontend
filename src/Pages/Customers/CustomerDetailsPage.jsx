import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './CustomerDetailsPage.module.css';
import { getCustomerById, recordCustomerPayment, getCustomerSales } from '../../APIs/customer';
import { notify } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import {
  FaUserCheck,
  FaHandHoldingUsd,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBan,
  FaTimes,
  FaChartLine,
  FaHistory,
  FaShoppingBag,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaMoneyBillWave
} from 'react-icons/fa';

export function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Paginated Purchase History State (Page size 10, latest first)
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(0);
  const [salesTotalPages, setSalesTotalPages] = useState(0);
  const [salesTotalElements, setSalesTotalElements] = useState(0);
  const SALES_PAGE_SIZE = 10;

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getCustomerById(customerId);
      setCustomer(res);
    } catch (err) {
      notify(err.message || 'Failed to load customer details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async (currentPage = salesPage, contact = customer?.contact) => {
    setSalesLoading(true);
    try {
      const res = await getCustomerSales(customerId, currentPage, SALES_PAGE_SIZE, contact);
      const content = res?.content || (Array.isArray(res) ? res : []);
      setSales(content);
      setSalesTotalPages(res?.totalPages || (content.length > 0 ? 1 : 0));
      setSalesTotalElements(res?.totalElements !== undefined ? res.totalElements : content.length);
    } catch (_err) {
      setSales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      loadSales(salesPage, customer?.contact);
    }
  }, [customerId, salesPage, customer?.contact]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      notify('Please enter a valid payment amount', 'error');
      return;
    }
    try {
      await recordCustomerPayment(customer.id, Number(paymentAmount));
      notify('Payment recorded successfully!', 'success');
      setShowPaymentModal(false);
      setPaymentAmount('');
      loadData();
      loadSales(salesPage);
    } catch (err) {
      notify(err.message || 'Failed to record payment', 'error');
    }
  };

  const handlePrevPage = () => {
    if (salesPage > 0) {
      setSalesPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (salesPage < salesTotalPages - 1) {
      setSalesPage((prev) => prev + 1);
    }
  };

  if (loading) {
    return <Spinner fullPage label="Loading customer ledger..." />;
  }

  if (!customer) {
    return (
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink} onClick={() => navigate('/customers')}>Customers</span> / <strong>Not Found</strong>
        </div>
        <p style={{ marginTop: '1.5rem', color: '#94a3b8' }}>Customer not found or has been removed.</p>
      </div>
    );
  }

  const debt = Number(customer.outstandingDebt || 0);
  const creditLimit = Number(customer.creditLimit || 0);
  const isBlocked = customer.creditStatus === 'BLOCKED';
  const utilizationPercent = creditLimit > 0 ? Math.min(100, Math.round((debt / creditLimit) * 100)) : 0;

  return (
    <div className={styles.container}>
      {/* Top Breadcrumbs */}
      <div className={styles.navRow}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink} onClick={() => navigate('/customers')}>Customers</span> / <strong>{customer.name}</strong>
        </div>
      </div>

      {/* Main Profile Header */}
      <div className={styles.profileHeaderCard}>
        <div className={styles.headerLeft}>
          <div className={styles.custAvatar}>
            <FaUserCheck />
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.customerTitle}>{customer.name}</h1>
            <div className={styles.badgeRow}>
              <span className={styles.badgeCategory}>{customer.category || 'General Produce Buyer'}</span>
              {isBlocked ? (
                <span className={styles.statusBlocked}><FaBan /> CREDIT BLOCKED</span>
              ) : debt > 0 ? (
                <span className={styles.statusDebt}><FaExclamationTriangle /> ACTIVE DEBT: KES {debt.toLocaleString()}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {debt > 0 && (
            <button className={styles.actionBtnCollect} onClick={() => setShowPaymentModal(true)}>
              <FaHandHoldingUsd /> Collect Payment
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Purchased</span>
          <span className={styles.metricVal}>KES {Number(customer.totalPurchases || 0).toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative sales</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Payments Remitted</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {Number(customer.totalPaid || 0).toLocaleString()}</span>
          <span className={styles.metricSub}>Cash & M-Pesa collected</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Outstanding Debt (AR)</span>
          <span className={`${styles.metricVal} ${debt > 0 ? styles.warningText : styles.successText}`}>
            KES {debt.toLocaleString()}
          </span>
          <span className={styles.metricSub}>{debt > 0 ? 'Receivable balance' : 'No balance'}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Assigned Credit Line</span>
          <span className={styles.metricVal}>KES {creditLimit.toLocaleString()}</span>
          <span className={styles.metricSub}>{creditLimit > 0 ? `Credit ceiling` : 'Cash-only'}</span>
        </div>
      </div>

      {/* Credit Utilization Progress Bar */}
      {creditLimit > 0 && (
        <div className={styles.creditHealthCard}>
          <div className={styles.creditHealthHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <FaChartLine /> Credit Utilization
            </span>
            <span style={{ fontWeight: 600, color: debt >= creditLimit ? '#ef4444' : debt > creditLimit * 0.75 ? '#f59e0b' : '#34d399' }}>
              KES {debt.toLocaleString()} / KES {creditLimit.toLocaleString()} ({utilizationPercent}%)
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div 
              className={styles.progressBarFill} 
              style={{ 
                width: `${utilizationPercent}%`,
                backgroundColor: debt >= creditLimit ? '#ef4444' : debt > creditLimit * 0.75 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>
      )}

      {/* Two Column Layout: Profile & AR Ledger */}
      <div className={styles.detailsGrid}>
        <div className={styles.detailsCard}>
          <h3>Buyer & Contact Information</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Customer / Business:</span>
            <strong className={styles.infoValue}>{customer.name}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Category:</span>
            <span className={styles.infoValue}>{customer.category || 'General Produce Buyer'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phone / M-Pesa:</span>
            <span className={styles.infoValue}>
              {customer.contact ? (
                <a href={`tel:${customer.contact}`} className={styles.contactLink}>
                  <FaPhone className={styles.iconMini} /> {customer.contact}
                </a>
              ) : '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>National ID / Reg No:</span>
            <strong className={styles.infoValue}>{customer.id_number || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Location:</span>
            <span className={styles.infoValue}>{customer.address || '-'}</span>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <h3>Accounts Receivable Ledger</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Invoiced Sales:</span>
            <strong className={styles.infoValue}>KES {Number(customer.totalPurchases || 0).toLocaleString()}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Payments Remitted:</span>
            <strong className={`${styles.infoValue} ${styles.successText}`}>KES {Number(customer.totalPaid || 0).toLocaleString()}</strong>
          </div>
          <div className={`${styles.infoRow} ${styles.infoRowHighlight}`}>
            <span className={styles.infoLabel}>Debt Balance:</span>
            <strong className={`${styles.infoValue} ${debt > 0 ? styles.warningText : styles.successText}`}>
              KES {debt.toLocaleString()}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Credit Line:</span>
            <strong className={styles.infoValue}>KES {creditLimit.toLocaleString()}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Account Status:</span>
            <span className={styles.infoValue}>
              {isBlocked ? (
                <span className={styles.statusBlocked}><FaBan /> CREDIT BLOCKED</span>
              ) : debt > 0 ? (
                <span className={styles.statusDebt}><FaExclamationTriangle /> HAS DEBT</span>
              ) : (
                <span className={styles.statusGoodStanding}><FaCheckCircle /> ACTIVE</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Buyer Purchase History Table (Paginated, Size 10, Latest First) ── */}
      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <div className={styles.historyHeaderLeft}>
            <h3 className={styles.historyTitle}>
              <FaHistory className={styles.sectionIcon} /> Buyer Order History
            </h3>
            <span className={styles.historySub}>
              Farm produce purchases (latest first)
            </span>
          </div>
          <span className={styles.countBadge}>
            {salesTotalElements} {salesTotalElements === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {salesLoading ? (
          <div className={styles.historySpinner}>
            <Spinner label="Loading purchase history..." />
          </div>
        ) : sales.length === 0 ? (
          <div className={styles.emptyHistory}>
            <FaShoppingBag className={styles.emptyIcon} />
            <p>No purchase records found for this buyer yet.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Produce Item</th>
                    <th>Qty & Rate</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Mode</th>
                    <th style={{ textAlign: 'right' }}>Paid / Due</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const totalAmt = Number(sale.total_amount || 0);
                    const paidAmt = Number(sale.amountPaid !== undefined ? sale.amountPaid : totalAmt);
                    const dueAmt = Number(sale.balanceDue !== undefined ? sale.balanceDue : (totalAmt - paidAmt));
                    const status = (sale.paymentStatus || (dueAmt > 0 ? 'PARTIAL' : 'PAID_IN_FULL')).toUpperCase();
                    const isFullyPaid = dueAmt <= 0;

                    return (
                      <tr key={sale.id} className={styles.historyRow}>
                        {/* Date */}
                        <td>
                          <div className={styles.dateCell}>
                            <span className={styles.dateText}>
                              <FaCalendarAlt className={styles.miniIcon} /> {sale.added_on || '—'}
                            </span>
                            <span className={styles.receiptId}>
                              #{sale.id ? sale.id.slice(0, 8).toUpperCase() : 'SAL'}
                            </span>
                          </div>
                        </td>

                        {/* Item */}
                        <td>
                          <div className={styles.itemCell}>
                            <strong className={styles.itemName}>{sale.item}</strong>
                            {(sale.projectName || sale.categoryName) && (
                              <span className={styles.itemProject}>
                                {sale.projectName || sale.categoryName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quantity & Unit Price */}
                        <td>
                          <div className={styles.qtyCell}>
                            <span>{sale.quantity} units</span>
                            <span className={styles.rateSub}>@ KES {Number(sale.unit_price || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td style={{ textAlign: 'right' }}>
                          <strong className={styles.totalAmountText}>
                            KES {totalAmt.toLocaleString()}
                          </strong>
                        </td>

                        {/* Payment Mode */}
                        <td>
                          <span className={styles.modeBadge}>
                            {sale.paymentMode ? sale.paymentMode.replace('_', ' ') : 'CASH'}
                          </span>
                        </td>

                        {/* Amount Paid vs Due */}
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.settleCell}>
                            <span className={styles.paidText}>Paid: KES {paidAmt.toLocaleString()}</span>
                            {dueAmt > 0 ? (
                              <span className={styles.dueText}>Due: KES {dueAmt.toLocaleString()}</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>
                          {isFullyPaid ? (
                            <span className={styles.statusPaidBadge}>
                              <FaCheckCircle className={styles.miniIcon} /> Paid
                            </span>
                          ) : status === 'CREDIT_UNPAID' ? (
                            <span className={styles.statusUnpaidBadge}>
                              <FaBan className={styles.miniIcon} /> Credit
                            </span>
                          ) : (
                            <span className={styles.statusPartialBadge}>
                              <FaExclamationTriangle className={styles.miniIcon} /> Due
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Page size 10) */}
            {salesTotalPages > 1 && (
              <div className={styles.paginationBar}>
                <span className={styles.paginationInfo}>
                  Showing {salesPage * SALES_PAGE_SIZE + 1}–
                  {Math.min((salesPage + 1) * SALES_PAGE_SIZE, salesTotalElements)} of {salesTotalElements}
                </span>
                <div className={styles.paginationButtons}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={handlePrevPage}
                    disabled={salesPage === 0}
                    title="Previous Page"
                  >
                    <FaChevronLeft /> Prev
                  </button>
                  <span className={styles.pageIndicator}>
                    {salesPage + 1} / {salesTotalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={handleNextPage}
                    disabled={salesPage >= salesTotalPages - 1}
                    title="Next Page"
                  >
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Record Payment */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaHandHoldingUsd /> Collect Debt Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}><FaTimes /></button>
            </div>
            <p className={styles.customerSubText}>
              Customer: <strong>{customer.name}</strong> | Outstanding: <strong className={styles.warningText}>KES {debt.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleRecordPayment} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Payment Amount (KES) *</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max={debt} 
                  placeholder="e.g. 15000" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetailsPage;
