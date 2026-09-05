import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './CustomerDetailsPage.module.css';
import { getCustomerById, recordCustomerPayment } from '../../APIs/customer';
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
  FaChartLine
} from 'react-icons/fa';

export function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      notify('Please enter a valid payment amount', 'error');
      return;
    }
    try {
      await recordCustomerPayment(customer.id, Number(paymentAmount));
      notify('Customer debt payment recorded successfully!', 'success');
      setShowPaymentModal(false);
      setPaymentAmount('');
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to record customer payment', 'error');
    }
  };

  if (loading) {
    return <Spinner fullPage label="Loading customer profile & credit ledger..." />;
  }

  if (!customer) {
    return (
      <div className={styles.container}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink} onClick={() => navigate('/customers')}>Customers</span> / <strong>Not Found</strong>
        </div>
        <p style={{ marginTop: '2rem', color: '#94a3b8' }}>Customer not found or has been removed.</p>
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
              {isBlocked && (
                <span className={styles.statusBlocked}><FaBan /> CREDIT BLOCKED</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {debt > 0 && (
            <button className={styles.actionBtnCollect} onClick={() => setShowPaymentModal(true)}>
              <FaHandHoldingUsd /> Collect Debt Payment
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Produce Purchased</span>
          <span className={styles.metricVal}>KES {Number(customer.totalPurchases || 0).toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative invoiced sales</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Payments Remitted</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {Number(customer.totalPaid || 0).toLocaleString()}</span>
          <span className={styles.metricSub}>Collected cash & M-Pesa</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Current Outstanding Debt (AR)</span>
          <span className={`${styles.metricVal} ${debt > 0 ? styles.warningText : styles.successText}`}>
            KES {debt.toLocaleString()}
          </span>
          <span className={styles.metricSub}>{debt > 0 ? 'Receivable liability' : 'Account in good standing'}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Assigned Credit Limit</span>
          <span className={styles.metricVal}>KES {creditLimit.toLocaleString()}</span>
          <span className={styles.metricSub}>{creditLimit > 0 ? `Max allowed credit line` : 'Cash-only transactions'}</span>
        </div>
      </div>

      {/* Credit Utilization Progress Bar */}
      {creditLimit > 0 && (
        <div className={styles.creditHealthCard}>
          <div className={styles.creditHealthHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#f8fafc' }}>
              <FaChartLine /> Credit Ceiling Utilization
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
            <span className={styles.infoLabel}>Buyer Category:</span>
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
            <span className={styles.infoLabel}>National ID / Business Reg:</span>
            <strong className={styles.infoValue}>{customer.id_number || '-'}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Delivery Location:</span>
            <span className={styles.infoValue}>{customer.address || '-'}</span>
          </div>
        </div>

        <div className={styles.detailsCard}>
          <h3>Accounts Receivable (AR) Ledger</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cumulative Invoiced Sales:</span>
            <strong className={styles.infoValue}>KES {Number(customer.totalPurchases || 0).toLocaleString()}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Cumulative Payments Settled:</span>
            <strong className={`${styles.infoValue} ${styles.successText}`}>KES {Number(customer.totalPaid || 0).toLocaleString()}</strong>
          </div>
          <div className={`${styles.infoRow} ${styles.infoRowHighlight}`}>
            <span className={styles.infoLabel}>Current Debt Balance:</span>
            <strong className={`${styles.infoValue} ${debt > 0 ? styles.warningText : styles.successText}`}>
              KES {debt.toLocaleString()}
            </strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Assigned Credit Line:</span>
            <strong className={styles.infoValue}>KES {creditLimit.toLocaleString()}</strong>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Credit Health Status:</span>
            <span className={styles.infoValue}>
              {isBlocked ? (
                <span className={styles.statusBlocked}><FaBan /> CREDIT BLOCKED</span>
              ) : debt > 0 ? (
                <span className={styles.statusDebt}><FaExclamationTriangle /> HAS DEBT</span>
              ) : (
                <span className={styles.statusClear}><FaCheckCircle /> CLEAR & ACTIVE</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Modal: Record Customer Debt Payment */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaHandHoldingUsd /> Collect Customer Debt Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}><FaTimes /></button>
            </div>
            <p className={styles.customerSubText}>
              Customer: <strong>{customer.name}</strong> | Outstanding Debt: <strong className={styles.warningText}>KES {debt.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleRecordPayment} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Remitted Payment Amount (KES) *</label>
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
                <button type="submit" className={styles.submitBtn}>Record Payment & Update AR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetailsPage;
