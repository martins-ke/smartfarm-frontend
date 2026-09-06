import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

export function HarvestTab({
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
            <span>Harvest item</span>
            <input
              name="item"
              value={formState.item || ''}
              onChange={onFieldChange}
              placeholder="Maize / Eggs / Milk"
              required
            />
          </label>
          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>Quantity</span>
              <input
                type="number"
                step={0.01}
                min={0}
                name="quantity"
                value={formState.quantity || ''}
                onChange={onFieldChange}
                placeholder="150"
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>Units</span>
              <input
                type="text"
                name="units"
                value={formState.units || ''}
                onChange={onFieldChange}
                placeholder="kg / crates / litres"
                required
              />
            </label>
          </div>
          <label>
            <span>Notes</span>
            <textarea
              name="notes"
              value={formState.notes || ''}
              onChange={onFieldChange}
              rows="3"
              placeholder="Harvest details"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save record'}
          </button>
        </form>
      )}

      <div className={styles.recordList}>
        <div className={styles.listHeader}>
          <h3 style={{ color: '#2aa1ee' }}>Harvest records</h3>
          <span>{records.length}</span>
        </div>

        {records.length === 0 ? (
          <p className={styles.emptyText}>No harvest recorded yet.</p>
        ) : (
          <ul>
            {records.slice(0, 15).map((entry) => {
              const units = entry.units || entry.unit || '';
              const meta = `${entry.quantity || 0} ${units}`.trim();
              const date = entry?.added_on || entry?.date || 'N/A';

              return (
                <li key={entry.id} className={styles.recordItem}>
                  <div className={styles.recordTopRow}>
                    <strong className={styles.recordTitle}>{entry?.item || 'Harvest'}</strong>
                    <div className={styles.recordActionGroup}>
                      {canModifyRecord && (
                        <>
                          <button
                            type="button"
                            className={styles.recordActionBtn}
                            onClick={() => onOpenEditRecord('harvest', entry)}
                            title="Edit Harvest"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className={`${styles.recordActionBtn} ${styles.recordDeleteBtn}`}
                            onClick={() => onDeleteRecord('harvest', entry)}
                            title="Delete Harvest"
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
