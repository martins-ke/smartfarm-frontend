import { useState } from 'react';
import styles from './EmployeeModal.module.css';
import { registerEmployee } from '../../APIs/employee';
import { notify } from '../../utils/notify';
import { FaUserCheck, FaTimes } from 'react-icons/fa';

export function EmployeeModal({ isOpen, onClose, onSuccess, currentUserId }) {
  const [form, setForm] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    employmentType: 'CASUAL',
    dailyRate: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.idNumber.trim()) {
      notify('Worker name and National ID are required', 'error');
      return;
    }

    const cleanId = form.idNumber.trim();
    if (!/^\d{7,8}$/.test(cleanId)) {
      notify('National ID must be a valid 7 to 8 digit government ID number (Adult Age >= 18 verification)', 'error');
      return;
    }

    setLoading(true);
    try {
      await registerEmployee({
        fullName: form.fullName.trim(),
        idNumber: cleanId,
        phoneNumber: form.phoneNumber.trim(),
        employmentType: form.employmentType,
        dailyRate: Number(form.dailyRate || 0),
        registeredById: currentUserId
      });
      notify('Employee registered & adult identity verified! ✅', 'success');
      setForm({
        fullName: '',
        idNumber: '',
        phoneNumber: '',
        employmentType: 'CASUAL',
        dailyRate: ''
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to register employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3><FaUserCheck className={styles.headerIcon} /> Register Farm Employee (Labor Compliance)</h3>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>
        <p className={styles.complianceNote}>
          Strict labor compliance requires official government National ID verification to ensure legal adult workforce ($Age \ge 18$).
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Worker Full Legal Name *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Samuel Kiprono Cheruiyot" 
              value={form.fullName} 
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Kenyan National ID (7-8 Digits) *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 28475920" 
                value={form.idNumber} 
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phone / M-Pesa Payroll Number</label>
              <input 
                type="text" 
                placeholder="e.g. 0712345678" 
                value={form.phoneNumber} 
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Employment Classification</label>
              <select 
                value={form.employmentType} 
                onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
              >
                <option value="CASUAL">Casual / Daily Task Laborer</option>
                <option value="PERMANENT">Permanent / Monthly Staff</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Standard Daily Wage Rate (KES)</label>
              <input 
                type="number" 
                min="0" 
                placeholder="e.g. 800 (for 8-hr shift)" 
                value={form.dailyRate} 
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Verifying & Saving...' : 'Register Verified Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default EmployeeModal;
