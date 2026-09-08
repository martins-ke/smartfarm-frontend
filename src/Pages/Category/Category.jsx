import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Category.module.css';
import { getCategories, updateCategory, deleteCategory } from '../../APIs/category';
import { Spinner } from '../../Components/Spinner/Spinner';
import { notify, confirmModal } from '../../utils/notify';
import { FaEdit, FaTrash, FaTimes, FaSave, FaFolderPlus } from 'react-icons/fa';
import useAuth from '../../useAuth';

const icons = { crops: '🌾', livestock: '🐄', poultry: '🐔' };

export function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const role = (currentUser?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isSupervisor = role === 'SUPERVISOR';
  const canCreateCategory = isAdmin || (isManager && currentUser?.privileges?.includes('CAN_CREATE_CATEGORIES'));
  const canEditOrDelete = isAdmin;

  const loadCategories = async () => {
    try {
      const request = await getCategories();
      const data = request.body;
      setCategories(Array.isArray(data) ? data : []);
    } catch (_err) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenEdit = (e, cat) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setEditForm({ name: cat.name || '', description: cat.description || '' });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      notify('Category name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateCategory(editingCategory.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      notify(res.message || 'Category updated successfully ✅', 'success');
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      notify(err.message || 'Failed to update category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e, cat) => {
    e.stopPropagation();
    const confirmed = await confirmModal({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    setDeletingId(cat.id);
    try {
      const res = await deleteCategory(cat.id);
      notify(res.message || 'Category deleted successfully ✅', 'success');
      loadCategories();
    } catch (err) {
      notify(err.message || 'Failed to delete category', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Categories</h2>
        {canCreateCategory && (
          <button className={styles.addBtn} onClick={() => navigate('/categories/new')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaFolderPlus /> Add Category
            </span>
          </button>
        )}
      </div>

      <main className={styles.content}>
        {loading ? (
          <Spinner fullPage label="Loading categories..." />
        ) : categories && categories.length > 0 ? (
          <div className={styles.cards}>
            {categories.map((c) => (
              <div
                key={c.id}
                className={styles.card}
                onClick={() => {
                  navigate(`/categories/${c.id}/${c.name.toLowerCase()}`);
                }}
                role="button"
                tabIndex={0}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div className={styles.cardIcon}>
                    {icons[c.name.toLowerCase()] ? icons[c.name.toLowerCase()] : '📁'}
                  </div>
                  {canEditOrDelete && (
                    <div style={{ display: 'flex', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.actionIconBtn}
                        onClick={(e) => handleOpenEdit(e, c)}
                        title="Edit Category"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                        onClick={(e) => handleDelete(e, c)}
                        title="Delete Category"
                        disabled={deletingId === c.id}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.cardTitle}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</div>
                {c.description && <div className={styles.cardDesc}>{c.description}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              {isSupervisor
                ? 'No Supervised Sectors'
                : isManager
                ? 'No Farm Categories Assigned'
                : 'No Categories Available'}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              {isSupervisor
                ? 'You do not have any projects or sectors assigned to your supervision yet.'
                : isManager
                ? 'You do not have any farm sectors assigned to your portfolio yet. Please contact an Administrator to assign categories.'
                : 'No farm categories or sectors have been registered in the system yet.'}
            </p>
            {canCreateCategory && (
              <button className={styles.addBtn} onClick={() => navigate('/categories/new')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <FaFolderPlus /> Add Category
                </span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className={styles.modalOverlay} onClick={() => setEditingCategory(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FaEdit style={{ color: '#2b8a3e', fontSize: '1.25rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Edit Category</h3>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setEditingCategory(null)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Category Name</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Crops"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Description</label>
                <textarea
                  className={styles.modalTextarea}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description..."
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setEditingCategory(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                  disabled={isSubmitting}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FaSave /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
