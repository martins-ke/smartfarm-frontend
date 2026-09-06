import { useState } from 'react';
import styles from '../ProjectDashboardPage.module.css';
import { FaBoxes, FaTimes } from 'react-icons/fa';
import { useInventoryItem } from '../../../APIs/inventory';
import { notify } from '../../../utils/notify';

export function UseSuppliesModal({ items = [], projectId, onClose, onSuccess }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !quantity) return;

    setLoading(true);
    try {
      await useInventoryItem(selectedItemId, {
        projectId,
        quantity: Number(quantity),
        notes: `Used for project ${projectId}`,
      });
      onSuccess();
    } catch (err) {
      notify(err.message || 'Failed to use supplies', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div
              className={styles.modalHeaderIcon}
              style={{ background: '#e0f2fe', color: '#0284c7' }}
            >
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
            <label>
              <span>
                Select Supply <span className={styles.requiredStar}>*</span>
              </span>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setQuantity('');
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #d1d5db',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">-- Choose an item --</option>
                {items
                  .filter((i) => i.quantityInStock > 0)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantityInStock} {item.unit} available)
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {selectedItem && (
            <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label>
                <span>
                  Quantity Used ({selectedItem.unit}) <span className={styles.requiredStar}>*</span>
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedItem.quantityInStock}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '0.4rem',
                    border: '1px solid #d1d5db',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              {quantity && (
                <div
                  style={{
                    marginTop: '0.8rem',
                    padding: '0.8rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <span style={{ color: '#4b5563' }}>Unit Price:</span>
                    <strong>Ksh {selectedItem.unitPrice.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Total Expense Cost:</span>
                    <strong style={{ color: '#059669' }}>
                      Ksh {(Number(quantity) * selectedItem.unitPrice).toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.modalSubmitBtn}
              disabled={loading || !selectedItem}
            >
              {loading ? 'Processing...' : 'Confirm Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
