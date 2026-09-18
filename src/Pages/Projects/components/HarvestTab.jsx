import { useState, useEffect } from 'react';
import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { getGroupedUnitOptions, isCustomUnit, toCompoundDisplay } from '../../../utils/units';

const GROUP_OPTIONS = getGroupedUnitOptions();

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
  const selectedUnit = formState.units || '';
  const needsCustomFactor = selectedUnit && isCustomUnit(selectedUnit);
  const [customFactor, setCustomFactor] = useState('');

  // Reset custom factor when unit changes
  useEffect(() => {
    setCustomFactor('');
  }, [selectedUnit]);

  // Inject customFactor into form submission via a hidden-like mechanism:
  // we store it on formState.customFactor via a synthetic event
  const handleCustomFactorChange = (e) => {
    const val = e.target.value;
    setCustomFactor(val);
    // Propagate to parent form state
    onFieldChange({ target: { name: 'customFactor', value: val } });
  };

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
                min={0.01}
                name="quantity"
                value={formState.quantity || ''}
                onChange={onFieldChange}
                placeholder="150"
                required
              />
            </label>

            <label style={{ flex: 1 }}>
              <span>Unit</span>
              <select
                name="units"
                value={formState.units || ''}
                onChange={onFieldChange}
                required
                style={{ width: '100%' }}
              >
                <option value="" disabled>Select unit...</option>
                {GROUP_OPTIONS.map(group => (
                  <optgroup key={group.groupLabel} label={group.groupLabel}>
                    {group.options.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          {/* Custom unit: ask for conversion factor to base unit */}
          {needsCustomFactor && (
            <div
              style={{
                background: 'rgba(42,161,238,0.07)',
                border: '1px solid rgba(42,161,238,0.2)',
                borderRadius: '0.5rem',
                padding: '0.7rem 0.9rem',
                fontSize: '0.85rem',
              }}
            >
              <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)' }}>
                How many <strong>kg</strong> (or base units) does 1 <strong>{selectedUnit}</strong> equal?
              </p>
              <input
                type="number"
                step={0.01}
                min={0.01}
                value={customFactor}
                onChange={handleCustomFactorChange}
                placeholder={`e.g. 2 (if 1 ${selectedUnit} = 2 kg)`}
                required
                style={{ width: '100%' }}
              />
              {customFactor && formState.quantity && (
                <p style={{ margin: '0.4rem 0 0', color: '#10b981', fontSize: '0.8rem' }}>
                  ✓ {formState.quantity} {selectedUnit} = {(Number(formState.quantity) * Number(customFactor)).toFixed(2)} base units stored
                </p>
              )}
            </div>
          )}

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
              const unitKey = entry.units || entry.unit || 'kg';
              const qty = Number(entry.quantity || 0);
              const display = toCompoundDisplay(qty, unitKey);
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
                    <span className={styles.recordMeta}>{display}</span>
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
