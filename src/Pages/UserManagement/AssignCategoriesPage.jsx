import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './AssignCategoriesPage.module.css';
import { fetchUsers, assignCategoriesToUser } from '../../APIs/user';
import { getCategories } from '../../APIs/category';
import { notify } from '../../utils/notify';
import { 
  FaArrowLeft, 
  FaCheck, 
  FaTags, 
  FaUserTie, 
  FaLeaf, 
  FaCheckCircle, 
  FaLayerGroup,
  FaShieldAlt
} from 'react-icons/fa';
import { GiChicken, GiCow, GiWheat, GiPlantRoots } from 'react-icons/gi';

export default function AssignCategoriesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [manager, setManager] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, catsRes] = await Promise.all([
          fetchUsers(),
          getCategories()
        ]);

        const allUsers = usersRes?.body || [];
        const targetUser = allUsers.find(u => String(u.id) === String(userId));
        const allCategories = catsRes?.body || [];

        if (!targetUser) {
          notify('Manager not found', 'error');
          navigate('/users');
          return;
        }

        setManager(targetUser);
        setCategories(allCategories);

        // Pre-select already assigned categories
        const existingIds = (targetUser.assignedCategories || []).map(c => c.id);
        setSelectedCatIds(existingIds);
      } catch (err) {
        notify('Failed to load category assignment data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadData();
  }, [userId, navigate]);

  const toggleCategory = (catId) => {
    setSelectedCatIds(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedCatIds(categories.map(c => c.id));
  };

  const handleClearAll = () => {
    setSelectedCatIds([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assignCategoriesToUser(userId, selectedCatIds);
      notify(`Categories assigned to ${manager?.username} successfully!`, 'success');
      navigate('/users');
    } catch (err) {
      notify(err.message || 'Failed to save category assignments', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (catName = '') => {
    const name = catName.toLowerCase();
    if (name.includes('poultry') || name.includes('chicken')) return <GiChicken />;
    if (name.includes('livestock') || name.includes('cattle') || name.includes('cow')) return <GiCow />;
    if (name.includes('crop') || name.includes('grain')) return <GiWheat />;
    if (name.includes('veg') || name.includes('plant')) return <GiPlantRoots />;
    return <FaLeaf />;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted)' }}>
          Loading category assignment portal...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Top Back Navigation */}
      <button className={styles.backBtn} onClick={() => navigate('/users')}>
        <FaArrowLeft /> Back to Staff Management
      </button>

      {/* Header Profile Banner */}
      <div className={styles.headerCard}>
        <div>
          <p className={styles.eyebrow}>Management Authority Delegation</p>
          <h2>Assign Farm Categories</h2>
          <p className={styles.headerSubtitle}>
            Select the categories that <strong>{manager?.username}</strong> has authority to oversee, create projects in, and assign to supervisors.
          </p>
        </div>

        <div className={styles.userBadgeCard}>
          <div className={styles.userAvatar}>
            {manager?.username?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{manager?.username}</div>
            <div className={styles.userRole}>
              <FaShieldAlt style={{ marginRight: '0.3rem' }} />
              {manager?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Selection Toolbar */}
      <div className={styles.controlsBar}>
        <div className={styles.controlButtons}>
          <button type="button" className={styles.smallBtn} onClick={handleSelectAll}>
            Select All
          </button>
          <button type="button" className={styles.smallBtn} onClick={handleClearAll}>
            Clear All
          </button>
        </div>

        <div className={styles.selectionCountBadge}>
          <FaTags style={{ marginRight: '0.4rem' }} />
          {selectedCatIds.length} of {categories.length} Categories Selected
        </div>
      </div>

      {/* Interactive Category Cards */}
      {categories.length === 0 ? (
        <div className={styles.emptyBox}>
          <FaLayerGroup style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }} />
          <p>No categories created on this farm yet.</p>
          <button className={styles.smallBtn} onClick={() => navigate('/categories/new')}>
            Create New Category
          </button>
        </div>
      ) : (
        <div className={styles.categoryGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCatIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                className={`${styles.categoryCard} ${isSelected ? styles.categoryCardSelected : ''}`}
                onClick={() => toggleCategory(cat.id)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.catIconWrap}>
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div className={`${styles.checkboxIndicator} ${isSelected ? styles.checkboxIndicatorSelected : ''}`}>
                    <FaCheck />
                  </div>
                </div>

                <div className={styles.catDetails}>
                  <h3>{cat.name}</h3>
                  <p>{cat.description || 'Standard agricultural production domain.'}</p>
                </div>

                <div className={`${styles.statusIndicator} ${isSelected ? styles.statusIndicatorActive : ''}`}>
                  {isSelected ? (
                    <>
                      <FaCheckCircle /> Assigned to {manager?.username}
                    </>
                  ) : (
                    'Click card to assign'
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className={styles.stickyBottomBar}>
        <div className={styles.barLeft}>
          <FaTags style={{ color: '#2aa1ee' }} />
          <span>
            Assigning <strong>{selectedCatIds.length}</strong> categories to <strong>{manager?.username}</strong>
          </span>
        </div>

        <div className={styles.barActions}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={() => navigate('/users')}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={isSaving}
          >
            <FaCheck /> {isSaving ? 'Saving...' : 'Save Category Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}
