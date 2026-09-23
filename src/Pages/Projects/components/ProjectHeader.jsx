import styles from '../ProjectDashboardPage.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

export function ProjectHeader({
  categoryLabel,
  projectName,
  canEditProject,
  onOpenEditProject,
  canDeleteProject,
  onDeleteProject,
  isDeleting,
}) {
  return (
    <div className={styles.headerRow}>
      <div>
        <p className={styles.eyebrow}>{categoryLabel}</p>
        <h2>{projectName}</h2>
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {canEditProject && (
          <button
            type="button"
            className={styles.editProjectBtn}
            onClick={onOpenEditProject}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaEdit />Edit
            </span>
          </button>
        )}
        {canDeleteProject && (
          <button
            type="button"
            className={styles.deleteProjectBtn}
            onClick={onDeleteProject}
            disabled={isDeleting}
            title="Delete this empty project"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaTrash /> {isDeleting ? 'Deleting...' : ''}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
