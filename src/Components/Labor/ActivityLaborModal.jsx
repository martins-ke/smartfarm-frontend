import { useState, useEffect } from 'react';
import styles from './ActivityLaborModal.module.css';
import { getLaborAssignments, assignLabor } from '../../APIs/activity';
import { getEmployees } from '../../APIs/employee';
import { notify } from '../../utils/notify';
import { FaUsers, FaUserPlus, FaTimes, FaIdCard, FaClock, FaCalendarDay, FaMoneyBillWave } from 'react-icons/fa';
import { Spinner } from '../Spinner/Spinner';

export function ActivityLaborModal({ isOpen, onClose, activity, onLaborAssigned }) {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    unitType: 'days', // 'days' | 'hours'
    daysWorked: 1,
    hoursWorked: 8,
    notes: ''
  });

  const loadLaborData = async () => {
    if (!activity?.id) return;
    setLoading(true);
    try {
      const [empList, assignList] = await Promise.all([
        getEmployees(true).catch(() => []),
        getLaborAssignments(activity.id).catch(() => [])
      ]);
      setEmployees(Array.isArray(empList) ? empList : []);
      setAssignments(Array.isArray(assignList) ? assignList : []);
    } catch (_err) {
      notify('Failed to load labor data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLaborData();
    }
  }, [isOpen, activity?.id]);

  if (!isOpen || !activity) return null;

  const selectedEmployee = employees.find((emp) => emp.id === form.employeeId);
  const dailyRate = Number(selectedEmployee?.dailyRate || 0);
  const hourlyRate = dailyRate > 0 ? dailyRate / 8 : 0;

  const calculatedWage = form.unitType === 'days'
    ? Math.round(dailyRate * Number(form.daysWorked || 0) * 100) / 100
    : Math.round(hourlyRate * Number(form.hoursWorked || 0) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      notify('Please select a verified employee', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        employeeId: form.employeeId,
        daysWorked: form.unitType === 'days' ? Number(form.daysWorked || 1) : null,
        hoursWorked: form.unitType === 'hours' ? Number(form.hoursWorked || 8) : Number(form.daysWorked || 1) * 8,
        notes: form.notes
      };

      await assignLabor(activity.id, payload);
      notify(`Worker allocated! Ksh ${calculatedWage.toLocaleString()} added to project expenses ✅`, 'success');
      setForm({ employeeId: '', unitType: 'days', daysWorked: 1, hoursWorked: 8, notes: '' });
      loadLaborData();
      if (onLaborAssigned) {
        onLaborAssigned();
      }
    } catch (err) {
      notify(err.message || 'Failed to allocate worker', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = assignments.reduce((sum, a) => sum + Number(a.hoursWorked || 0), 0);
  const totalLaborCost = assignments.reduce((sum, a) => sum + Number(a.wagePayable || 0), 0);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div>
            <h3><FaUsers className={styles.headerIcon} /> Task Labor Roster: {activity.title}</h3>
            <p className={styles.subText}>Activity: {activity.type || 'Field Task'} • Project: {activity.project?.name || 'Current Project'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>

        {loading ? (
          <Spinner label="Loading labor roster..." />
        ) : (
          <div className={styles.body}>
            {/* Allocation Form */}
            <form onSubmit={handleSubmit} className={styles.assignForm}>
              <h4><FaUserPlus /> Allocate Worker & Charge Project Expense</h4>
              
              <div className={styles.formGroup}>
                <label>Select Farm Worker (Permanent / Casual) *</label>
                <select 
                  required 
                  value={form.employeeId} 
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                >
                  <option value="">-- Choose verified worker --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} [{emp.employmentType || 'CASUAL'}] - Rate: Ksh {Number(emp.dailyRate || 0).toLocaleString()}/day
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.6rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)'
                }}>
                  <span style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: selectedEmployee.employmentType === 'PERMANENT' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: selectedEmployee.employmentType === 'PERMANENT' ? '#38bdf8' : '#10b981'
                  }}>
                    {selectedEmployee.employmentType || 'CASUAL'}
                  </span>
                  <span>National ID: <strong>{selectedEmployee.idNumber || '-'}</strong></span>
                  <span style={{ marginLeft: 'auto' }}>Standard Rate: <strong>Ksh {dailyRate.toLocaleString()} / day</strong></span>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Calculation Basis</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, unitType: 'days' })}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--border)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        background: form.unitType === 'days' ? '#10b981' : 'transparent',
                        color: form.unitType === 'days' ? '#fff' : 'var(--text)'
                      }}
                    >
                      <FaCalendarDay style={{ marginRight: '4px' }} /> Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, unitType: 'hours' })}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--border)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        background: form.unitType === 'hours' ? '#10b981' : 'transparent',
                        color: form.unitType === 'hours' ? '#fff' : 'var(--text)'
                      }}
                    >
                      <FaClock style={{ marginRight: '4px' }} /> Hours
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>{form.unitType === 'days' ? 'Days Worked' : 'Hours Worked'}</label>
                  {form.unitType === 'days' ? (
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0.5" 
                      max="31" 
                      value={form.daysWorked} 
                      onChange={(e) => setForm({ ...form, daysWorked: e.target.value })}
                    />
                  ) : (
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0.5" 
                      max="24" 
                      value={form.hoursWorked} 
                      onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {/* Wage and Expense Preview */}
              {selectedEmployee && (
                <div className={styles.wagePreview}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaMoneyBillWave style={{ color: '#10b981', fontSize: '1rem' }} />
                    <span>Calculated Labor Wage:</span>
                  </div>
                  <span className={styles.wageHighlight}>Ksh {calculatedWage.toLocaleString()}</span>
                  <div style={{ width: '100%', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    💡 <em>This amount will be automatically charged to Project Expenses upon assignment.</em>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Task Remarks / Work Scope (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weeded 2 rows in block C" 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Allocating & Recording Expense...' : `Assign Worker & Charge Ksh ${calculatedWage.toLocaleString()}`}
              </button>
            </form>

            {/* Roster Summary */}
            <div className={styles.rosterSection}>
              <div className={styles.rosterHeader}>
                <h4>Allocated Labor Roster ({assignments.length})</h4>
                <div className={styles.rosterTotals}>
                  <span>Total Hours: <strong>{totalHours} hrs</strong></span>
                  <span>Total Labor Cost: <strong style={{ color: '#10b981' }}>Ksh {totalLaborCost.toLocaleString()}</strong></span>
                </div>
              </div>

              {assignments.length === 0 ? (
                <p className={styles.emptyRoster}>No workers assigned to this activity task yet.</p>
              ) : (
                <div className={styles.rosterList}>
                  {assignments.map((a) => (
                    <div key={a.id} className={styles.rosterCard}>
                      <div className={styles.workerInfo}>
                        <strong>{a.employee?.fullName || 'Worker'}</strong>
                        <span className={styles.workerId}><FaIdCard /> ID: {a.employee?.idNumber || '-'}</span>
                      </div>
                      <div className={styles.workMetrics}>
                        <span><FaClock /> {a.hoursWorked} hrs</span>
                        {a.wagePayable != null && (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>
                            Ksh {Number(a.wagePayable).toLocaleString()}
                          </span>
                        )}
                        {a.notes && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>{a.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ActivityLaborModal;
