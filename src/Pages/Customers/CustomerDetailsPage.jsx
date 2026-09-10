import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './CustomerDetailsPage.module.css';
import { getCustomerById, recordCustomerPayment, getCustomerSales, getSalePaymentHistory } from '../../APIs/customer';
import { notify } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
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
  FaMoneyBillWave,
  FaFileInvoiceDollar
} from 'react-icons/fa';

function SaleHistoryModal({ sale, customer, onClose, onPaySale }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sale?.id) return;
    let isMounted = true;
    setLoading(true);
    getSalePaymentHistory(customer?.id, sale.id)
      .then((res) => {
        if (isMounted) setPayments(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (isMounted) setPayments([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [sale?.id, customer?.id]);

  const totalBilled = Number(sale.total_amount || 0);
  const totalPaid = Number(sale.amountPaid || (sale.amount_paid !== undefined ? sale.amount_paid : totalBilled));
  const balanceDue = Number(sale.balanceDue || (totalBilled - totalPaid));
  const isFullyPaid = balanceDue <= 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.auditModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3><FaHistory /> Sale Payment & Installment Audit</h3>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>

        <p className={styles.customerSubText}>
          Customer: <strong>{customer?.name}</strong> | Item: <strong>{sale.item}</strong> (#{sale.id?.slice(0, 8).toUpperCase()})
        </p>

        {/* Overview Metric Grid */}
        <div className={styles.auditOverviewGrid}>
          <div className={styles.auditMetaCard}>
            <span className={styles.auditMetaLabel}>Total Invoice</span>
            <span className={styles.auditMetaVal}>KES {totalBilled.toLocaleString()}</span>
          </div>
          <div className={styles.auditMetaCard}>
            <span className={styles.auditMetaLabel}>Total Paid</span>
            <span className={`${styles.auditMetaVal} ${styles.successText}`}>KES {totalPaid.toLocaleString()}</span>
          </div>
          <div className={styles.auditMetaCard}>
            <span className={styles.auditMetaLabel}>Balance Due</span>
            <span className={`${styles.auditMetaVal} ${balanceDue > 0 ? styles.warningText : styles.successText}`}>
              KES {balanceDue.toLocaleString()}
            </span>
          </div>
          <div className={styles.auditMetaCard}>
            <span className={styles.auditMetaLabel}>Status</span>
            <span className={isFullyPaid ? styles.statusPaidBadge : styles.statusPartialBadge}>
              {isFullyPaid ? 'PAID IN FULL' : 'ACTIVE DEBT'}
            </span>
          </div>
        </div>

        {/* Installment History Table */}
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text, #edf6ff)' }}>
          Installment Payment Breakdown
        </h4>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Spinner label="Loading payment audit logs..." />
          </div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyAudit}>
            <p>No separate installment payments logged yet for this sale.</p>
            {balanceDue > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>This balance can be paid in installments using the button below.</p>
            )}
          </div>
        ) : (
          <div className={styles.auditHistoryWrapper}>
            <table className={styles.auditTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ textAlign: 'right' }}>Balance After</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.paymentDate || 'Recent'}</td>
                    <td>
                      <span className={styles.modeBadge}>{p.paymentMode || 'CASH'}</span>
                    </td>
                    <td><strong>{p.referenceNumber || '—'}</strong></td>
                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                      KES {Number(p.amount || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', color: '#94a3b8' }}>
                      KES {Number(p.balanceAfter || 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.modalActions} style={{ justifyContent: 'space-between' }}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Close</button>
          {!isFullyPaid && (
            <button 
              type="button" 
              className={styles.payActionBtn}
              onClick={() => {
                onClose();
                onPaySale(sale);
              }}
            >
              <FaHandHoldingUsd /> Pay Towards This Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Paginated Purchase History State (Page size 10, latest first)
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(0);
  const [salesTotalPages, setSalesTotalPages] = useState(0);
  const [salesTotalElements, setSalesTotalElements] = useState(0);
  const SALES_PAGE_SIZE = 10;

  // Selected Sale for Payment History Audit Modal
  const [selectedSaleForHistory, setSelectedSaleForHistory] = useState(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetSaleForPayment, setTargetSaleForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'MPESA',
    referenceNumber: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getCustomerById(customerId);
      setCustomer(res);
    } catch (err) {
      setLoadError(err);
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

  const handleOpenPaymentModal = (sale = null) => {
    setTargetSaleForPayment(sale);
    const maxDue = sale ? Number(sale.balanceDue || (sale.total_amount - (sale.amountPaid || 0))) : Number(customer?.outstandingDebt || 0);
    setPaymentForm({
      amount: maxDue > 0 ? String(maxDue) : '',
      paymentMode: 'MPESA',
      referenceNumber: '',
      notes: sale ? `Installment payment for ${sale.item}` : 'General debt settlement'
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(paymentForm.amount);
    if (!paymentForm.amount || amt <= 0) {
      notify('Please enter a valid payment amount', 'error');
      return;
    }
    try {
      await recordCustomerPayment(customer.id, {
        amount: amt,
        paymentMode: paymentForm.paymentMode,
        referenceNumber: paymentForm.referenceNumber,
        saleId: targetSaleForPayment?.id || null,
        notes: paymentForm.notes
      });
      notify('Payment recorded successfully ✅', 'success');
      setShowPaymentModal(false);
      setTargetSaleForPayment(null);
      setPaymentForm({ amount: '', paymentMode: 'MPESA', referenceNumber: '', notes: '' });
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
        <ErrorState
          error={loadError || 'Customer not found or has been removed.'}
          title="Customer Unavailable"
          onRetry={loadData}
          variant="card"
        />
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
            <button className={styles.actionBtnCollect} onClick={() => handleOpenPaymentModal(null)}>
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
                background: debt >= creditLimit ? '#ef4444' : debt > creditLimit * 0.75 ? '#f59e0b' : '#10b981'
              }} 
            />
          </div>
        </div>
      )}

      {/* Two-Column Details Grid */}
      <div className={styles.detailsGrid}>
        {/* Contact & KYC Info */}
        <div className={styles.detailsCard}>
          <h3>Account Information & KYC</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Primary Phone:</span>
            <span className={styles.infoValue}>
              {customer.contact ? (
                <a href={`tel:${customer.contact}`} className={styles.contactLink}>
                  <FaPhone className={styles.iconMini} /> {customer.contact}
                </a>
              ) : '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>National ID / Passport:</span>
            <strong className={styles.infoValue}>
              <FaIdCard className={styles.iconMini} /> {customer.idNumber || customer.id_number || '-'}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Delivery Address:</span>
            <span className={styles.infoValue}>
              <FaMapMarkerAlt className={styles.iconMini} /> {customer.address || '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Customer Category:</span>
            <span className={styles.infoValue}>{customer.category || 'General Produce Buyer'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Account Status:</span>
            <span className={styles.infoValue}>
              <span className={customer.isActive !== false ? styles.activeBadge : styles.inactiveBadge}>
                {customer.isActive !== false ? 'Active & Approved' : 'Inactive'}
              </span>
            </span>
          </div>
        </div>

        {/* Credit Rules & Terms */}
        <div className={styles.detailsCard}>
          <h3>Credit Policy & Rules</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Credit Allowed:</span>
            <strong className={styles.infoValue}>{creditLimit > 0 ? `Yes (Up to KES ${creditLimit.toLocaleString()})` : 'No (Strict Cash & Carry)'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Standing Risk:</span>
            <span className={styles.infoValue}>
              {isBlocked ? (
                <span className={styles.blockedBadge}>Blocked from Credit</span>
              ) : debt > 0 ? (
                <span className={styles.hasDebtBadge}>Pending Settlement</span>
              ) : (
                <span className={styles.clearedBadge}>Clean & Zero Balance</span>
              )}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Settlement Term:</span>
            <span className={styles.infoValue}>Net 14 Days</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Customer ID:</span>
            <span className={styles.infoValue} style={{ fontFamily: 'monospace' }}>{customer.id}</span>
          </div>
        </div>
      </div>

      {/* Purchases & Invoices Ledger Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderLeft}>
            <h2>
              <FaShoppingBag /> Produce Invoices & Sales Ledger
            </h2>
            <span className={styles.historyCount}>{salesTotalElements} Recorded Sales</span>
          </div>
        </div>

        {salesLoading ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <Spinner label="Loading purchase history..." />
          </div>
        ) : sales.length === 0 ? (
          <div className={styles.emptyState}>
            <FaShoppingBag className={styles.emptyIcon} />
            <p>No purchase records found for this customer.</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '105px' }}>Date & Ref</th>
                    <th>Produce Item</th>
                    <th>Qty & Rate</th>
                    <th style={{ textAlign: 'right' }}>Total Billed</th>
                    <th>Mode</th>
                    <th style={{ textAlign: 'right' }}>Paid / Due</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const totalAmt = Number(sale.total_amount || 0);
                    const paidAmt = Number(sale.amountPaid !== undefined ? sale.amountPaid : (sale.amount_paid !== undefined ? sale.amount_paid : totalAmt));
                    const dueAmt = Number(sale.balanceDue !== undefined ? sale.balanceDue : (totalAmt - paidAmt));
                    const isFullyPaid = dueAmt <= 0;
                    const status = sale.paymentStatus || (isFullyPaid ? 'PAID_IN_FULL' : paidAmt > 0 ? 'PARTIAL_PAYMENT' : 'CREDIT_UNPAID');

                    return (
                      <tr key={sale.id}>
                        {/* Date & Ref */}
                        <td>
                          <div className={styles.dateCell}>
                            <span className={styles.dateMain}>
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

                        {/* Audit / History Button */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.historyBtn}
                            onClick={() => setSelectedSaleForHistory(sale)}
                            title="View Installment Payment History"
                          >
                            <FaHistory /> Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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

      {/* Modal: Sale Payment History Audit */}
      {selectedSaleForHistory && (
        <SaleHistoryModal
          sale={selectedSaleForHistory}
          customer={customer}
          onClose={() => setSelectedSaleForHistory(null)}
          onPaySale={(sale) => handleOpenPaymentModal(sale)}
        />
      )}

      {/* Modal: Record Payment */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaHandHoldingUsd /> Collect Debt Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}><FaTimes /></button>
            </div>
            <p className={styles.customerSubText}>
              Customer: <strong>{customer.name}</strong> | Total Debt: <strong className={styles.warningText}>KES {debt.toLocaleString()}</strong>
              {targetSaleForPayment && (
                <span style={{ display: 'block', marginTop: '0.25rem', color: '#38bdf8' }}>
                  Target Invoice: #{targetSaleForPayment.id?.slice(0, 8).toUpperCase()} ({targetSaleForPayment.item})
                </span>
              )}
            </p>
            <form onSubmit={handleRecordPayment} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Payment Amount (KES) *</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max={targetSaleForPayment ? Number(targetSaleForPayment.balanceDue || debt) : debt} 
                  placeholder="e.g. 15000" 
                  value={paymentForm.amount} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                <label>Payment Mode *</label>
                <select 
                  value={paymentForm.paymentMode} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#edf6ff' }}
                >
                  <option value="MPESA">M-Pesa (Mobile Money)</option>
                  <option value="CASH">Cash (Farm-Gate Handover)</option>
                  <option value="BANK_TRANSFER">Bank Transfer / EFT / Cheque</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                <label>Reference / Transaction Code <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(Optional)</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. QKJ8819201" 
                  value={paymentForm.referenceNumber} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                <label>Notes / Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. Installment 1 of 3" 
                  value={paymentForm.notes} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className={styles.modalActions} style={{ marginTop: '1.25rem' }}>
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
