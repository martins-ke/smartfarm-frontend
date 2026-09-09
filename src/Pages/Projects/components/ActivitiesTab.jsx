import { useState, useMemo } from 'react';
import styles from '../ProjectDashboardPage.module.css';
import { 
  FaEdit, 
  FaTrash, 
  FaUsers, 
  FaCalendarAlt, 
  FaCalendarPlus, 
  FaCheckCircle, 
  FaRegCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaBolt
} from 'react-icons/fa';

export function ActivitiesTab({
  records = [],
  showRecordForm,
  formState,
  onFieldChange,
  setFormState,
  onSubmit,
  isSubmitting,
  canModifyRecord,
  onOpenEditRecord,
  onDeleteRecord,
  onSelectActivityForLabor,
  onToggleStatus,
}) {
  const [filterTab, setFilterTab] = useState('ALL');

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const applyPreset = (daysAhead, defaultTitle, defaultType, defaultPriority = 'MEDIUM') => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const dateStr = targetDate.toISOString().split('T')[0];

    const dueDateObj = new Date(targetDate);
    dueDateObj.setDate(dueDateObj.getDate() + 2);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    if (setFormState) {
      setFormState((prev) => ({
        ...prev,
        activities: {
          ...prev.activities,
          title: defaultTitle,
          type: defaultType,
          scheduledDate: dateStr,
          dueDate: dueDateStr,
          priority: defaultPriority,
          status: 'SCHEDULED',
        },
      }));
    }
  };

  const getTaskStatusInfo = (item) => {
    const status = (item.status || 'SCHEDULED').toUpperCase();
    if (status === 'COMPLETED') {
      return {
        label: 'Completed',
        badgeClass: styles.statusBadgeSuccess,
        icon: <FaCheckCircle />,
        isOverdue: false,
        isCompleted: true,
      };
    }
    if (status === 'CANCELLED') {
      return {
        label: 'Cancelled',
        badgeClass: styles.statusBadgeMuted,
        icon: null,
        isOverdue: false,
        isCompleted: false,
      };
    }

    const targetDateStr = item.dueDate || item.scheduledDate || item.scheduled_date || item.added_on;
    if (!targetDateStr) {
      return {
        label: 'Scheduled',
        badgeClass: styles.statusBadgeInfo,
        icon: <FaClock />,
        isOverdue: false,
        isCompleted: false,
      };
    }

    const target = new Date(targetDateStr + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        label: `Overdue (${overdueDays}d ago)`,
        badgeClass: styles.statusBadgeDanger,
        icon: <FaExclamationTriangle />,
        isOverdue: true,
        isCompleted: false,
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        badgeClass: styles.statusBadgeWarning,
        icon: <FaBolt />,
        isOverdue: false,
        isCompleted: false,
      };
    } else if (diffDays === 1) {
      return {
        label: 'Due Tomorrow',
        badgeClass: styles.statusBadgeInfo,
        icon: <FaClock />,
        isOverdue: false,
        isCompleted: false,
      };
    } else {
      return {
        label: `In ${diffDays} days`,
        badgeClass: styles.statusBadgeInfo,
        icon: <FaCalendarAlt />,
        isOverdue: false,
        isCompleted: false,
      };
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const statusInfo = getTaskStatusInfo(item);
      if (filterTab === 'COMPLETED') return statusInfo.isCompleted;
      if (filterTab === 'OVERDUE') return statusInfo.isOverdue;
      if (filterTab === 'UPCOMING') return !statusInfo.isCompleted;
      return true;
    });
  }, [records, filterTab, todayStr]);

  const counts = useMemo(() => {
    let upcoming = 0;
    let completed = 0;
    let overdue = 0;
    records.forEach((item) => {
      const info = getTaskStatusInfo(item);
      if (info.isCompleted) completed++;
      else upcoming++;
      if (info.isOverdue) overdue++;
    });
    return { all: records.length, upcoming, completed, overdue };
  }, [records, todayStr]);

  return (
    <>
      {showRecordForm && (
        <form onSubmit={onSubmit} className={styles.recordForm}>
          {/* Quick Schedule Presets */}
          <div className={styles.taskPresetsContainer}>
            <span className={styles.taskPresetsLabel}>
              <FaCalendarPlus /> Quick Presets:
            </span>
            <div className={styles.taskPresetsBtnGroup}>
              <button
                type="button"
                className={styles.presetChipBtn}
                onClick={() => applyPreset(14, 'Spraying & Crop Protection', 'Field Care', 'HIGH')}
              >
                +2 Wks (Spraying)
              </button>
              <button
                type="button"
                className={styles.presetChipBtn}
                onClick={() => applyPreset(21, 'Weeding & Cultivation', 'Field Care', 'MEDIUM')}
              >
                +3 Wks (Weeding)
              </button>
              <button
                type="button"
                className={styles.presetChipBtn}
                onClick={() => applyPreset(28, 'Top-Dressing Fertilizer', 'Fertilization', 'HIGH')}
              >
                +4 Wks (Top-Dressing)
              </button>
              <button
                type="button"
                className={styles.presetChipBtn}
                onClick={() => applyPreset(60, 'Harvesting Season', 'Harvesting', 'URGENT')}
              >
                +2 Mos (Harvesting)
              </button>
            </div>
          </div>

          <label>
            <span>Activity / Task Title</span>
            <input
              name="title"
              value={formState.title || ''}
              onChange={onFieldChange}
              placeholder="e.g. 2nd Round Fungicide Spraying"
              required
            />
          </label>

          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>Type / Category</span>
              <input
                name="type"
                value={formState.type || ''}
                onChange={onFieldChange}
                placeholder="Field Care / Spraying / Health"
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>Priority</span>
              <select
                name="priority"
                value={formState.priority || 'MEDIUM'}
                onChange={onFieldChange}
                className={styles.formSelect}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent ⚡</option>
              </select>
            </label>
          </div>

          <div className={styles.formRow}>
            <label style={{ flex: 1 }}>
              <span>Scheduled Date</span>
              <input
                type="date"
                name="scheduledDate"
                value={formState.scheduledDate || ''}
                onChange={onFieldChange}
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>Due Date (Optional)</span>
              <input
                type="date"
                name="dueDate"
                value={formState.dueDate || ''}
                onChange={onFieldChange}
              />
            </label>
          </div>

          <label>
            <span>Notes & Guidelines</span>
            <textarea
              name="notes"
              value={formState.notes || ''}
              onChange={onFieldChange}
              rows="3"
              placeholder="Dosage, instructions, specific farm blocks, etc."
            />
          </label>

          <button type="submit" disabled={isSubmitting} className={styles.submitRecordBtn}>
            {isSubmitting ? 'Scheduling...' : 'Schedule / Log Activity'}
          </button>
        </form>
      )}

      <div className={styles.recordList}>
        <div className={styles.listHeader}>
          <div className={styles.taskHeaderWithTabs}>
            <h3 style={{ color: '#2aa1ee', margin: 0 }}>Farm Activities & Tasks</h3>
            <div className={styles.taskFilterTabs}>
              <button
                type="button"
                className={`${styles.taskTabBtn} ${filterTab === 'ALL' ? styles.taskTabBtnActive : ''}`}
                onClick={() => setFilterTab('ALL')}
              >
                All <span>{counts.all}</span>
              </button>
              <button
                type="button"
                className={`${styles.taskTabBtn} ${filterTab === 'UPCOMING' ? styles.taskTabBtnActive : ''}`}
                onClick={() => setFilterTab('UPCOMING')}
              >
                Upcoming <span>{counts.upcoming}</span>
              </button>
              {counts.overdue > 0 && (
                <button
                  type="button"
                  className={`${styles.taskTabBtn} ${styles.taskTabOverdue} ${filterTab === 'OVERDUE' ? styles.taskTabBtnActive : ''}`}
                  onClick={() => setFilterTab('OVERDUE')}
                >
                  Overdue <span>{counts.overdue}</span>
                </button>
              )}
              <button
                type="button"
                className={`${styles.taskTabBtn} ${filterTab === 'COMPLETED' ? styles.taskTabBtnActive : ''}`}
                onClick={() => setFilterTab('COMPLETED')}
              >
                Completed <span>{counts.completed}</span>
              </button>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <p className={styles.emptyText}>
            {filterTab === 'ALL' ? 'No farm tasks recorded yet.' : `No ${filterTab.toLowerCase()} tasks found.`}
          </p>
        ) : (
          <ul className={styles.taskListUl}>
            {filteredRecords.slice(0, 30).map((entry) => {
              const meta = entry.type || 'Activity';
              const dateStr = entry.scheduledDate || entry.scheduled_date || entry.added_on || entry.date || 'N/A';
              const statusInfo = getTaskStatusInfo(entry);
              const priority = (entry.priority || 'MEDIUM').toUpperCase();

              return (
                <li 
                  key={entry.id} 
                  className={`${styles.taskCardItem} ${statusInfo.isCompleted ? styles.taskCardCompleted : ''}`}
                >
                  <div className={styles.taskCardMain}>
                    {/* Left: Quick complete toggle button */}
                    <button
                      type="button"
                      className={`${styles.taskCompleteToggleBtn} ${statusInfo.isCompleted ? styles.toggleCompleted : ''}`}
                      onClick={() => onToggleStatus && onToggleStatus(entry)}
                      title={statusInfo.isCompleted ? 'Mark as scheduled / incomplete' : 'Mark task as complete'}
                    >
                      {statusInfo.isCompleted ? <FaCheckCircle /> : <FaRegCircle />}
                    </button>

                    {/* Middle: Info */}
                    <div className={styles.taskCardDetails}>
                      <div className={styles.taskCardTitleRow}>
                        <strong className={`${styles.taskTitleText} ${statusInfo.isCompleted ? styles.taskCompletedText : ''}`}>
                          {entry.title || 'Farm Activity'}
                        </strong>

                        {/* Priority Badge */}
                        <span className={`${styles.priorityBadge} ${styles['priority' + priority]}`}>
                          {priority}
                        </span>

                        {/* Status / Countdown Badge */}
                        <span className={`${styles.statusBadge} ${statusInfo.badgeClass}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </div>

                      <div className={styles.taskCardMetaRow}>
                        <span className={styles.taskCategoryTag}>{meta}</span>
                        <span className={styles.taskDateText}>
                          <FaCalendarAlt style={{ fontSize: '0.75rem', opacity: 0.7 }} /> Scheduled: {dateStr}
                        </span>
                        {entry.dueDate && entry.dueDate !== dateStr && (
                          <span className={styles.taskDateText}>
                            Due: {entry.dueDate}
                          </span>
                        )}
                        {entry.notes && (
                          <span className={styles.taskNotesSnippet} title={entry.notes}>
                            📝 {entry.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
