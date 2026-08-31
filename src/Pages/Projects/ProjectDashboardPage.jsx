import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ProjectDashboardPage.module.css';
import { getProjectById } from '../../APIs/project';
import {
  FaCheck,
  FaClipboardList,
  FaIdCard,
  FaLeaf,
  FaMapMarkerAlt,
  FaMinus,
  FaMoneyBillWave,
  FaPhoneAlt,
  FaPlus,
  FaSearch,
  FaStore,
  FaTimes,
  FaUser,
  FaUserCheck,
  FaUserPlus,
  FaUsers
} from 'react-icons/fa';
import { createExpense } from '../../APIs/expense';
import { recordSale, requestAllCustomers } from '../../APIs/sales';
import { recordHarvest } from '../../APIs/harvest';
import { recordActivity } from '../../APIs/activity';
import { getInventoryItems, useInventoryItem } from '../../APIs/inventory';
import { notify, alertModal } from '../../utils/notify';
import { FaBoxes } from 'react-icons/fa';

const recordTabs = ['expenses', 'activities', 'sales', 'harvest'];

const tabIcons = {
  expenses: FaMoneyBillWave,
  activities: FaClipboardList,
  sales: FaStore,
  harvest: FaLeaf,
};

const initialForm = {
  expenses: { title: '', unitPrice: '', quantity: '', amount: '', notes: '' },
  activities: { title: '', type: '', notes: '' },
  sales: { item: '', quantity: '', unit_price: '' },
  harvest: { item: '', quantity: '', units: '', notes: '' }
};

const unwrapResponse = (response) => {
  if (response && response.body !== undefined) return response.body;
  return response;
};

export function ProjectDashboardPage() {
  const { category, projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [openCustomerForm, setOpenCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [openCustomerList, setOpenCustomerList] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inventory usage
  const [useSuppliesModalOpen, setUseSuppliesModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);

  // Refs for scrolling active tab button to the center
  const tabsContainerRef = useRef(null);
  const tabButtonRefs = useRef({});

  const categoryLabel = useMemo(() => category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Project', [category]);

  // Center active tab button when selected
  useEffect(() => {
    const activeBtn = tabButtonRefs.current[activeTab];
    const container = tabsContainerRef.current;
    if (activeBtn && container) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = activeBtn.offsetLeft;
      const buttonWidth = activeBtn.offsetWidth;
      const targetScrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [projectRes, customersRes] = await Promise.allSettled([
          getProjectById(projectId),
          requestAllCustomers()
        ]);

        if (isMounted) {
          if (projectRes.status === 'fulfilled') {
            setProject(unwrapResponse(projectRes.value));
          } else {
            setProject(null);
            const errMsg = projectRes.reason?.message || '';
            if (errMsg.toLowerCase().includes('access denied') || errMsg.toLowerCase().includes('not assigned')) {
              alertModal(errMsg || 'Access Denied: You are not assigned to this project.', 'error');
              navigate('/');
              return;
            }
          }

          if (customersRes.status === 'fulfilled') {
            const custData = unwrapResponse(customersRes.value);
            setCustomers(Array.isArray(custData) ? custData : []);
          } else {
            setCustomers([]);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (projectId) loadData();

    return () => { isMounted = false; };
  }, [projectId]);

  const handleCustomerSave = (data) => {
    setCustomerData(data);
    setOpenCustomerForm(false);
    setOpenCustomerList(false);
    setShowRecordForm(true);
    notify(`Customer attached: ${data.name} ✅`, 'success');
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [activeTab]: {
          ...current[activeTab],
          [name]: value
        }
      };

      if (activeTab === 'expenses' && (name === 'unitPrice' || name === 'quantity')) {
        const up = parseFloat(updated.expenses.unitPrice) || 0;
        const q = parseFloat(updated.expenses.quantity) || 0;
        if (up > 0 && q > 0) {
          updated.expenses.amount = (up * q).toString();
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...form[activeTab],
      project_id: projectId,
      ...(activeTab === 'sales' && customerData ? { customer: customerData } : {})
    };

    try {
      let res;
      if (activeTab === 'expenses') {
        res = await createExpense(payload);
      } else if (activeTab === 'sales') {
        res = await recordSale(payload);
        setCustomerData(null);
      } else if (activeTab === 'harvest') {
        res = await recordHarvest(payload);
      } else if (activeTab === 'activities') {
        res = await recordActivity(payload);
      }

      const msg = res?.message || `${activeTab.slice(0, -1) || activeTab} recorded successfully ✅`;
      notify(msg, 'success');

      // Refresh project and customer data
      const [refreshedProject, refreshedCustomers] = await Promise.allSettled([
        getProjectById(projectId),
        requestAllCustomers()
      ]);

      if (refreshedProject.status === 'fulfilled') {
        setProject(unwrapResponse(refreshedProject.value));
      }
      if (refreshedCustomers.status === 'fulfilled') {
        const cData = unwrapResponse(refreshedCustomers.value);
        setCustomers(Array.isArray(cData) ? cData : []);
      }

      setForm(initialForm);
      setShowRecordForm(false);
    } catch (error) {
      alertModal(error?.message || 'Unable to save record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.emptyState}>Loading project dashboard...</div>;
  }
  if (!project) {
    return <div className={styles.emptyState}>Failed to load project data ⚠</div>;
  }

  const projectRecords = project?.records || project || {};
  const expensesList = projectRecords.expenses || [];
  const salesList = projectRecords.sales || [];
  const activitiesList = projectRecords.activities || [];
  const harvestList = projectRecords.harvest || [];

  const recordsMap = {
    expenses: expensesList,
    activities: activitiesList,
    sales: salesList,
    harvest: harvestList
  };

  // Read financials calculated directly by backend SQL queries
  const totalExpenses = Number(project?.totalExpenses ?? expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const totalSales = Number(project?.totalSales ?? salesList.reduce((sum, item) => {
    const price = Number(item.unit_price ?? item.price ?? 0);
    const qty = Number(item.quantity || 0);
    return sum + (qty * price);
  }, 0));
  const netValue = Number(project?.netValue ?? (totalSales - totalExpenses));
  const currentRecords = recordsMap[activeTab] || [];

  const renderRecordLabel = (entry) => {
    if (activeTab === 'expenses') return entry.title || 'Expense';
    if (activeTab === 'activities') return entry.title || 'Activity';
    if (activeTab === 'sales') return entry.item || 'Sale';
    return entry.item || 'Harvest';
  };

  const renderRecordMeta = (entry) => {
    if (activeTab === 'expenses') {
      let meta = `Ksh ${Number(entry.amount || 0).toLocaleString()}`;
      if (entry.unitPrice && entry.quantity) {
        meta += ` (${entry.quantity} @ Ksh ${entry.unitPrice})`;
      }
      return meta;
    }
    if (activeTab === 'activities') return entry.type || 'Activity';
    if (activeTab === 'sales') {
      const price = Number(entry.unit_price ?? entry.price ?? 0);
      const qty = Number(entry.quantity || 0);
      return `Ksh ${(qty * price).toLocaleString()}`;
    }
    const units = entry.units || entry.unit || '';
    return `${entry.quantity || 0} ${units}`.trim();
  };

  const renderRecordDate = (entry) => entry.added_on || entry.date || 'N/A';

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>{categoryLabel}</p>
          <h2>{project.name}</h2>
        </div>
        <div />
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}><span>Total expenses</span><strong style={{color: '#ea580c'}}>Ksh. {totalExpenses.toLocaleString()}</strong></div>
        <div className={styles.summaryCard}><span>Total sales</span><strong style={{color: 'var(--green-text, #15803d)'}}>Ksh. {totalSales.toLocaleString()}</strong></div>
        <div className={styles.summaryCard}><span>Net value</span><strong style={{color: netValue >= 0 ? 'var(--green-text, #15803d)' : '#ef4444'}}>Ksh. {netValue.toLocaleString()}</strong></div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.recordPanel}>
          <div className={styles.recordHeader}>
            <div className={styles.tabs} ref={tabsContainerRef}>
              {recordTabs.map((tab) => {
                const Icon = tabIcons[tab];
                return (
                  <button
                    key={tab}
                    ref={(el) => {
                      tabButtonRefs.current[tab] = el;
                    }}
                    type="button"
                    className={activeTab === tab ? styles.tabActive : ''}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowRecordForm(false);
                      setOpenCustomerForm(false);
                      setOpenCustomerList(false);
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Icon />
                      {tab}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={styles.actionButtonsWrap}>
              {activeTab === 'expenses' && (
                <button 
                  type="button" 
                  className={styles.useSuppliesBtn}
                  onClick={async () => {
                      try {
                        const res = await getInventoryItems(0, 1000);
                        const pageData = res.body;
                        setInventoryItems(pageData?.content || []);
                        setUseSuppliesModalOpen(true);
                      } catch (e) {
                        notify('Failed to load inventory', 'error');
                      }
                    }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FaBoxes /> Use Supplies
                  </span>
                </button>
              )}

              <button 
                type="button" 
                className={styles.addButton} 
                onClick={() => {
                  if (activeTab === 'sales' && harvestList.length === 0) {
                    alertModal('You cannot record a sale because no harvest has been recorded yet.', 'error');
                    return;
                  }
                  setShowRecordForm((current) => !current);
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  {showRecordForm ? <FaMinus /> : <FaPlus />}
                  {showRecordForm ? 'Close form' : `Record ${activeTab}`}
                </span>
              </button>
            </div>
          </div>

          {useSuppliesModalOpen && (
            <UseSuppliesModal 
              items={inventoryItems} 
              projectId={projectId}
              onClose={() => setUseSuppliesModalOpen(false)}
              onSuccess={async () => {
                setUseSuppliesModalOpen(false);
                notify('Supplies applied to project expenses!', 'success');
                // Refresh project data
                const refreshedProject = await getProjectById(projectId);
                if (refreshedProject) setProject(unwrapResponse(refreshedProject));
              }}
            />
          )}

          {showRecordForm && (
            <div className={styles.modalOverlay} onClick={() => setShowRecordForm(false)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <div className={styles.modalHeaderInfo}>
                    <div className={styles.modalHeaderIcon} style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <FaPlus />
                    </div>
                    <div>
                      <h3>Record {activeTab}</h3>
                      <p>Enter details for the new {activeTab.slice(0, -1)}</p>
                    </div>
                  </div>
                  <button type="button" className={styles.modalCloseBtn} onClick={() => setShowRecordForm(false)}>
                    <FaTimes />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                  {activeTab === 'expenses' && (
                    <>
                      <label><span>Expense title</span><input name="title" value={form.expenses.title} onChange={handleFieldChange} placeholder="Feed purchase" required /></label>
                      <div className={styles.formRow}>
                        <label style={{ flex: 1 }}><span>Unit Price (Ksh)</span><input type="number" step="0.01" min="0" name="unitPrice" value={form.expenses.unitPrice} onChange={handleFieldChange} placeholder="100" /></label>
                        <label style={{ flex: 1 }}><span>Quantity</span><input type="number" step="0.01" min="0" name="quantity" value={form.expenses.quantity} onChange={handleFieldChange} placeholder="2" /></label>
                      </div>
                      <label><span>Total Amount (Ksh)</span><input type="number" step="0.01" min="0" name="amount" value={form.expenses.amount} onChange={handleFieldChange} placeholder="200" required /></label>
                      <label><span>Notes</span><textarea name="notes" value={form.expenses.notes} onChange={handleFieldChange} rows="3" placeholder="Expense detail" /></label>
                    </>
                  )}

              {activeTab === 'activities' && (
                <>
                  <label><span>Activity title</span><input name="title" value={form.activities.title} onChange={handleFieldChange} placeholder="Vaccination" required /></label>
                  <label><span>Type</span><input name="type" value={form.activities.type} onChange={handleFieldChange} placeholder="Health / Routine / Field" required /></label>
                  <label><span>Notes</span><textarea name="notes" value={form.activities.notes} onChange={handleFieldChange} rows="3" placeholder="Add notes" /></label>
                </>
              )}

              {activeTab === 'sales' && (
                <>
                  <label><span>Item</span><input name="item" value={form.sales.item} onChange={handleFieldChange} placeholder="Milk / Eggs / Produce" required /></label>
                  <div className={styles.formRow}>
                    <label style={{ flex: 1 }}><span>Quantity</span><input type="number" step={0.05} min={0} name="quantity" value={form.sales.quantity} onChange={handleFieldChange} placeholder="20" required /></label>
                    <label style={{ flex: 1 }}><span>Unit price (Ksh)</span><input type="number" step={0.05} min={0} name="unit_price" value={form.sales.unit_price} onChange={handleFieldChange} placeholder="75" required /></label>
                  </div>
                  
                  {/* Modern Customer Attachment Card */}
                  <div className={styles.customerSectionCard}>
                    <div className={styles.customerSectionHeader}>
                      <div className={styles.customerSectionTitle}>
                        <FaUserCheck className={styles.customerSectionIcon} />
                        <span>Customer Information</span>
                      </div>
                      {customerData ? (
                        <span className={styles.customerStatusBadge}>
                          {customerData.status === 'new' ? '✨ New Buyer' : '👤 Existing Buyer'}
                        </span>
                      ) : (
                        <span className={styles.customerOptionalHint}>Optional</span>
                      )}
                    </div>

                    {customerData ? (
                      <div className={styles.selectedCustomerCard}>
                        <div className={styles.customerAvatarCircle}>
                          {customerData.name ? customerData.name.charAt(0).toUpperCase() : <FaUser />}
                        </div>
                        <div className={styles.selectedCustomerDetails}>
                          <div className={styles.selectedCustomerNameRow}>
                            <strong>{customerData.name}</strong>
                          </div>
                          <div className={styles.selectedCustomerMeta}>
                            <span><FaPhoneAlt size={10} /> {customerData.contact}</span>
                            {customerData.id_number && (
                              <span><FaIdCard size={10} /> ID: {customerData.id_number}</span>
                            )}
                            {customerData.address && customerData.address !== '-' && (
                              <span><FaMapMarkerAlt size={10} /> {customerData.address}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.removeCustomerBtn}
                          onClick={() => setCustomerData(null)}
                          title="Remove customer"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.emptyCustomerBox}>
                        <p className={styles.emptyCustomerText}>Attach a buyer for invoicing and customer tracking</p>
                        <div className={styles.customerActionBtns}>
                          <button
                            type="button"
                            className={styles.customerAddBtn}
                            onClick={() => {
                              setOpenCustomerForm(true);
                              setShowRecordForm(false);
                            }}
                          >
                            <FaUserPlus /> Add New
                          </button>
                          <button
                            type="button"
                            className={styles.customerSelectBtn}
                            onClick={() => {
                              setOpenCustomerList(true);
                              setShowRecordForm(false);
                            }}
                          >
                            <FaUsers /> Select Existing ({customers.length})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'harvest' && (
                <>
                  <label><span>Harvest item</span><input name="item" value={form.harvest.item} onChange={handleFieldChange} placeholder="Maize / Eggs / Milk" required /></label>
                  <label><span>Quantity</span><input type="number" step={0.01} min={0} name="quantity" value={form.harvest.quantity} onChange={handleFieldChange} placeholder="150" required /></label>
                  <label><span>Units</span><input type="text" name="units" value={form.harvest.units} onChange={handleFieldChange} placeholder="kg / crates / litres" required /></label>
                  <label><span>Notes</span><textarea name="notes" value={form.harvest.notes} onChange={handleFieldChange} rows="3" placeholder="Harvest details" /></label>
                </>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancelBtn} onClick={() => setShowRecordForm(false)}>Cancel</button>
                <button type="submit" className={styles.modalSubmitBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save record'}
                </button>
              </div>
            </form>
           </div>
          </div>
          )}

          <CustomerInfo
            customers={customers}
            onSave={handleCustomerSave}
            openForm={openCustomerForm}
            closeForm={() => {
              setOpenCustomerForm(false);
              setShowRecordForm(true);
            }}
          />

          <CustomerList
            customers={customers}
            openList={openCustomerList}
            closeList={() => {
              setOpenCustomerList(false);
              setShowRecordForm(true);
            }}
            save={handleCustomerSave}
            onAddNew={() => {
              setOpenCustomerList(false);
              setOpenCustomerForm(true);
            }}
          />

          <div className={styles.recordList}>
            <div className={styles.listHeader}>
              <h3 style={{ color: '#2aa1ee'}}>{activeTab} records</h3>
              <span>{currentRecords.length}</span>
            </div>

            {currentRecords.length === 0 ? (
              <p className={styles.emptyText}>No {activeTab} recorded yet.</p>
            ) : (
              <ul>
                {currentRecords.slice(0, 8).map((entry) => (
                  <li key={entry.id} className={styles.recordItem}>
                    <div>
                      <strong style={{ color: '#198d6c'}}>{renderRecordLabel(entry)}</strong>
                      <small style={{ color: '#ee2ad1'}}>{renderRecordDate(entry)}</small>
                    </div>
                    <span style={{ color: '#aa5704'}}>{renderRecordMeta(entry)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className={styles.recentPanel}>
          <h3>Recent records</h3>

          {recordTabs.map((tab) => (
            <div key={tab} className={styles.recordGroup}>
              <h4 style={{ color: '#7532e1'}}>{tab}</h4>
              {(recordsMap[tab] || []).length === 0 ? (
                <p className={styles.emptyText}>No {tab} yet.</p>
              ) : (
                <ul>
                  {(recordsMap[tab] || []).slice(0, 5).map((entry) => (
                    <li key={entry.id}>
                      {entry.title || entry.item || 'Record'}
                      <span style={{ color: '#ee2ad1'}}>{renderRecordDate(entry)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function CustomerInfo({ customers = [], onSave, openForm, closeForm }) {
  const [form, setForm] = useState({ name: '', contact: '', id_number: '', address: '', status: 'new' });

  const saveInfo = (e) => {
    if (e) e.preventDefault();
    const list = Array.isArray(customers) ? customers : [];
    const name = form.name.trim();
    const contact = form.contact.trim();
    const idNumber = form.id_number.trim();
    const address = form.address.trim() ? form.address.trim() : '-';

    if (!name) {
      notify('Customer name is required', 'error');
      return;
    }
    if (!contact) {
      notify('Contact number is required', 'error');
      return;
    }
    if (!idNumber) {
      notify('National ID number is required', 'error');
      return;
    }

    const contactExists = list.find((c) => c.contact && c.contact === contact);
    if (contactExists) {
      notify(`Customer with contact ${contact} already exists!`, 'error');
      return;
    }

    const idNumberExists = list.find((c) => (c.id_number || c.idNumber) && (c.id_number || c.idNumber) === idNumber);
    if (idNumberExists) {
      notify(`Customer with ID number ${idNumber} already exists!`, 'error');
      return;
    }

    onSave({
      name,
      contact,
      id_number: idNumber,
      address,
      status: 'new'
    });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!openForm) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeForm}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalHeaderIcon}>
              <FaUserPlus />
            </div>
            <div>
              <h3>New Customer</h3>
              <p>Register buyer details to attach to this sale</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={closeForm}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={saveInfo} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                <span>Full Name <span className={styles.requiredStar}>*</span></span>
                <div className={styles.inputWithIcon}>
                  <FaUser className={styles.fieldIcon} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    placeholder="e.g. John Doe / School Cafeteria"
                    autoFocus
                    required
                  />
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span>Phone Contact <span className={styles.requiredStar}>*</span></span>
                <div className={styles.inputWithIcon}>
                  <FaPhoneAlt className={styles.fieldIcon} />
                  <input
                    type="tel"
                    name="contact"
                    value={form.contact}
                    onChange={handleFieldChange}
                    placeholder="e.g. 0784463737"
                    required
                  />
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span>National ID / Reg No. <span className={styles.requiredStar}>*</span></span>
                <div className={styles.inputWithIcon}>
                  <FaIdCard className={styles.fieldIcon} />
                  <input
                    type="text"
                    name="id_number"
                    value={form.id_number}
                    onChange={handleFieldChange}
                    placeholder="e.g. 12345678"
                    required
                  />
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span>Residence / Address <span className={styles.optionalTag}>(Optional)</span></span>
                <div className={styles.inputWithIcon}>
                  <FaMapMarkerAlt className={styles.fieldIcon} />
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleFieldChange}
                    placeholder="e.g. Kitale Town / Stall 4"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className={styles.modalSubmitBtn}>
              <FaCheck /> Attach Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerList({ customers = [], openList, closeList, save, onAddNew }) {
  const [searchTerm, setSearchTerm] = useState('');
  const list = Array.isArray(customers) ? customers : [];

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const contact = (c.contact || '').toLowerCase();
      const idNum = (c.id_number || c.idNumber || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      return name.includes(q) || contact.includes(q) || idNum.includes(q) || address.includes(q);
    });
  }, [list, searchTerm]);

  if (!openList) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeList}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalHeaderIcon}>
              <FaUsers />
            </div>
            <div>
              <h3>Select Customer</h3>
              <p>Choose an existing buyer ({list.length} registered)</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={closeList}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.searchBarWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, contact, ID, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button type="button" className={styles.clearSearchBtn} onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className={styles.customerScrollList}>
          {filteredCustomers.length === 0 ? (
            <div className={styles.noCustomersBox}>
              <p>{list.length === 0 ? 'No customers found in database.' : 'No customers match your search query.'}</p>
              {onAddNew && (
                <button
                  type="button"
                  className={styles.modalSecondaryActionBtn}
                  onClick={onAddNew}
                >
                  <FaUserPlus /> Register New Customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const initial = c.name ? c.name.charAt(0).toUpperCase() : '?';
              const idVal = c.id_number || c.idNumber;
              return (
                <div
                  key={c.id || c.contact}
                  className={styles.customerOptionCard}
                  onClick={() => {
                    save({ ...c, status: 'exist' });
                  }}
                >
                  <div className={styles.customerOptionAvatar}>{initial}</div>
                  <div className={styles.customerOptionDetails}>
                    <div className={styles.customerOptionNameRow}>
                      <strong>{c.name}</strong>
                      {idVal && <span className={styles.customerOptionBadge}>ID: {idVal}</span>}
                    </div>
                    <div className={styles.customerOptionMeta}>
                      <span><FaPhoneAlt size={10} /> {c.contact}</span>
                      {c.address && c.address !== '-' && (
                        <span><FaMapMarkerAlt size={10} /> {c.address}</span>
                      )}
                    </div>
                  </div>
                  <span className={styles.selectOptionTag}>Select</span>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalCancelBtn} onClick={closeList}>
            Cancel
          </button>
          {onAddNew && (
            <button type="button" className={styles.modalAddNewBtn} onClick={onAddNew}>
              <FaUserPlus /> Add New Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UseSuppliesModal({ items = [], projectId, onClose, onSuccess }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !quantity) return;
    
    setLoading(true);
    try {
      await useInventoryItem(selectedItemId, {
        projectId,
        quantity: Number(quantity),
        notes: `Used for project ${projectId}`
      });
      onSuccess();
    } catch (err) {
      notify(err.message || 'Failed to use supplies', 'error');
      onClose(); // Force close on error as requested so message is visible
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalHeaderIcon} style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <FaBoxes />
            </div>
            <div>
              <h3>Use Farm Supplies</h3>
              <p>Deduct from inventory and charge as an expense.</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
            <label><span>Select Supply <span className={styles.requiredStar}>*</span></span>
              <select 
                value={selectedItemId} 
                onChange={e => { setSelectedItemId(e.target.value); setQuantity(''); }} 
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              >
                <option value="">-- Choose an item --</option>
                {items.filter(i => i.quantityInStock > 0).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantityInStock} {item.unit} available)
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedItem && (
            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label><span>Quantity Used ({selectedItem.unit}) <span className={styles.requiredStar}>*</span></span>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={selectedItem.quantityInStock}
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </label>
              
              {quantity && (
                <div style={{ marginTop: '0.8rem', padding: '0.8rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#4b5563' }}>Unit Price:</span>
                    <strong>Ksh {selectedItem.unitPrice.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Total Expense Cost:</span>
                    <strong style={{ color: '#059669' }}>Ksh {(Number(quantity) * selectedItem.unitPrice).toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={loading || !selectedItem}>
              {loading ? 'Processing...' : 'Confirm Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

