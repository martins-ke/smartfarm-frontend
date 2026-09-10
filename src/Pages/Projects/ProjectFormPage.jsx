import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProjectFormPage.module.css';
import { createProject } from '../../APIs/project';
import { notify } from '../../utils/notify';
import { FaFolderPlus, FaSave, FaTimes } from 'react-icons/fa';
import useAuth from '../../useAuth';

const initialState = {
  name: '',
  season: '',
  status: 'active',
  startDate: '',
  endDate: '',
  budget: '',
  description: ''
};

export function ProjectFormPage() {
  const { category_id, category } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = (currentUser?.role || '').toUpperCase();
  const isManager = role === 'MANAGER';
  const isAdmin = role === 'ADMIN';

  const isAssignedManager = isManager && (
    currentUser?.assignedCategories?.some(
      (c) => c.id === category_id || (c.name && c.name.toLowerCase() === category?.toLowerCase())
    )
  );

  const userPrivileges = currentUser?.privileges || [];
  const canManageBudgets = isAdmin || (isManager && userPrivileges.includes('CAN_MANAGE_BUDGETS'));
  const canCreateProject = isAdmin || (isAssignedManager && canManageBudgets);

  useEffect(() => {
    if (currentUser && !canCreateProject) {
      notify('Access Denied: You do not have privilege to create projects or manage budgets.', 'error');
      navigate(category_id && category ? `/categories/${category_id}/${category}` : '/categories');
    }
  }, [currentUser, canCreateProject, navigate, category_id, category]);

  const categoryLabel = useMemo(
    () => category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Project',
    [category]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      notify('Start date cannot be greater than end date!', 'error');
      return;
    }

    setIsSubmitting(true); 

    try {
      // createProject returns the parsed JSON body. Treat the response as data.
      // send both category slug and numeric id in the body as requested
      const data = await createProject({ ...form, category, category_id });
      notify(`Project "${form.name}" created successfully ✅`, 'success');

      // If backend/mock returns an item object with id, or returns the id directly
      const newId = data?.id ?? data;
      if (newId) {
        navigate(`/categories/${category_id}/${category}`);
        setForm(initialState);
      } else {
        navigate(`/categories/${category}`);
      }
    } catch (error) {
      notify(error.message || 'Unable to create project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}><span style={{ display: 'inline-flex', marginRight: '0.45rem' }}><FaFolderPlus /></span>Create project</p>
          <h2>{categoryLabel}</h2>
        </div>
      </div>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <label>
            <span>Project name</span>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Dairy herd 2026" required />
          </label>

          <label>
            <span>Season</span>
            <input name="season" value={form.season} onChange={handleChange} placeholder="e.g. Q1 2026" required />
          </label>

          <label>
            <span>Start date</span>
            <input type="date" name="startDate" value={form.startDate} max={form.endDate || undefined} onChange={handleChange} required />
          </label>

          <label>
            <span>End date</span>
            <input type="date" name="endDate" value={form.endDate} min={form.startDate || undefined} onChange={handleChange} required />
          </label>

          <label>
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            <span>Budget (Ksh)</span>
            <input type="number" name="budget" value={form.budget} onChange={handleChange} placeholder="450000" required />
          </label>
        </div>

        <label>
          <span>Description</span>
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Optional: add a brief description for this project" />
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => navigate(`/categories/${category_id}/${category}`)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaTimes />
              Cancel
            </span>
          </button>
          <button type="submit" className={styles.btn} disabled={isSubmitting}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaSave />
              {isSubmitting ? 'Saving...' : 'Create project'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
