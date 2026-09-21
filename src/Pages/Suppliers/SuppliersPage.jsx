import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SuppliersPage.module.css';
import { 
  getSuppliers, 
  createSupplier,
  deleteSupplier
} from '../../APIs/supplier';
import useAuth from '../../useAuth';
import { notify, confirmModal, alertModal } from '../../utils/notify';
import { 
  FaTruck, 
  FaPlus, 
  FaTimes, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaIdCard, 
  FaSearch, 
  FaArrowRight, 
  FaFilter,
  FaTrash
} from 'react-icons/fa';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';

const getInitials = (name) => {
  if (!name) return 'SU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function SuppliersPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'DEBT' | 'NO_DEBT' | category name

  // Modals & Views
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    idOrTaxNumber: '',
    category: 'Fertilizer & Chemicals',
    address: ''
  });

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const supList = await getSuppliers();
      setSuppliers(Array.isArray(supList) ? supList : []);
    } catch (err) {
      setLoadError(err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetails = (supplier) => {
    navigate(`/suppliers/${supplier.id}`);
  };

  const predefinedCategories = [
    'Fertilizer & Chemicals',
    'Animal Feeds',
    'Seeds & Seedlings',
    'Tools & Machinery',
    'Veterinary Supplies',
    'Irrigation & Piping',
    'Packaging & Crates',
    'Fuel & Energy',
    'General Farm Inputs'
  ];

  // Merge predefined with any existing custom categories in the system
  const allCategories = Array.from(
    new Set([
      ...predefinedCategories,
      ...suppliers.map((s) => s.category).filter(Boolean)
    ])
  );

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      notify('Supplier name is required', 'error');
      return;
    }

    const finalCategory = isCustomCategory 
      ? customCategoryInput.trim() || 'General Farm Inputs' 
      : supplierForm.category;

    try {
      await createSupplier({
        ...supplierForm,
        category: finalCategory
      });
      notify('Supplier registered successfully!', 'success');
      setShowAddSupplier(false);
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setSupplierForm({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        idOrTaxNumber: '',
        category: 'Fertilizer & Chemicals',
        address: ''
      });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to register supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (sup, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmModal({
      title: 'Delete Supplier',
      message: `Are you sure you want to delete supplier "${sup.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteSupplier(sup.id);
      notify(`Supplier "${sup.name}" deleted successfully ✅`, 'success');
      loadData();
    } catch (err) {
      alertModal(err?.message || 'Failed to delete supplier', 'error');
    }
  };

  // Metrics
  const totalOwedAll = suppliers.reduce((sum, s) => sum + Number(s.balanceOwed || s.outstandingDebt || 0), 0);
  const totalBilledAll = suppliers.reduce((sum, s) => sum + Number(s.totalBilled || s.total_billed || 0), 0);
  const totalPaidAll = suppliers.reduce((sum, s) => sum + Number(s.totalPaid || s.total_paid || 0), 0);
  const debtSuppliersCount = suppliers.filter((s) => Number(s.balanceOwed || s.outstandingDebt || 0) > 0).length;
  const noDebtSuppliersCount = suppliers.filter((s) => Number(s.balanceOwed || s.outstandingDebt || 0) <= 0).length;

  // Filtered & Searched Suppliers
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter((s) => {
      // Search matching
      const matchesSearch = !q || (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.phoneNumber && s.phoneNumber.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.idOrTaxNumber && s.idOrTaxNumber.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q))
      );

      // Filter tab matching
      let matchesFilter = true;
      if (selectedFilter === 'DEBT') {
        matchesFilter = Number(s.balanceOwed || s.outstandingDebt || 0) > 0;
      } else if (selectedFilter === 'NO_DEBT' || selectedFilter === 'CLEARED') {
        matchesFilter = Number(s.balanceOwed || s.outstandingDebt || 0) <= 0;
      } else if (selectedFilter !== 'ALL') {
        matchesFilter = (s.category || 'General').toLowerCase() === selectedFilter.toLowerCase();
      }

      return matchesSearch && matchesFilter;
    });
  }, [suppliers, searchQuery, selectedFilter]);

  if (loading) {
    return <Spinner fullPage label="Loading suppliers & Accounts Payable ledger..." />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><FaTruck className={styles.titleIcon} /> Supplier Accounts Payable (AP)</h1>
          <p className={styles.subtitle}>Manage input vendors, supply categories, purchase invoices, and debt settlements</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setIsCustomCategory(false); setShowAddSupplier(true); }}>
          <FaPlus /> Register Supplier
        </button>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Outstanding AP Debt</span>
          <span className={`${styles.metricVal} ${styles.dangerText}`}>KES {totalOwedAll.toLocaleString()}</span>
          <span className={styles.metricSub}>{debtSuppliersCount} vendor{debtSuppliersCount === 1 ? '' : 's'} with balance</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Billed Invoices</span>
          <span className={styles.metricVal}>KES {totalBilledAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative purchases</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Payments Settled</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {totalPaidAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Remitted voucher payments</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Vendors</span>
          <span className={styles.metricVal}>{suppliers.length}</span>
          <span className={styles.metricSub}>Registered input suppliers</span>
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
            placeholder="Search suppliers by name, contact person, phone, KRA PIN, depot..."
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
            All <span className={styles.tabCount}>{suppliers.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${styles.tabDebt} ${selectedFilter === 'DEBT' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('DEBT')}
          >
            With Debt <span className={styles.tabCount}>{debtSuppliersCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'NO_DEBT' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('NO_DEBT')}
          >
            No Debt <span className={styles.tabCount}>{noDebtSuppliersCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'Fertilizer & Chemicals' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('Fertilizer & Chemicals')}
          >
            Fertilizer & Chemicals
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'Animal Feeds' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('Animal Feeds')}
          >
            Animal Feeds
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedFilter === 'Seeds & Seedlings' ? styles.tabBtnActive : ''}`}
            onClick={() => setSelectedFilter('Seeds & Seedlings')}
          >
            Seeds & Seedlings
          </button>
        </div>
      </section>

      {/* Compact SaaS Supplier Directory Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderLeft}>
            <h2>Supplier Directory & Accounts Payable (AP) Ledger</h2>
            <span className={styles.resultBadge}>
              {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'}
            </span>
          </div>
        </div>

        {loadError && suppliers.length === 0 ? (
          <ErrorState
            error={loadError}
            title="Could Not Load Suppliers"
            onRetry={loadData}
            variant="card"
          />
        ) : suppliers.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTruck className={styles.emptyIcon} />
            <p>No farm suppliers registered yet.</p>
            <button className={styles.smallAddBtn} onClick={() => { setIsCustomCategory(false); setShowAddSupplier(true); }}>
              <FaPlus /> Register First Supplier
            </button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className={styles.emptyState}>
            <FaSearch className={styles.emptyIcon} />
            <p>No suppliers matched your search & filter criteria.</p>
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
                  <th>Supplier / Vendor</th>
                  <th>Supply Category</th>
                  <th>Contact & Depot</th>
                  <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                  <th style={{ textAlign: 'right' }}>Outstanding AP Debt</th>
                  <th style={{ textAlign: 'center' }}>Ledger</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((sup) => {
                  const debt = Number(sup.balanceOwed !== undefined ? sup.balanceOwed : (sup.outstandingDebt !== undefined ? sup.outstandingDebt : 0));
                  const totalBilled = Number(sup.totalBilled !== undefined ? sup.totalBilled : (sup.total_billed || 0));
                  const initials = getInitials(sup.name);

                  return (
                    <tr 
                      key={sup.id} 
                      className={styles.tableRowClickable} 
                      onClick={() => handleOpenDetails(sup)}
                      title={`View Accounts Payable ledger for ${sup.name}`}
                    >
                      {/* Supplier Info */}
                      <td>
                        <div className={styles.vendorCell}>
                          <div className={styles.vendorAvatar}>
                            {initials}
                          </div>
                          <div className={styles.vendorDetails}>
                            <div className={styles.vendorName}>{sup.name}</div>
                            <div className={styles.vendorSubText}>
                              {sup.contactPerson ? (
                                <span>👤 {sup.contactPerson}</span>
                              ) : sup.idOrTaxNumber ? (
                                <span><FaIdCard className={styles.iconMini} /> PIN: {sup.idOrTaxNumber}</span>
                              ) : (
                                <span>Vendor #{sup.id ? sup.id.slice(0, 6).toUpperCase() : '---'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={styles.badgeCategory}>
                          {sup.category || 'General Inputs'}
                        </span>
                      </td>

                      {/* Contact & Depot */}
                      <td>
                        <div className={styles.contactCell}>
                          {sup.phoneNumber ? (
                            <a 
                              href={`tel:${sup.phoneNumber}`} 
                              onClick={(e) => e.stopPropagation()} 
                              className={styles.contactPhone}
                              title="Call supplier"
                            >
                              <FaPhone className={styles.iconMini} /> {sup.phoneNumber}
                            </a>
                          ) : sup.email ? (
                            <a 
                              href={`mailto:${sup.email}`} 
                              onClick={(e) => e.stopPropagation()} 
                              className={styles.contactPhone}
                              title="Email supplier"
                            >
                              <FaEnvelope className={styles.iconMini} /> {sup.email}
                            </a>
                          ) : (
                            <span className={styles.noContactText}>No direct phone</span>
                          )}
                          {sup.address && (
                            <div className={styles.contactAddress} title={sup.address}>
                              <FaMapMarkerAlt className={styles.iconMini} /> {sup.address}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Invoiced */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.billedCell}>
                          <span className={styles.billedAmount}>
                            KES {totalBilled.toLocaleString()}
                          </span>
                          <span className={styles.billedSub}>Purchases</span>
                        </div>
                      </td>

                      {/* Outstanding AP Debt */}
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.debtCell}>
                          {debt > 0 ? (
                            <>
                              <span className={styles.debtAmountHigh}>
                                KES {debt.toLocaleString()}
                              </span>
                              <span className={styles.debtSub}>
                                Liability Owed
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={styles.debtAmountZero}>
                                KES 0.00
                              </span>
                              <span className={styles.debtSubZero}>Cleared ✅</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button 
                            className={styles.actionBtnDetails} 
                            onClick={() => handleOpenDetails(sup)}
                            title="Open full supplier profile & AP ledger"
                          >
                            View <FaArrowRight className={styles.actionArrow} />
                          </button>
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '0.45rem 0.55rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={(e) => handleDeleteSupplier(sup, e)}
                            title="Delete supplier"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Supplier */}
      {showAddSupplier && (
        <div className={styles.modalOverlay} onClick={() => setShowAddSupplier(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaTruck /> Register Input Supplier</h3>
              <button className={styles.closeBtn} onClick={() => setShowAddSupplier(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateSupplier} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Company / Trader Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Kenya Seed Co / Farmchem Agro" 
                  value={supplierForm.name} 
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Contact Person</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Mwangi" 
                    value={supplierForm.contactPerson} 
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Supply Category</label>
                  {!isCustomCategory ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select 
                        style={{ flex: 1 }}
                        value={supplierForm.category} 
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomCategory(true);
                            setCustomCategoryInput('');
                          } else {
                            setSupplierForm({ ...supplierForm, category: e.target.value });
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
                        placeholder="Type new category (e.g. Irrigation Hardware)" 
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
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 0712345678" 
                    value={supplierForm.phoneNumber} 
                    onChange={(e) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. sales@vendor.com" 
                    value={supplierForm.email} 
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>KRA PIN / National ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. P051234567Z / 12345678" 
                  value={supplierForm.idOrTaxNumber} 
                  onChange={(e) => setSupplierForm({ ...supplierForm, idOrTaxNumber: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Physical Address / Depot</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nakuru Industrial Area" 
                  value={supplierForm.address} 
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddSupplier(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Register Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuppliersPage;
