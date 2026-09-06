import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

export function ExpensesTab({
  records = [],
  showRecordForm,
  formState,
  onFieldChange,
  onSubmit,
  isSubmitting,
  canModifyRecord,
  onOpenEditRecord,
  onDeleteRecord,
}) {
  return (
    <>
      {showRecordForm && (
        <form onSubmit={onSubmit} className={styles.recordForm}>
          <label>
            <span>Expense title</span>
            <input
              name="title"
              value={formState.title || ''}
              onChange={onFieldChange}
              placeholder="Feed purchase"
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
                value={formState.unitPrice || ''}
                onChange={onFieldChange}
                placeholder="100"
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>Quantity</span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="quantity"
                value={formState.quantity || ''}
                onChange={onFieldChange}
                placeholder="2"
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
              value={formState.amount || ''}
              onChange={onFieldChange}
              placeholder="200"
              required
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              name="notes"
              value={formState.notes || ''}
              onChange={onFieldChange}
              rows="3"
              placeholder="Expense detail"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save record'}
          </button>
        </form>
      )}

      <div className={styles.recordList}>
        <div className={styles.listHeader}>
          <h3 style={{ color: '#2aa1ee' }}>Expenses records</h3>
          <span>{records.length}</span>
        </div>

        {records.length === 0 ? (
          <p className={styles.emptyText}>No expenses recorded yet.</p>
        ) : (
          <ul>
            {records.slice(0, 15).map((entry) => {
              let meta = `Ksh ${Number(entry.amount || 0).toLocaleString()}`;
              if (entry.unitPrice && entry.quantity) {
                meta += ` (${entry.quantity} @ Ksh ${entry.unitPrice})`;
              }
              const date = entry?.added_on || entry?.date || 'N/A';

              return (
                <li key={entry.id} className={styles.recordItem}>
                  <div className={styles.recordTopRow}>
                    <strong className={styles.recordTitle}>{entry?.title || 'Expense'}</strong>
                    <div className={styles.recordActionGroup}>
                      {canModifyRecord && (
                        <>
                          <button
                            type="button"
                            className={styles.recordActionBtn}
                            onClick={() => onOpenEditRecord('expenses', entry)}
                            title="Edit Expense"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className={`${styles.recordActionBtn} ${styles.recordDeleteBtn}`}
                            onClick={() => onDeleteRecord('expenses', entry)}
                            title="Delete Expense"
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
