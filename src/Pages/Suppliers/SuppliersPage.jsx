import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SuppliersPage.module.css';
import { 
  getSuppliers, 
  createSupplier 
} from '../../APIs/supplier';
import useAuth from '../../useAuth';
import { notify } from '../../utils/notify';
import { 
  FaTruck, 
  FaPlus, 
  FaTimes, 
  FaPhone, 
  FaEnvelope
} from 'react-icons/fa';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';

export function SuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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

  const totalOwedAll = suppliers.reduce((sum, s) => sum + Number(s.balanceOwed || 0), 0);
  const totalBilledAll = suppliers.reduce((sum, s) => sum + Number(s.totalBilled || 0), 0);
  const totalPaidAll = suppliers.reduce((sum, s) => sum + Number(s.totalPaid || 0), 0);

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

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Farm Debt Owed (AP)</span>
          <span className={`${styles.metricVal} ${styles.dangerText}`}>KES {totalOwedAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Outstanding vendor liabilities</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Billed Invoices</span>
          <span className={styles.metricVal}>KES {totalBilledAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Cumulative purchases</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Debt Settled</span>
          <span className={`${styles.metricVal} ${styles.successText}`}>KES {totalPaidAll.toLocaleString()}</span>
          <span className={styles.metricSub}>Payments remitted</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Vendors</span>
          <span className={styles.metricVal}>{suppliers.length}</span>
          <span className={styles.metricSub}>Registered input suppliers</span>
        </div>
      </div>

      {/* Mobile Responsive 4-Column Supplier Directory Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Supplier Directory & Ledger</h2>
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
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Supplier</th>
                  <th style={{ minWidth: '150px' }}>Category</th>
                  <th style={{ minWidth: '180px' }}>Contact</th>
                  <th style={{ minWidth: '130px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => {
                  const debt = Number(sup.balanceOwed || 0);
                  return (
                    <tr key={sup.id} className={styles.tableRowClickable} onClick={() => handleOpenDetails(sup)}>
                      <td>
                        <div className={styles.vendorName}>{sup.name}</div>
                        {sup.contactPerson ? (
                          <div className={styles.contactPerson}>👤 {sup.contactPerson}</div>
                        ) : (
                          <div className={styles.contactPersonSub}>Vendor ID: #{sup.id.slice(0, 6)}</div>
                        )}
                        {debt > 0 ? (
                          <span className={styles.mobileDebtSummary}>KES {debt.toLocaleString()} Owed</span>
                        ) : (
                          <span className={styles.mobileClearedSummary}>Cleared ✅</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.badgeCategory}>{sup.category || 'General'}</span>
                      </td>
                      <td>
                        {sup.phoneNumber ? (
                          <div className={styles.contactLine}>
                            <FaPhone className={styles.iconMini} /> 
                            <a href={`tel:${sup.phoneNumber}`} onClick={(e) => e.stopPropagation()} className={styles.contactLink}>
                              {sup.phoneNumber}
                            </a>
                          </div>
                        ) : null}
                        {sup.email ? (
                          <div className={styles.contactLine}>
                            <FaEnvelope className={styles.iconMini} /> 
                            <a href={`mailto:${sup.email}`} onClick={(e) => e.stopPropagation()} className={styles.contactLink}>
                              {sup.email}
                            </a>
                          </div>
                        ) : null}
                        {!sup.phoneNumber && !sup.email && (
                          <span className={styles.noContactText}>No contact saved</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          className={styles.actionBtnDetails}
                          onClick={() => handleOpenDetails(sup)}
                          title="View full profile, financial ledger, and actions"
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
