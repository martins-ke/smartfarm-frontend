import styles from '../ProjectDashboardPage.module.css';
import {
  FaEdit,
  FaTrash,
  FaUserCheck,
  FaUser,
  FaPhoneAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaTimes,
  FaUserPlus,
  FaUsers
} from 'react-icons/fa';

export function SalesTab({
  records = [],
  showRecordForm,
  formState,
  onFieldChange,
  setFormState,
  onSubmit,
  isSubmitting,
  harvestStock = [],
  customerData,
  onRemoveCustomer,
  onOpenCustomerForm,
  onOpenCustomerList,
  customersCount = 0,
  canModifyRecord,
  onOpenEditRecord,
  onDeleteRecord,
}) {
  const saleQty = Number(formState.quantity) || 0;
  const saleUnitPrice = Number(formState.unit_price) || 0;
  const currentTotal = saleQty * saleUnitPrice;
  const currentPaid =
    formState.amount_paid !== ''
      ? Number(formState.amount_paid)
      : formState.payment_mode === 'CREDIT_LEDGER'
      ? 0
      : currentTotal;
  const currentBalanceDue = Math.max(0, currentTotal - currentPaid);
  const isCustomerMandatory = currentBalanceDue > 0 || formState.payment_mode === 'CREDIT_LEDGER';

  return (
    <>
      {showRecordForm && (
        <form onSubmit={onSubmit} className={styles.recordForm}>
          <label>
            <span>
              Item to Sell <span className={styles.requiredStar}>*</span>
            </span>
            <input
              list="harvest-produce-options"
              name="item"
              value={formState.item || ''}
              onChange={onFieldChange}
              placeholder="e.g. Beans / Maize / Milk"
              required
            />
            <datalist id="harvest-produce-options">
              {harvestStock.map((hs) => (
                <option key={hs.item} value={hs.item}>
                  {hs.item} ({hs.available} {hs.units} in stock)
                </option>
              ))}
            </datalist>
          </label>

          {/* Quick Select Harvested Produce Pills */}
          {harvestStock.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap',
                marginTop: '-0.3rem',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', alignSelf: 'center' }}>
                Harvested Produce:
              </span>
              {harvestStock.map((hs) => {
                const isSelected = formState.item?.toLowerCase() === hs.item.toLowerCase();
                return (
                  <button
                    key={hs.item}
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        sales: { ...prev.sales, item: hs.item },
                      }))
                    }
                    style={{
                      padding: '0.22rem 0.6rem',
                      fontSize: '0.78rem',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isSelected ? '#34d399' : '#e2e8f0',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <strong>{hs.item}</strong>
                    <span style={{ color: hs.available > 0 ? '#10b981' : '#f87171', fontSize: '0.72rem' }}>
                      ({hs.available} {hs.units})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>
                Quantity <span className={styles.requiredStar}>*</span>
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="quantity"
                value={formState.quantity || ''}
                onChange={onFieldChange}
                placeholder="20"
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>
                Unit price (Ksh) <span className={styles.requiredStar}>*</span>
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="unit_price"
                value={formState.unit_price || ''}
                onChange={onFieldChange}
                placeholder="75"
                required
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>Payment Method</span>
              <select
                name="payment_mode"
                value={formState.payment_mode || 'CASH'}
                onChange={(e) => {
                  const mode = e.target.value;
                  const total = (Number(formState.quantity) || 0) * (Number(formState.unit_price) || 0);
                  setFormState((prev) => ({
                    ...prev,
                    sales: {
                      ...prev.sales,
                      payment_mode: mode,
                      amount_paid:
                        mode === 'CREDIT_LEDGER'
                          ? '0'
                          : prev.sales.amount_paid || (total > 0 ? total.toString() : ''),
                    },
                  }));
                }}
              >
                <option value="CASH">💵 Cash (Immediate)</option>
                <option value="MPESA">📱 M-Pesa (Mobile Money)</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                <option value="CREDIT_LEDGER">📑 Credit Ledger (Accounts Receivable)</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>
              <span>Amount Paid Now (Ksh)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amount_paid"
                value={formState.amount_paid}
                onChange={onFieldChange}
                placeholder={
                  formState.payment_mode === 'CREDIT_LEDGER'
                    ? '0'
                    : (
                        (Number(formState.quantity) || 0) * (Number(formState.unit_price) || 0) || '0'
                      ).toString()
                }
              />
            </label>
          </div>

          {currentTotal > 0 && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#0f172a',
                borderRadius: '0.5rem',
                border: '1px solid #334155',
                marginBottom: '1rem',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#94a3b8' }}>Total Sale Amount:</span>
                <strong style={{ color: '#f8fafc' }}>Ksh {currentTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#94a3b8' }}>Amount Paid Now:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  Ksh {currentPaid.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.25rem',
                  borderTop: '1px dashed #334155',
                }}
              >
                <span style={{ color: '#94a3b8' }}>Recorded to Customer Debt (AR):</span>
                <strong style={{ color: currentBalanceDue > 0 ? '#f59e0b' : '#10b981' }}>
                  Ksh {currentBalanceDue.toLocaleString()}
                </strong>
              </div>
            </div>
          )}

          {/* Customer Attachment Section */}
          <div
            className={styles.customerSectionCard}
            style={{
              borderColor: isCustomerMandatory && !customerData ? '#ef4444' : undefined,
              boxShadow:
                isCustomerMandatory && !customerData
                  ? '0 0 0 1px rgba(239, 68, 68, 0.25)'
                  : undefined,
            }}
          >
            <div className={styles.customerSectionHeader}>
              <div className={styles.customerSectionTitle}>
                <FaUserCheck className={styles.customerSectionIcon} />
                <span>Customer Information</span>
              </div>
              {customerData ? (
                <span className={styles.customerStatusBadge}>
                  {customerData.status === 'new' ? '✨ New Buyer' : '👤 Existing Buyer'}
                </span>
              ) : isCustomerMandatory ? (
                <span
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  * Required (Balance Due: Ksh {currentBalanceDue.toLocaleString()})
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
                    <span>
                      <FaPhoneAlt size={10} /> {customerData.contact}
                    </span>
                    {customerData.id_number && (
                      <span>
                        <FaIdCard size={10} /> ID: {customerData.id_number}
                      </span>
                    )}
                    {customerData.address && customerData.address !== '-' && (
                      <span>
                        <FaMapMarkerAlt size={10} /> {customerData.address}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeCustomerBtn}
                  onClick={onRemoveCustomer}
                  title="Remove customer"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className={styles.emptyCustomerBox}>
                <p
                  className={styles.emptyCustomerText}
                  style={{ color: isCustomerMandatory ? '#f87171' : undefined }}
                >
                  {isCustomerMandatory ? (
                    <>
                      ⚠️ <strong>Customer is required</strong> because amount paid is less than total
                      required amount (Ksh {currentBalanceDue.toLocaleString()} balance due).
                    </>
                  ) : (
                    'Attach a buyer for invoicing and customer tracking'
                  )}
                </p>
                <div className={styles.customerActionBtns}>
                  <button
                    type="button"
                    className={styles.customerAddBtn}
                    onClick={onOpenCustomerForm}
                  >
                    <FaUserPlus /> Add New
                  </button>
                  <button
                    type="button"
                    className={styles.customerSelectBtn}
                    onClick={onOpenCustomerList}
                  >
                    <FaUsers /> Select Existing ({customersCount})
                  </button>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save record'}
          </button>
        </form>
      )}

      <div className={styles.recordList}>
        <div className={styles.listHeader}>
          <h3 style={{ color: '#2aa1ee' }}>Sales records</h3>
          <span>{records.length}</span>
        </div>

        {records.length === 0 ? (
          <p className={styles.emptyText}>No sales recorded yet.</p>
        ) : (
          <ul>
            {records.slice(0, 15).map((entry) => {
              const price = Number(entry.unit_price ?? entry.unitPrice ?? entry.price ?? 0);
              const qty = Number(entry.quantity || 0);
              const total = qty * price;
              const bal = Number(entry.balance_due ?? entry.balanceDue ?? 0);
              let meta = `Ksh ${total.toLocaleString()} (Paid)`;
              if (bal > 0) {
                meta = `Ksh ${total.toLocaleString()} (Due: Ksh ${bal.toLocaleString()})`;
              }
              const date = entry?.added_on || entry?.date || 'N/A';

              return (
                <li key={entry.id} className={styles.recordItem}>
                  <div className={styles.recordTopRow}>
                    <strong className={styles.recordTitle}>{entry?.item || 'Sale'}</strong>
                    <div className={styles.recordActionGroup}>
                      {canModifyRecord && (
                        <>
                          <button
                            type="button"
                            className={styles.recordActionBtn}
                            onClick={() => onOpenEditRecord('sales', entry)}
                            title="Edit Sale"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className={`${styles.recordActionBtn} ${styles.recordDeleteBtn}`}
                            onClick={() => onDeleteRecord('sales', entry)}
                            title="Delete Sale"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.recordBottomRow}>
                    <small className={styles.recordDate}>{date}</small>
                    <span className={styles.recordMeta}>{meta}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
