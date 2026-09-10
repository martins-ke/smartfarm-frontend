import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTimes, FaSave } from 'react-icons/fa';

export function EditProjectModal({
  isOpen,
  onClose,
  projectForm,
  onFormChange,
  onSave,
  isSubmitting,
}) {
  if (!isOpen) return null;

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
              <h3>Edit Project</h3>
              <p>Update project details and budget</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={onSave} className={styles.modalForm}>
          <label>
            <span>Project Name</span>
            <input
              type="text"
              value={projectForm.name || ''}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </label>

          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>Season</span>
              <input
                type="text"
                value={projectForm.season || ''}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, season: e.target.value }))
                }
                placeholder="e.g. Q1 2026"
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>Status</span>
              <select
                value={projectForm.status || 'active'}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>Start Date</span>
              <input
                type="date"
                value={projectForm.startDate || ''}
                max={projectForm.endDate || undefined}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>End Date</span>
              <input
                type="date"
                value={projectForm.endDate || ''}
                min={projectForm.startDate || undefined}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                required
              />
            </label>
          </div>

          <label>
            <span>Budget (Ksh)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={projectForm.budget || ''}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, budget: e.target.value }))
              }
              required
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={projectForm.description || ''}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, description: e.target.value }))
              }
              rows="3"
            />
          </label>

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
