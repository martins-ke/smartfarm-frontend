import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTimes, FaSave } from 'react-icons/fa';

export function EditRecordModal({
  editingRecord,
  onClose,
  editRecordForm,
  onFormChange,
  onSave,
  isSubmitting,
}) {
  if (!editingRecord) return null;

  const tabName = editingRecord.tab === 'harvest' ? 'harvest' : editingRecord.tab.slice(0, -1);
  const capitalizedTab = tabName.charAt(0).toUpperCase() + tabName.slice(1);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div
              className={styles.modalHeaderIcon}
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <FaEdit />
            </div>
            <div>
              <h3>Edit {capitalizedTab}</h3>
              <p>Update details for this {tabName}</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={onSave} className={styles.modalForm}>
          {editingRecord.tab === 'expenses' && (
            <>
              <label>
                <span>Expense title</span>
                <input
                  name="title"
                  value={editRecordForm.title || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </label>
              <div className={styles.formRow}>
                <label style={{ flex: 1 }}>
                  <span>Unit Price (Ksh)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="unitPrice"
                    value={editRecordForm.unitPrice || ''}
                    onChange={(e) => {
                      const up = parseFloat(e.target.value) || 0;
                      const q = parseFloat(editRecordForm.quantity) || 0;
                      onFormChange((prev) => ({
                        ...prev,
                        unitPrice: e.target.value,
                        amount: up > 0 && q > 0 ? (up * q).toString() : prev.amount,
                      }));
                    }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span>Quantity</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="quantity"
                    value={editRecordForm.quantity || ''}
                    onChange={(e) => {
                      const q = parseFloat(e.target.value) || 0;
                      const up = parseFloat(editRecordForm.unitPrice) || 0;
                      onFormChange((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                        amount: up > 0 && q > 0 ? (up * q).toString() : prev.amount,
                      }));
                    }}
                  />
                </label>
              </div>
              <label>
                <span>Total Amount (Ksh)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount"
                  value={editRecordForm.amount || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={editRecordForm.notes || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows="3"
                />
              </label>
            </>
          )}

          {editingRecord.tab === 'sales' && (
            <>
              <label>
                <span>Item Sold</span>
                <input
                  name="item"
                  value={editRecordForm.item || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, item: e.target.value }))
                  }
                  required
                />
              </label>
              <div className={styles.formRow}>
                <label style={{ flex: 1 }}>
                  <span>Quantity</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="quantity"
                    value={editRecordForm.quantity || ''}
                    onChange={(e) =>
                      onFormChange((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    required
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span>Unit Price (Ksh)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="unit_price"
                    value={editRecordForm.unit_price || ''}
                    onChange={(e) =>
                      onFormChange((prev) => ({ ...prev, unit_price: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <div
                style={{
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '0.45rem',
                  fontSize: '0.9rem',
                  color: '#64748b',
                }}
              >
                Computed Total:{' '}
                <strong style={{ color: 'var(--green-text, #16a34a)' }}>
                  Ksh{' '}
                  {(
                    (parseFloat(editRecordForm.quantity) || 0) *
                    (parseFloat(editRecordForm.unit_price) || 0)
                  ).toLocaleString()}
                </strong>
              </div>
            </>
          )}

          {editingRecord.tab === 'harvest' && (
            <>
              <label>
                <span>Harvest Item</span>
                <input
                  name="item"
                  value={editRecordForm.item || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, item: e.target.value }))
                  }
                  required
                />
              </label>
              <div className={styles.formRow}>
                <label style={{ flex: 1 }}>
                  <span>Quantity</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="quantity"
                    value={editRecordForm.quantity || ''}
                    onChange={(e) =>
                      onFormChange((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    required
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span>Units</span>
                  <input
                    type="text"
                    name="units"
                    value={editRecordForm.units || ''}
                    onChange={(e) =>
                      onFormChange((prev) => ({ ...prev, units: e.target.value }))
                    }
                    placeholder="kg / crates / litres"
                    required
                  />
                </label>
              </div>
              <label>
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={editRecordForm.notes || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows="3"
                />
              </label>
            </>
          )}

          {editingRecord.tab === 'activities' && (
            <>
              <label>
                <span>Activity Title</span>
                <input
                  name="title"
                  value={editRecordForm.title || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                <span>Activity Type</span>
                <input
                  name="type"
                  value={editRecordForm.type || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, type: e.target.value }))
                  }
                  placeholder="Maintenance / Feeding / Veterinary"
                  required
                />
              </label>
              <label>
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={editRecordForm.notes || ''}
                  onChange={(e) =>
                    onFormChange((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows="3"
                />
              </label>
            </>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={isSubmitting}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <FaSave /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
