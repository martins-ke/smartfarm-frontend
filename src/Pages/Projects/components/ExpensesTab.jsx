import { useState, useEffect } from 'react';
import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTrash, FaUserCheck, FaReceipt } from 'react-icons/fa';
import { getEmployees } from '../../../APIs/employee';

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
  const [expenseMode, setExpenseMode] = useState('general'); // 'general' | 'labor'
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [laborDays, setLaborDays] = useState(1);

  useEffect(() => {
    if (showRecordForm) {
      getEmployees(true)
        .then((res) => {
          setEmployees(Array.isArray(res) ? res : []);
        })
        .catch(() => setEmployees([]));
    }
  }, [showRecordForm]);

  const handleSelectWorker = (empId) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const rate = Number(emp.dailyRate || 0);
    const days = Number(laborDays || 1);
    const total = Math.round(rate * days * 100) / 100;

    onFieldChange({ target: { name: 'title', value: `Labor: ${emp.fullName}` } });
    onFieldChange({ target: { name: 'unitPrice', value: String(rate) } });
    onFieldChange({ target: { name: 'quantity', value: String(days) } });
    onFieldChange({ target: { name: 'amount', value: String(total) } });
    onFieldChange({
      target: {
        name: 'notes',
        value: `Farm labor: ${emp.fullName} [${emp.employmentType || 'CASUAL'}] for ${days} day(s) @ Ksh ${rate}/day`,
      },
    });
  };

  const handleDaysChange = (daysVal) => {
    setLaborDays(daysVal);
    const emp = employees.find((e) => e.id === selectedEmpId);
    const days = Number(daysVal || 0);
    if (emp) {
      const rate = Number(emp.dailyRate || 0);
      const total = Math.round(rate * days * 100) / 100;
      onFieldChange({ target: { name: 'quantity', value: String(days) } });
      onFieldChange({ target: { name: 'amount', value: String(total) } });
      onFieldChange({
        target: {
          name: 'notes',
          value: `Farm labor: ${emp.fullName} [${emp.employmentType || 'CASUAL'}] for ${days} day(s) @ Ksh ${rate}/day`,
        },
      });
    }
  };

  const selectedWorker = employees.find((e) => e.id === selectedEmpId);

  return (
    <>
      {showRecordForm && (
        <form onSubmit={onSubmit} className={styles.recordForm}>
          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                setExpenseMode('general');
                setSelectedEmpId('');
              }}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                background: expenseMode === 'general' ? 'var(--accent, #0284c7)' : 'transparent',
                color: expenseMode === 'general' ? '#fff' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <FaReceipt /> General Expense
            </button>
            <button
              type="button"
              onClick={() => setExpenseMode('labor')}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                background: expenseMode === 'labor' ? '#10b981' : 'transparent',
                color: expenseMode === 'labor' ? '#fff' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <FaUserCheck /> Worker Labor (Casual / Permanent)
            </button>
          </div>

          {/* Worker Labor Selection */}
          {expenseMode === 'labor' && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <label>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Farm Worker</span>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleSelectWorker(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-bg, transparent)',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">-- Choose registered worker --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} [{emp.employmentType || 'CASUAL'}] - Rate: Ksh {Number(emp.dailyRate || 0).toLocaleString()}/day
                    </option>
                  ))}
                </select>
              </label>

              {selectedWorker && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <label style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.8rem' }}>Days Worked</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="31"
                      value={laborDays}
                      onChange={(e) => handleDaysChange(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem' }}
                    />
                  </label>
                  <div
                    style={{
                      flex: 1.5,
                      padding: '0.45rem 0.6rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: 'var(--text)',
                    }}
                  >
                    <div>Rate: <strong>Ksh {Number(selectedWorker.dailyRate || 0).toLocaleString()}/day</strong></div>
                    <div style={{ color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                      Total: Ksh {(Number(selectedWorker.dailyRate || 0) * Number(laborDays || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <label>
            <span>Expense title</span>
            <input
              name="title"
              value={formState.title || ''}
              onChange={onFieldChange}
              placeholder={expenseMode === 'labor' ? 'e.g. Labor: John Doe' : 'Feed purchase'}
              required
            />
          </label>
          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>{expenseMode === 'labor' ? 'Daily Rate (Ksh)' : 'Unit Price (Ksh)'}</span>
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
              <span>{expenseMode === 'labor' ? 'Days / Quantity' : 'Quantity'}</span>
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
              placeholder={expenseMode === 'labor' ? 'Labor description e.g. Weeded 3 rows in Block B' : 'Expense detail'}
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
