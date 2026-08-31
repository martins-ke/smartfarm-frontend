import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ProjectFormPage.module.css';
import { createProject } from '../../APIs/project';
import { FaFolderPlus, FaSave, FaTimes } from 'react-icons/fa';

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
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true); 

    try {
      // createProject returns the parsed JSON body. Treat the response as data.
      // send both category slug and numeric id in the body as requested
      const data = await createProject({ ...form, category, category_id });
      // If backend/mock returns an item object with id, or returns the id directly
      const newId = data?.id ?? data;
      if (newId) {
        navigate(`/categories/${category_id}/${category}`);
        setForm(initialState);
      } else {
        navigate(`/categories/${category}`);
      }
    } catch (error) {
      // show app-wide notification 
      import('../../utils/notify').then(({ notify }) => notify(error.message || 'Unable to create project', 'error'));
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
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
          </label>

          <label>
            <span>End date</span>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
          </label>

          <label>
            <span>Status</span>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="in_progress">In progress</option>
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
