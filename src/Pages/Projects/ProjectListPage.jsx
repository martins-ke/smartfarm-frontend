import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProjectListPage.module.css';
import { getProjectsByCategory, updateProjectStatus } from '../../APIs/project';
import useAuth from '../../useAuth';
import { FaFolderOpen, FaMoneyBillWave, FaPlus, FaArrowRight, FaChevronDown, FaCheck } from 'react-icons/fa';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active',    color: '#22c55e' },
  { value: 'completed', label: 'Completed', color: '#3b82f6' },
];

function StatusDot({ color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}88`,
      }}
    />
  );
}

function StatusDropdown({ value, projectId, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async newStatus => {
    setOpen(false);
    if (newStatus !== value) onChange(projectId, newStatus);
  };

  return (
    <div ref={ref} className={styles.statusDropdown}>
      <button
        type="button"
        className={`${styles.statusBtn} ${styles[value] || ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <StatusDot color={current.color} />
        <span>{current.label}</span>
        <FaChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <ul className={styles.statusMenu} role="listbox">
          {STATUS_OPTIONS.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`${styles.statusOption} ${opt.value === value ? styles.statusOptionActive : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <StatusDot color={opt.color} />
              <span>{opt.label}</span>
              {opt.value === value && <FaCheck className={styles.checkIcon} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectListPage() {
  const { category_id, category } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const role = (currentUser?.role || '').toUpperCase();
  const isSupervisor = role === 'SUPERVISOR';
  const isManager = role === 'MANAGER';
  const isAdmin = role === 'ADMIN';

  // Check if manager is assigned to this category
  const isAssignedManager = isManager && (
    currentUser?.assignedCategories?.some(
      (c) => c.id === category_id || (c.name && c.name.toLowerCase() === category?.toLowerCase())
    )
  );

  const userPrivileges = currentUser?.privileges || [];
  const canManageBudgets = isAdmin || (isManager && userPrivileges.includes('CAN_MANAGE_BUDGETS'));
  const canCreateProject = isAdmin || (isAssignedManager && canManageBudgets);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  const categoryLabel = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Category';

  const loadProjects = async (currentPage = page) => {
    setLoading(true);
    setLoadError(null);
    try {
      const request = await getProjectsByCategory(category_id, category, currentPage, PAGE_SIZE);
      const pageData = request.body;
      setProjects(pageData?.content || []);
      setTotalPages(pageData?.totalPages ?? 0);
      setTotalElements(pageData?.totalElements ?? 0);
    } catch (err) {
      setLoadError(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(page);
  }, [category_id, category, page]);

  const handleStatusChange = async (projectId, newStatus) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, status: newStatus } : p))
    );
    setUpdatingId(projectId);
    try {
      await updateProjectStatus(projectId, newStatus);
    } catch {
      loadProjects(page);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Category</p>
          <h2>{categoryLabel}</h2>
        </div>
        {canCreateProject && (
          <button
            className={styles.create_btn}
            onClick={() => navigate(`/categories/${category_id}/${category}/new`)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaPlus />
              New project
            </span>
          </button>
        )}
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '0.4rem' }}>
              <FaFolderOpen />
            </span>
            {isSupervisor ? 'Assigned projects' : 'Total projects'}
          </span>
          <strong>{totalElements || projects.length}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Active</span>
          <strong>
            {projects.filter(p => String(p.status).toLowerCase() === 'active').length}
          </strong>
        </div>
        <div className={styles.summaryCard}>
          <span>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '0.4rem' }}>
              <FaMoneyBillWave />
            </span>
            Budget
          </span>
          <strong>
            Ksh {projects.reduce((t, p) => t + Number(p.budget || 0), 0).toLocaleString()}
          </strong>
        </div>
      </div>

      {loading ? (
        <Spinner fullPage label="Loading projects..." />
      ) : loadError && projects.length === 0 ? (
        <ErrorState
          error={loadError}
          title="Could Not Load Projects"
          onRetry={() => loadProjects(page)}
          variant="card"
        />
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{isSupervisor ? 'No assigned projects found for you in this category.' : 'No projects found for this category.'}</p>
          {canCreateProject && (
            <button onClick={() => navigate(`/categories/${category_id}/${category}/new`)}>
              Create first project
            </button>
          )}
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {projects.map(project => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.cardTopRow}>
                <h3>{project.name}</h3>
                <StatusDropdown
                  value={String(project.status || 'active').toLowerCase()}
                  projectId={project.id}
                  disabled={updatingId === project.id || (!isAdmin && !canManageBudgets && !isSupervisor)}
                  onChange={handleStatusChange}
                />
              </div>

              <p className={styles.meta}>{project.season}</p>
              <p className={styles.description}>{project.description || 'No description provided.'}</p>

              <div className={styles.infoRow}>
                <span>Budget</span>
                <strong>Ksh {Number(project.budget || 0).toLocaleString()}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Period</span>
                <strong>
                  {project.startDate || 'N/A'} → {project.endDate || 'N/A'}
                </strong>
              </div>

              <button
                className={styles.secondaryButton}
                onClick={() => navigate(`/categories/${category}/projects/${project.id}`)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <FaArrowRight />
                  Open dashboard
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {totalElements} projects
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
