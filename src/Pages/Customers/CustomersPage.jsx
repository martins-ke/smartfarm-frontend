import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CustomersPage.module.css';
import { getCustomers, createCustomer } from '../../APIs/customer';
import useAuth from '../../useAuth';
import { notify } from '../../utils/notify';
import { 
  FaUsers, 
  FaUserPlus, 
  FaTimes, 
  FaPhone, 
  FaIdCard, 
  FaMapMarkerAlt, 
  FaBan
} from 'react-icons/fa';
import { Spinner } from '../../Components/Spinner/Spinner';

export function CustomersPage() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Views
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customerForm, setCustomerForm] = useState({
    name: '',
    contact: '',
    id_number: '',
    address: '',
    credit_limit: '',
    category: 'Wholesaler / Bulk Buyer'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getCustomers();
      const cList = Array.isArray(list) ? list : [];
      setCustomers(cList);
    } catch (err) {
      notify('Failed to load customers data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetails = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const predefinedCategories = [
    'Wholesaler / Bulk Buyer',
    'Retailer / Local Shop',
    'Supermarket / Grocery',
    'Institution / Hotel / School',
    'Individual / Walk-in Buyer',
    'Broker / Offtaker',
    'General Produce Buyer'
  ];

  // Merge predefined with any existing custom categories
  const allCategories = Array.from(
    new Set([
      ...predefinedCategories,
      ...customers.map((c) => c.category).filter(Boolean)
    ])
  );

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.contact.trim()) {
      notify('Customer name and contact are required', 'error');
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategoryInput.trim() || 'General Produce Buyer'
      : customerForm.category;

    try {
      await createCustomer({
        name: customerForm.name.trim(),
        contact: customerForm.contact.trim(),
        id_number: customerForm.id_number ? customerForm.id_number.trim() : null,
        address: customerForm.address ? customerForm.address.trim() : null,
        credit_limit: customerForm.credit_limit ? Number(customerForm.credit_limit) : 0,
        category: finalCategory
      });
      notify('Customer registered successfully!', 'success');
      setShowAddCustomer(false);
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setCustomerForm({
        name: '',
        contact: '',
        id_number: '',
        address: '',
        credit_limit: '',
        category: 'Wholesaler / Bulk Buyer'
      });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to create customer', 'error');
    }
  };

  const totalDebtAll = customers.reduce((sum, c) => sum + Number(c.outstandingDebt || 0), 0);
  const totalPurchasesAll = customers.reduce((sum, c) => sum + Number(c.totalPurchases || 0), 0);
  const totalPaidAll = customers.reduce((sum, c) => sum + Number(c.totalPaid || 0), 0);

  if (loading) {
    return <Spinner fullPage label="Loading customers & Accounts Receivable ledger..." />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><FaUsers className={styles.titleIcon} /> Customer Accounts Receivable (AR)</h1>
          <p className={styles.subtitle}>Track wholesale & retail buyers, sales credit ledgers, debt recovery, and credit ceilings</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setIsCustomCategory(false); setShowAddCustomer(true); }}>
          <FaUserPlus /> Register Customer
        </button>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Outstanding Receivables (AR)</span>
          <span className={`${styles.metricVal} ${styles.warningText}`}>KES {totalDebtAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Debt owed to farm by customers</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Produce Sales Invoiced</span>
          <span className={styles.metricVal}>KES {totalPurchasesAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative customer purchases</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Remitted Payments</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {totalPaidAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Cash & M-Pesa collected</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Customers</span>
          <span className={styles.metricVal}>{customers.length}</span>
          <span className={styles.metricSub}>Registered produce buyers</span>
        </div>
      </div>

      {/* Mobile Responsive 4-Column Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Customer Directory & Credit Ledger</h2>
        </div>

        {customers.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUsers className={styles.emptyIcon} />
            <p>No customers registered yet.</p>
            <button className={styles.smallAddBtn} onClick={() => { setIsCustomCategory(false); setShowAddCustomer(true); }}>
              <FaUserPlus /> Register First Customer
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Customer / Buyer</th>
                  <th style={{ minWidth: '160px' }}>Category</th>
                  <th style={{ minWidth: '180px' }}>Contact</th>
                  <th style={{ minWidth: '130px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => {
                  const debt = Number(cust.outstandingDebt || 0);
                  const isBlocked = cust.creditStatus === 'BLOCKED';
                  return (
                    <tr key={cust.id} className={styles.tableRowClickable} onClick={() => handleOpenDetails(cust)}>
                      <td>
                        <div className={styles.custName}>{cust.name}</div>
                        {cust.id_number ? (
                          <div className={styles.custSubText}><FaIdCard className={styles.iconMini} /> ID: {cust.id_number}</div>
                        ) : cust.address ? (
                          <div className={styles.custSubText}><FaMapMarkerAlt className={styles.iconMini} /> {cust.address}</div>
                        ) : (
                          <div className={styles.custSubText}>Buyer ID: #{cust.id.slice(0, 6)}</div>
                        )}
                        <div className={styles.badgeRowMini}>
                          {debt > 0 ? (
                            <span className={styles.mobileDebtSummary}>KES {debt.toLocaleString()} Debt</span>
                          ) : (
                            <span className={styles.mobileClearedSummary}>Cleared ✅</span>
                          )}
                          {isBlocked && (
                            <span className={styles.mobileBlockedBadge}><FaBan size={9} /> BLOCKED</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.badgeCategory}>{cust.category || 'General Buyer'}</span>
                      </td>
                      <td>
                        {cust.contact ? (
                          <div className={styles.contactLine}>
                            <FaPhone className={styles.iconMini} /> 
                            <a href={`tel:${cust.contact}`} onClick={(e) => e.stopPropagation()} className={styles.contactLink}>
                              {cust.contact}
                            </a>
                          </div>
                        ) : null}
                        {cust.address && (
                          <div className={styles.custAddress}>
                            <FaMapMarkerAlt className={styles.iconMini} /> {cust.address}
                          </div>
                        )}
                        {!cust.contact && !cust.address && (
                          <span className={styles.noContactText}>No contact saved</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={styles.actionBtnDetails}
                          onClick={() => handleOpenDetails(cust)}
                          title="View full profile, credit ledger, and actions"
                        >
                          Actions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Customer */}
      {showAddCustomer && (
        <div className={styles.modalOverlay} onClick={() => setShowAddCustomer(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaUserPlus /> Register Produce Buyer / Customer</h3>
              <button className={styles.closeBtn} onClick={() => setShowAddCustomer(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Customer / Business Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Mama Mboga Wholesale / Peter Kinyua" 
                  value={customerForm.name} 
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Buyer Category</label>
                  {!isCustomCategory ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select 
                        style={{ flex: 1 }}
                        value={customerForm.category} 
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomCategory(true);
                            setCustomCategoryInput('');
                          } else {
                            setCustomerForm({ ...customerForm, category: e.target.value });
                          }
                        }}
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__CUSTOM__">➕ Enter New / Custom Category...</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="Type category (e.g. Cooperative Exporter)" 
                        value={customCategoryInput} 
                        onChange={(e) => setCustomCategoryInput(e.target.value)} 
                        autoFocus
                      />
                      <button 
                        type="button" 
                        className={styles.smallOutlineBtn}
                        onClick={() => setIsCustomCategory(false)}
                        title="Back to predefined categories"
                      >
                        Presets
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Phone / M-Pesa Contact *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 0722123456" 
                    value={customerForm.contact} 
                    onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>National ID / Business Reg</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 24891023" 
                    value={customerForm.id_number} 
                    onChange={(e) => setCustomerForm({ ...customerForm, id_number: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Credit Limit (KES)</label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="e.g. 50000 (0 for cash-only)" 
                    value={customerForm.credit_limit} 
                    onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Location / Delivery Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Wakulima Market Stall 45" 
                  value={customerForm.address} 
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddCustomer(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Register Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
