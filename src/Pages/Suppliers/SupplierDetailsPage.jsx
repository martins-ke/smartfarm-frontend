import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './SupplierDetailsPage.module.css';
import { 
  getSupplierById, 
  getSupplierPurchases, 
  recordSupplierPurchase, 
  recordSupplierPayment,
  getPurchasePaymentHistory 
} from '../../APIs/supplier';
import { getInventoryItems } from '../../APIs/inventory';
import { notify } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
import {
  FaTruck,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaBoxes,
  FaTimes,
  FaHistory,
  FaHandHoldingUsd
} from 'react-icons/fa';

function PurchaseHistoryModal({ purchase, supplier, onClose, onPayPurchase }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!purchase?.id) return;
    let isMounted = true;
    setLoading(true);
    getPurchasePaymentHistory(supplier?.id, purchase.id)
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
  }, [purchase?.id, supplier?.id]);

  const totalBilled = Number(purchase.invoiceAmount || 0);
  const totalPaid = Number(purchase.amountPaid || 0);
  const balanceDue = Number(purchase.balanceDue || (totalBilled - totalPaid));
  const isFullyPaid = balanceDue <= 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.auditModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3><FaHistory /> Purchase Payment & Settlement Audit</h3>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>

        <p className={styles.supplierSubText}>
          Supplier: <strong>{supplier?.name}</strong> | Invoice: <strong>{purchase.invoiceNumber || 'INV-Auto'}</strong> (#{purchase.id?.slice(0, 8).toUpperCase()})
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
            <span className={styles.auditMetaLabel}>Balance Due (AP)</span>
            <span className={`${styles.auditMetaVal} ${balanceDue > 0 ? styles.dangerText : styles.successText}`}>
              KES {balanceDue.toLocaleString()}
            </span>
          </div>
          <div className={styles.auditMetaCard}>
            <span className={styles.auditMetaLabel}>Status</span>
            <span className={isFullyPaid ? styles.clearBadge : styles.debtBadge}>
              {isFullyPaid ? 'PAID IN FULL' : 'OUTSTANDING DEBT'}
            </span>
          </div>
        </div>

        {/* Installment History Table */}
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text, #edf6ff)' }}>
          Payment & Settlement Breakdown
        </h4>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Spinner label="Loading payment audit logs..." />
          </div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyAudit}>
            <p>No separate payment records logged yet for this invoice.</p>
            {balanceDue > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>This balance can be settled using the button below.</p>
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
                  <th style={{ textAlign: 'right' }}>Amount Remitted</th>
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
                onPayPurchase(purchase);
              }}
            >
              <FaHandHoldingUsd /> Settle This Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SupplierDetailsPage() {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Selected Purchase for Payment History Audit Modal
  const [selectedPurchaseForHistory, setSelectedPurchaseForHistory] = useState(null);

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    invoiceNumber: '',
    invoiceAmount: '',
    amountPaid: '',
    inventoryItemId: '',
    restockQuantity: '',
    notes: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetPurchaseForPayment, setTargetPurchaseForPayment] = useState(null);
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
      const [supRes, purRes, invRes] = await Promise.all([
        getSupplierById(supplierId),
        getSupplierPurchases(supplierId),
        getInventoryItems(0, 1000).catch(() => ({ body: [] }))
      ]);
      setSupplier(supRes);
      setPurchases(Array.isArray(purRes) ? purRes : []);
      const invBody = invRes?.body || invRes;
      const items = Array.isArray(invBody?.content) ? invBody.content : (Array.isArray(invBody) ? invBody : []);
      setInventoryItems(items);
    } catch (err) {
      setLoadError(err);
      notify(err.message || 'Failed to load supplier details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supplierId) {
      loadData();
    }
  }, [supplierId]);

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    const invAmt = Number(purchaseForm.invoiceAmount);
    if (!purchaseForm.invoiceAmount || isNaN(invAmt) || invAmt <= 0) {
      notify('Total invoice amount must be provided and greater than zero', 'error');
      return;
    }

    const paidAmt = Number(purchaseForm.amountPaid !== '' ? purchaseForm.amountPaid : 0);
    if (isNaN(paidAmt) || paidAmt < 0) {
      notify('Amount paid now cannot be negative', 'error');
      return;
    }

    if (paidAmt > invAmt) {
      notify('Amount paid now cannot exceed the total invoice amount', 'error');
      return;
    }

    if (!purchaseForm.notes || !purchaseForm.notes.trim()) {
      notify('Delivery notes / items description must be provided for clarity', 'error');
      return;
    }

    try {
      await recordSupplierPurchase({
        supplierId: supplier.id,
        invoiceNumber: purchaseForm.invoiceNumber?.trim() || null,
        invoiceAmount: invAmt,
        amountPaid: paidAmt,
        inventoryItemId: purchaseForm.inventoryItemId || null,
        restockQuantity: purchaseForm.restockQuantity ? Number(purchaseForm.restockQuantity) : null,
        notes: purchaseForm.notes.trim()
      });
      notify('Purchase invoice recorded & Accounts Payable updated ✅', 'success');
      setShowPurchaseModal(false);
      setPurchaseForm({
        invoiceNumber: '',
        invoiceAmount: '',
        amountPaid: '',
        inventoryItemId: '',
        restockQuantity: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to record purchase', 'error');
    }
  };

  const openPayModalForPurchase = (purchase) => {
    setTargetPurchaseForPayment(purchase);
    setPaymentForm({
      amount: String(purchase.balanceDue || ''),
      paymentMode: 'MPESA',
      referenceNumber: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const payAmt = Number(paymentForm.amount);
    const maxPayable = targetPurchaseForPayment 
      ? Number(targetPurchaseForPayment.balanceDue || 0) 
      : debt;

    if (!paymentForm.amount || isNaN(payAmt) || payAmt <= 0) {
      notify('Please enter a valid payment amount greater than zero', 'error');
      return;
    }

    if (maxPayable > 0 && payAmt > maxPayable) {
      notify(`Payment amount cannot exceed the outstanding balance of KES ${maxPayable.toLocaleString()}`, 'error');
      return;
    }

    try {
      await recordSupplierPayment(supplier.id, {
        amount: payAmt,
        paymentMode: paymentForm.paymentMode,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
        purchaseId: targetPurchaseForPayment ? targetPurchaseForPayment.id : null
      });
      notify('Supplier payment voucher recorded successfully!', 'success');
      setShowPaymentModal(false);
      setTargetPurchaseForPayment(null);
      setPaymentForm({
        amount: '',
        paymentMode: 'MPESA',
        referenceNumber: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to record payment', 'error');
    }
  };

  if (loading) {
    return <Spinner fullPage label="Loading supplier profile & ledger..." />;
  }

  if (!supplier) {
    return (
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink} onClick={() => navigate('/suppliers')}>Suppliers</span> / <strong>Not Found</strong>
        </div>
        <ErrorState
          error={loadError || 'Supplier not found or has been removed.'}
          title="Supplier Unavailable"
          onRetry={loadData}
          variant="card"
        />
      </div>
    );
  }

  const debt = Number(supplier.balanceOwed || 0);

  return (
    <div className={styles.container}>
      {/* Top Breadcrumbs */}
      <div className={styles.navRow}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink} onClick={() => navigate('/suppliers')}>Suppliers</span> / <strong>{supplier.name}</strong>
        </div>
      </div>

      {/* Main Profile Header */}
      <div className={styles.profileHeaderCard}>
        <div className={styles.headerLeft}>
          <div className={styles.vendorAvatar}>
            <FaTruck />
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.supplierTitle}>{supplier.name}</h1>
            <div>
              <span className={styles.badgeCategory}>{supplier.category || 'General Farm Inputs'}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.actionBtnInvoice} onClick={() => setShowPurchaseModal(true)}>
            <FaFileInvoiceDollar /> Record Invoice
          </button>
          {debt > 0 && (
            <button 
              className={styles.actionBtnPay} 
              onClick={() => {
                setTargetPurchaseForPayment(null);
                setPaymentForm({
                  amount: '',
                  paymentMode: 'MPESA',
                  referenceNumber: '',
                  notes: ''
                });
                setShowPaymentModal(true);
              }}
            >
              <FaMoneyCheckAlt /> Settle Debt
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Purchases Billed</span>
          <span className={styles.metricVal}>KES {Number(supplier.totalBilled || 0).toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative purchases</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Payments Remitted</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {Number(supplier.totalPaid || 0).toLocaleString()}</span>
          <span className={styles.metricSub}>Cleared vendor vouchers</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Current Debt Balance (AP)</span>
          <span className={`${styles.metricVal} ${debt > 0 ? styles.dangerText : styles.successText}`}>
            KES {debt.toLocaleString()}
          </span>
          <span className={styles.metricSub}>{debt > 0 ? 'Outstanding liability' : 'All invoices cleared'}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Invoices Recorded</span>
          <span className={styles.metricVal}>{purchases.length}</span>
          <span className={styles.metricSub}>Delivery purchase orders</span>
        </div>
      </div>

      {/* Two Column Layout: Profile & AP Ledger */}
      <div className={styles.detailsGrid}>
        <div className={styles.detailsCard}>
          <h3>Vendor & Contact Information</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Company / Trader:</span>
            <strong className={styles.infoValue}>{supplier.name}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Contact Person:</span>
            <span className={styles.infoValue}>{supplier.contactPerson || '-'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Supply Category:</span>
            <span className={styles.infoValue}>{supplier.category || 'General'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phone Number:</span>
            <span className={styles.infoValue}>
              {supplier.phoneNumber ? (
                <a href={`tel:${supplier.phoneNumber}`} className={styles.contactLink}>
                  <FaPhone className={styles.iconMini} /> {supplier.phoneNumber}
                </a>
              ) : '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email Address:</span>
            <span className={styles.infoValue}>
              {supplier.email ? (
                <a href={`mailto:${supplier.email}`} className={styles.contactLink}>
                  <FaEnvelope className={styles.iconMini} /> {supplier.email}
                </a>
              ) : '-'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>KRA PIN / Tax ID:</span>
            <strong className={styles.infoValue}>{supplier.idOrTaxNumber || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Physical Depot:</span>
            <span className={styles.infoValue}>{supplier.address || '-'}</span>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <h3>Accounts Payable (AP) Ledger</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cumulative Invoices Billed:</span>
            <strong className={styles.infoValue}>KES {Number(supplier.totalBilled || 0).toLocaleString()}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cumulative Payments Settled:</span>
            <strong className={`${styles.infoValue} ${styles.successText}`}>KES {Number(supplier.totalPaid || 0).toLocaleString()}</strong>
          </div>
          <div className={`${styles.infoRow} ${styles.infoRowHighlight}`}>
            <span className={styles.infoLabel}>Current Outstanding Debt:</span>
            <strong className={`${styles.infoValue} ${debt > 0 ? styles.dangerText : styles.successText}`}>
              KES {debt.toLocaleString()}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Account Status:</span>
            <span className={styles.infoValue}>
              <span className={debt > 0 ? styles.debtBadge : styles.clearBadge}>
                {debt > 0 ? 'LIABILITY OWED' : 'CLEARED & GOOD STANDING ✅'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2><FaHistory /> Purchase Invoices & Order Audit Trail</h2>
          <span className={styles.historyCount}>{purchases.length} Records</span>
        </div>

        {purchases.length === 0 ? (
          <div className={styles.emptyState}>
            <FaFileInvoiceDollar className={styles.emptyIcon} />
            <p>No purchase invoices recorded for this supplier yet.</p>
            <button className={styles.smallAddBtn} onClick={() => setShowPurchaseModal(true)}>
              <FaFileInvoiceDollar /> Record First Invoice
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Billed Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'center' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.invoiceNumber || 'INV-Auto'}</strong></td>
                    <td>{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : 'Recent'}</td>
                    <td>KES {Number(p.invoiceAmount || 0).toLocaleString()}</td>
                    <td className={styles.paidCell}>KES {Number(p.amountPaid || 0).toLocaleString()}</td>
                    <td className={Number(p.balanceDue || 0) > 0 ? styles.dangerText : styles.successText}>
                      KES {Number(p.balanceDue || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={p.paymentStatus === 'PAID' ? styles.clearBadge : styles.debtBadge}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className={styles.notesCell}>{p.notes || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button"
                        className={styles.historyBtn}
                        onClick={() => setSelectedPurchaseForHistory(p)}
                        title="View chronological payments & settlement audit logs"
                      >
                        <FaHistory /> Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit History Modal */}
      {selectedPurchaseForHistory && (
        <PurchaseHistoryModal
          purchase={selectedPurchaseForHistory}
          supplier={supplier}
          onClose={() => setSelectedPurchaseForHistory(null)}
          onPayPurchase={(pur) => openPayModalForPurchase(pur)}
        />
      )}

      {/* Modal: Record Purchase Invoice */}
      {showPurchaseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPurchaseModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaFileInvoiceDollar /> Record Purchase Invoice</h3>
              <button className={styles.closeBtn} onClick={() => setShowPurchaseModal(false)}><FaTimes /></button>
            </div>
            <p className={styles.supplierSubText}>Supplier: <strong>{supplier.name}</strong> ({supplier.category || 'General'})</p>
            <form onSubmit={handleRecordPurchase} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Invoice / Receipt Number <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>(Optional)</span></label>
                  <input 
                    type="text" 
                    placeholder="Optional (e.g. INV-8842)" 
                    value={purchaseForm.invoiceNumber} 
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Total Invoice Amount (KES) *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    placeholder="e.g. 50000" 
                    value={purchaseForm.invoiceAmount} 
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceAmount: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <div className={styles.labelRowWithAction}>
                    <label>Amount Paid Now (KES) *</label>
                    <button 
                      type="button" 
                      className={styles.fullDebtBtn}
                      onClick={() => setPurchaseForm(prev => ({ ...prev, amountPaid: '0' }))}
                      title="Set Amount Paid to 0 (Take on Full Debt / Credit)"
                    >
                      💳 Full Debt
                    </button>
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="0 for full debt" 
                    value={purchaseForm.amountPaid} 
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, amountPaid: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Remaining Debt Balance (AP)</label>
                  <input 
                    type="text" 
                    disabled 
                    value={`KES ${Math.max(0, (Number(purchaseForm.invoiceAmount || 0) - Number(purchaseForm.amountPaid || 0))).toLocaleString()}`}
                    className={styles.readOnlyInput}
                  />
                </div>
              </div>

              {/* Warehouse Inventory Restock Link */}
              <div className={styles.restockBox}>
                <div className={styles.restockHeader}><FaBoxes /> Optional: Auto-Restock Inventory</div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Link to Inventory Item</label>
                    <select 
                      value={purchaseForm.inventoryItemId} 
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, inventoryItemId: e.target.value })}
                    >
                      <option value="">-- Do not restock warehouse --</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (In Stock: {item.quantityInStock || 0} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  {purchaseForm.inventoryItemId && (
                    <div className={styles.formGroup}>
                      <label>Restock Quantity Added</label>
                      <input 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 20 bags" 
                        value={purchaseForm.restockQuantity} 
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, restockQuantity: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Delivery Notes / Items Description *</label>
                <textarea 
                  rows={2} 
                  required
                  placeholder="e.g. Delivered 20 bags of DAP fertilizer and 5 rolls of drip tape to Main Store" 
                  value={purchaseForm.notes} 
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Save Purchase & Update AP</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Settle Debt Payment */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowPaymentModal(false); setTargetPurchaseForPayment(null); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaMoneyCheckAlt /> Settle Supplier Debt</h3>
              <button className={styles.closeBtn} onClick={() => { setShowPaymentModal(false); setTargetPurchaseForPayment(null); }}><FaTimes /></button>
            </div>
            <p className={styles.supplierSubText}>
              Supplier: <strong>{supplier.name}</strong> |{' '}
              {targetPurchaseForPayment ? (
                <>Invoice <strong>{targetPurchaseForPayment.invoiceNumber || 'INV-Auto'}</strong> | Due: <strong className={styles.dangerText}>KES {Number(targetPurchaseForPayment.balanceDue || 0).toLocaleString()}</strong></>
              ) : (
                <>Outstanding Total Debt: <strong className={styles.dangerText}>KES {debt.toLocaleString()}</strong></>
              )}
            </p>
            <form onSubmit={handleRecordPayment} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Payment Amount (KES) *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max={targetPurchaseForPayment ? Number(targetPurchaseForPayment.balanceDue || 0) : debt} 
                    placeholder="e.g. 25000" 
                    value={paymentForm.amount} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Payment Mode</label>
                  <select 
                    value={paymentForm.paymentMode} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  >
                    <option value="MPESA">M-Pesa</option>
                    <option value="BANK_TRANSFER">Bank Transfer / EFT</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Reference / Transaction Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. QKH87329K1 / Cheque #1029" 
                  value={paymentForm.referenceNumber} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Voucher Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Installment 1 of 3 cleared" 
                  value={paymentForm.notes} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setShowPaymentModal(false); setTargetPurchaseForPayment(null); }}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Record Payment Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierDetailsPage;
