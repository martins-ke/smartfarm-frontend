import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTrash, FaUsers } from 'react-icons/fa';

export function ActivitiesTab({
  records = [],
  showRecordForm,
  formState,
  onFieldChange,
  onSubmit,
  isSubmitting,
  canModifyRecord,
  onOpenEditRecord,
  onDeleteRecord,
  onSelectActivityForLabor,
}) {
  return (
    <>
      {showRecordForm && (
        <form onSubmit={onSubmit} className={styles.recordForm}>
          <label>
            <span>Activity title</span>
            <input
              name="title"
              value={formState.title || ''}
              onChange={onFieldChange}
              placeholder="Vaccination"
              required
            />
          </label>
          <label>
            <span>Type</span>
            <input
              name="type"
              value={formState.type || ''}
              onChange={onFieldChange}
              placeholder="Health / Routine / Field"
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
              placeholder="Add notes"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save record'}
          </button>
        </form>
      )}

      <div className={styles.recordList}>
        <div className={styles.listHeader}>
          <h3 style={{ color: '#2aa1ee' }}>Activities records</h3>
          <span>{records.length}</span>
        </div>

        {records.length === 0 ? (
          <p className={styles.emptyText}>No activities recorded yet.</p>
        ) : (
          <ul>
            {records.slice(0, 15).map((entry) => {
              const meta = entry.type || 'Activity';
              const date = entry?.added_on || entry?.date || 'N/A';

              return (
                <li key={entry.id} className={styles.recordItem}>
                  <div className={styles.recordTopRow}>
                    <strong className={styles.recordTitle}>{entry?.title || 'Activity'}</strong>
                    <div className={styles.recordActionGroup}>
                      <button
                        type="button"
                        className={styles.recordActionBtn}
                        onClick={() => onSelectActivityForLabor(entry)}
                        title="Labor Task Roster & Wage Allocation"
                        style={{ color: '#10b981' }}
                      >
                        <FaUsers />
                      </button>

                      {canModifyRecord && (
                        <>
                          <button
                            type="button"
                            className={styles.recordActionBtn}
                            onClick={() => onOpenEditRecord('activities', entry)}
                            title="Edit Activity"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className={`${styles.recordActionBtn} ${styles.recordDeleteBtn}`}
                            onClick={() => onDeleteRecord('activities', entry)}
                            title="Delete Activity"
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
