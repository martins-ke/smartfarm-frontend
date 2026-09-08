import { useState, useEffect, useRef, useMemo } from 'react';
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
  FaBan,
  FaSearch,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaCoins,
  FaFilter
} from 'react-icons/fa';
import { Spinner } from '../../Components/Spinner/Spinner';

const getInitials = (name) => {
  if (!name) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function CustomersPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'DEBT' | 'NO_DEBT' | category name

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
    } catch (_err) {
      setCustomers([]);
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

  // Metrics
  const totalDebtAll = customers.reduce((sum, c) => sum + Number(c.outstandingDebt || 0), 0);
  const totalPurchasesAll = customers.reduce((sum, c) => sum + Number(c.totalPurchases || 0), 0);
  const totalPaidAll = customers.reduce((sum, c) => sum + Number(c.totalPaid || 0), 0);
  const debtCustomersCount = customers.filter((c) => Number(c.outstandingDebt || 0) > 0).length;
  const noDebtCustomersCount = customers.filter((c) => Number(c.outstandingDebt || 0) <= 0).length;

  // Filtered & Searched Customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      // Search matching
      const matchesSearch = !q || (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.contact && c.contact.toLowerCase().includes(q)) ||
        (c.id_number && c.id_number.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
      );

      // Filter tab matching
      let matchesFilter = true;
      if (selectedFilter === 'DEBT') {
        matchesFilter = Number(c.outstandingDebt || 0) > 0;
      } else if (selectedFilter === 'NO_DEBT' || selectedFilter === 'CLEARED') {
        matchesFilter = Number(c.outstandingDebt || 0) <= 0;
      } else if (selectedFilter !== 'ALL') {
        matchesFilter = (c.category || 'General Produce Buyer').toLowerCase() === selectedFilter.toLowerCase();
      }

      return matchesSearch && matchesFilter;
    });
  }, [customers, searchQuery, selectedFilter]);

  if (loading) {
    return <Spinner fullPage label="Loading customer ledger..." />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><FaUsers className={styles.titleIcon} /> Customer Accounts Receivable (AR)</h1>
          <p className={styles.subtitle}>Track wholesale & retail buyers, credit ledgers, and payments</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setIsCustomCategory(false); setShowAddCustomer(true); }}>
          <FaUserPlus /> Register Customer
        </button>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Outstanding AR</span>
          <span className={`${styles.metricVal} ${styles.warningText}`}>KES {totalDebtAll.toLocaleString()}</span>
          <span className={styles.metricSub}>{debtCustomersCount} buyer{debtCustomersCount === 1 ? '' : 's'} with balance</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Produce Invoiced</span>
          <span className={styles.metricVal}>KES {totalPurchasesAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative sales</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Remitted Payments</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {totalPaidAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Cash & M-Pesa collected</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Customers</span>
          <span className={styles.metricVal}>{customers.length}</span>
          <span className={styles.metricSub}>Registered buyers</span>
        </div>
      </div>

      {/* Toolbar: Search & Filter Tabs */}
      <section className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search buyers by name, phone, ID, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
              }
            }}
          />
        </div>

        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'ALL' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('ALL')}
          >
            All <span className={styles.tabCount}>{customers.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${styles.tabDebt} ${selectedFilter === 'DEBT' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('DEBT')}
          >
            With Debt <span className={styles.tabCount}>{debtCustomersCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'NO_DEBT' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('NO_DEBT')}
          >
            No Debt <span className={styles.tabCount}>{noDebtCustomersCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'Wholesaler / Bulk Buyer' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('Wholesaler / Bulk Buyer')}
          >
            Wholesalers
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'Retailer / Local Shop' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('Retailer / Local Shop')}
          >
            Retailers
          </button>
        </div>
      </section>

      {/* Compact SaaS Customer Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderLeft}>
            <h2>Customer Directory & Credit Ledger</h2>
            <span className={styles.resultBadge}>
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
            </span>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUsers className={styles.emptyIcon} />
            <p>No customers registered yet.</p>
            <button className={styles.smallAddBtn} onClick={() => { setIsCustomCategory(false); setShowAddCustomer(true); }}>
              <FaUserPlus /> Register First Customer
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearch className={styles.emptyIcon} />
            <p>No customers matched your search & filter criteria.</p>
            <button 
              className={styles.smallOutlineBtn} 
              onClick={() => { setSearchQuery(''); setSelectedFilter('ALL'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer / Buyer</th>
                  <th>Category</th>
                  <th>Contact & Location</th>
                  <th>Credit Ceiling</th>
                  <th style={{ textAlign: 'right' }}>Outstanding AR Debt</th>
                  <th style={{ textAlign: 'center', width: '85px' }}>Ledger</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const debt = Number(cust.outstandingDebt || 0);
                  const creditLimit = Number(cust.creditLimit || cust.credit_limit || 0);
                  const isBlocked = cust.creditStatus === 'BLOCKED';
                  const initials = getInitials(cust.name);

                  return (
                    <tr 
                      key={cust.id} 
                      className={styles.tableRowClickable} 
                      onClick={() => handleOpenDetails(cust)}
                      title={`View ledger for ${cust.name}`}
                    >
                      {/* Customer Info */}
                      <td>
                        <div className={styles.custCell}>
                          <div className={styles.custAvatar}>
                            {initials}
                          </div>
                          <div className={styles.custDetails}>
                            <div className={styles.custName}>{cust.name}</div>
                            <div className={styles.custSubText}>
                              {cust.id_number ? (
                                <span><FaIdCard className={styles.iconMini} /> ID: {cust.id_number}</span>
                              ) : (
                                <span>Buyer #{cust.id ? cust.id.slice(0, 6).toUpperCase() : '---'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={styles.badgeCategory}>
                          {cust.category || 'General Buyer'}
                        </span>
                      </td>

                      {/* Contact & Location */}
                      <td>
                        <div className={styles.contactCell}>
                          {cust.contact ? (
                            <a 
                              href={`tel:${cust.contact}`} 
                              onClick={(e) => e.stopPropagation()} 
                              className={styles.contactPhone}
                              title="Call customer"
                            >
                              <FaPhone className={styles.iconMini} /> {cust.contact}
                            </a>
                          ) : (
                            <span className={styles.noContactText}>No phone</span>
                          )}
                          {cust.address && (
                            <div className={styles.contactAddress} title={cust.address}>
                              <FaMapMarkerAlt className={styles.iconMini} /> {cust.address}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Credit Ceiling & Status */}
                      <td>
                        <div className={styles.creditCell}>
                          <span className={styles.creditLimitText}>
                            {creditLimit > 0 ? `KES ${creditLimit.toLocaleString()}` : 'Cash Only'}
                          </span>
                          {isBlocked ? (
                            <span className={styles.statusBlockedBadge}>
                              <FaBan className={styles.iconMini} /> Blocked
                            </span>
                          ) : debt > 0 ? (
                            <span className={styles.statusDebtBadge}>
                              <FaExclamationTriangle className={styles.iconMini} /> Active Debt
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Outstanding Debt */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.debtCell}>
                          {debt > 0 ? (
                            <>
                              <span className={styles.debtAmountHigh}>
                                KES {debt.toLocaleString()}
                              </span>
                              <span className={styles.debtSub}>
                                Invoiced: KES {Number(cust.totalPurchases || 0).toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={styles.debtAmountZero}>
                                KES 0.00
                              </span>
                              <span className={styles.debtSubZero}>No Balance</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={styles.actionBtnDetails} 
                          onClick={() => handleOpenDetails(cust)}
                          title="Open full ledger"
                        >
                          View <FaArrowRight className={styles.actionArrow} />
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

      {/* Modal: Add Customer */}
      {showAddCustomer && (
        <div className={styles.modalOverlay} onClick={() => setShowAddCustomer(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaUserPlus /> Register New Customer</h3>
              <button className={styles.closeBtn} onClick={() => setShowAddCustomer(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Customer / Business Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Mama Mboga Supermarket / John Doe" 
                  value={customerForm.name} 
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone / M-Pesa Contact *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 0712345678" 
                    value={customerForm.contact} 
                    onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>National ID / Business Reg No.</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12345678" 
                    value={customerForm.id_number} 
                    onChange={(e) => setCustomerForm({ ...customerForm, id_number: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Customer Category</label>
                  {!isCustomCategory ? (
                    <select 
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
                      <option value="__CUSTOM__">+ Add Custom Category...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input 
                        type="text" 
                        placeholder="Enter custom category" 
                        value={customCategoryInput} 
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="button" 
                        className={styles.smallOutlineBtn} 
                        onClick={() => setIsCustomCategory(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Credit Ceiling Limit (KES)</label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="0 for Cash-Only" 
                    value={customerForm.credit_limit} 
                    onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Physical Address / Delivery Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Stall 44, Wakulima Market, Nairobi" 
                  value={customerForm.address} 
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddCustomer(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersPage;
