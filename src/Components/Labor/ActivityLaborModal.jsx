import React, { useEffect, useState } from 'react';
import styles from './ActivityLaborModal.module.css';
import { getLaborAssignments, assignLabor } from '../../APIs/activity';
import { getEmployees } from '../../APIs/employee';
import { notify } from '../../utils/notify';
import { FaUsers, FaUserPlus, FaTimes, FaIdCard, FaMoneyBillWave, FaClock, FaCheckCircle } from 'react-icons/fa';
import { Spinner } from '../Spinner/Spinner';

export function ActivityLaborModal({ isOpen, onClose, activity }) {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
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
    } catch (err) {
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

  const selectedEmployee = employees.find(e => e.id === form.employeeId);
  const dailyRate = selectedEmployee ? Number(selectedEmployee.dailyRate || 0) : 0;
  const hours = Number(form.hoursWorked || 8);
  const calculatedWage = ((dailyRate / 8) * hours).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId) {
      notify('Please select a verified employee', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await assignLabor(activity.id, {
        employeeId: form.employeeId,
        hoursWorked: hours,
        notes: form.notes
      });
      notify('Worker allocated to task & wage calculated! ✅', 'success');
      setForm({ employeeId: '', hoursWorked: 8, notes: '' });
      loadLaborData();
    } catch (err) {
      notify(err.message || 'Failed to allocate worker', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalWages = assignments.reduce((sum, a) => sum + Number(a.wagePayable || 0), 0);
  const totalHours = assignments.reduce((sum, a) => sum + Number(a.hoursWorked || 0), 0);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div>
            <h3><FaUsers className={styles.headerIcon} /> Task Labor Roster: {activity.title}</h3>
            <p className={styles.subText}>Activity Type: {activity.type || 'Field Task'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>

        {loading ? (
          <Spinner label="Loading labor roster..." />
        ) : (
          <div className={styles.body}>
            {/* Allocation Form */}
            <form onSubmit={handleSubmit} className={styles.assignForm}>
              <h4><FaUserPlus /> Allocate Verified Worker</h4>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Select Verified Employee *</label>
                  <select 
                    required 
                    value={form.employeeId} 
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  >
                    <option value="">-- Choose verified worker --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} (ID: {emp.idNumber} | KES {Number(emp.dailyRate || 0).toLocaleString()}/day)
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Hours Worked (Shift)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="1" 
                    max="16" 
                    value={form.hoursWorked} 
                    onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
                  />
                </div>
              </div>

              {selectedEmployee && (
                <div className={styles.wagePreview}>
                  <span>Base Rate: <strong>KES {dailyRate.toLocaleString()} / day</strong></span>
                  <span>Calculated Wage Payable: <strong className={styles.wageHighlight}>KES {calculatedWage}</strong></span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Task Output / Remarks (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weeded 3 rows in Sector B" 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Assigning...' : 'Assign Worker & Compute Wage'}
              </button>
            </form>

            {/* Roster Summary */}
            <div className={styles.rosterSection}>
              <div className={styles.rosterHeader}>
                <h4>Allocated Labor Roster ({assignments.length})</h4>
                <div className={styles.rosterTotals}>
                  <span>Total Hours: <strong>{totalHours} hrs</strong></span>
                  <span>Total Labor Wage: <strong className={styles.wageHighlight}>KES {totalWages.toLocaleString()}</strong></span>
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
                        <span className={styles.wageBadge}>KES {Number(a.wagePayable || 0).toLocaleString()}</span>
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
