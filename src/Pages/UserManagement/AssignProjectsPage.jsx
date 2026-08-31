import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './AssignProjectsPage.module.css';
import { fetchUsers, assignProjectsToSupervisor } from '../../APIs/user';
import { getAllProjects } from '../../APIs/project';
import { getCategories } from '../../APIs/category';
import { notify } from '../../utils/notify';
import { 
  FaArrowLeft, 
  FaCheck, 
  FaFolder, 
  FaUserTie, 
  FaCheckCircle, 
  FaLayerGroup,
  FaShieldAlt,
  FaExclamationCircle,
  FaSearch
} from 'react-icons/fa';

export default function AssignProjectsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [supervisor, setSupervisor] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, projectsRes, catsRes] = await Promise.all([
          fetchUsers(),
          getAllProjects(),
          getCategories().catch(() => ({ body: [] }))
        ]);

        const allUsers = usersRes?.body || [];
        const targetUser = allUsers.find(u => String(u.id) === String(userId));
        const allProjects = projectsRes?.body || [];
        const allCategories = catsRes?.body || [];

        if (!targetUser) {
          notify('Supervisor not found', 'error');
          navigate('/users');
          return;
        }

        setSupervisor(targetUser);
        setProjects(allProjects);
        setCategories(allCategories);

        // Pre-select projects currently assigned to this supervisor
        const existingAssignedIds = allProjects
          .filter(p => p.supervisor && String(p.supervisor.id) === String(userId))
          .map(p => p.id);
        setSelectedProjectIds(existingAssignedIds);
      } catch (err) {
        notify('Failed to load project assignment data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadData();
  }, [userId, navigate]);

  const toggleProject = (projId) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projId)) {
        return prev.filter(id => id !== projId);
      } else {
        return [...prev, projId];
      }
    });
  };

  const filteredProjects = projects.filter(p => {
    const matchesCategory = categoryFilter === 'ALL' || (p.category && p.category.id === categoryFilter);
    const matchesSearch = searchTerm.trim() === '' || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.season?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredProjects.map(p => p.id);
    setSelectedProjectIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearAllFiltered = () => {
    const filteredIds = new Set(filteredProjects.map(p => p.id));
    setSelectedProjectIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assignProjectsToSupervisor(userId, selectedProjectIds);
      notify(`Projects successfully assigned to ${supervisor?.username}!`, 'success');
      navigate('/users');
    } catch (err) {
      notify(err.message || 'Failed to save project assignments', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--muted)' }}>
          Loading project assignment portal...
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
          <p className={styles.eyebrow}>Supervisor Project Delegation</p>
          <h2>Assign Field Projects</h2>
          <p className={styles.headerSubtitle}>
            Select the specific projects that <strong>{supervisor?.username}</strong> will supervise, log records for, and oversee field labor.
          </p>
        </div>

        <div className={styles.userBadgeCard}>
          <div className={styles.userAvatar}>
            {supervisor?.username?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{supervisor?.username}</div>
            <div className={styles.userRole}>
              <FaUserTie style={{ marginRight: '0.3rem' }} />
              {supervisor?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Quick Selection Toolbar */}
      <div className={styles.controlsBar}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories ({projects.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search project name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.controlButtons}>
          <button type="button" className={styles.smallBtn} onClick={handleSelectAllFiltered}>
            Select Filtered
          </button>
          <button type="button" className={styles.smallBtn} onClick={handleClearAllFiltered}>
            Clear Filtered
          </button>
          <div className={styles.selectionCountBadge}>
            <FaFolder style={{ marginRight: '0.4rem' }} />
            {selectedProjectIds.length} of {projects.length} Assigned
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className={styles.emptyBox}>
          <FaLayerGroup style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }} />
          <p>No projects found matching your filter criteria.</p>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {filteredProjects.map((p) => {
            const isSelected = selectedProjectIds.includes(p.id);
            const currentSup = p.supervisor;
            const isAssignedToThisSupervisor = currentSup && String(currentSup.id) === String(userId);
            const isAssignedToOther = currentSup && String(currentSup.id) !== String(userId);

            return (
              <div
                key={p.id}
                className={`${styles.projectCard} ${isSelected ? styles.projectCardSelected : ''}`}
                onClick={() => toggleProject(p.id)}
              >
                <div className={styles.cardTop}>
                  <span className={styles.catPill}>{p.category?.name || 'Project'}</span>
                  <div className={`${styles.checkboxIndicator} ${isSelected ? styles.checkboxIndicatorSelected : ''}`}>
                    <FaCheck />
                  </div>
                </div>

                <div>
                  <h3 className={styles.projectName}>{p.name}</h3>
                  <p className={styles.projectSeason}>{p.season}</p>
                </div>

                <div className={styles.infoRow}>
                  <span>Budget:</span>
                  <strong>Ksh {Number(p.budget || 0).toLocaleString()}</strong>
                </div>

                <div className={styles.infoRow}>
                  <span>Status:</span>
                  <strong style={{ textTransform: 'capitalize' }}>{p.status || 'active'}</strong>
                </div>

                <div className={styles.statusRow}>
                  {isSelected ? (
                    <span className={`${styles.supervisorTag} ${styles.supervisorTagAssigned}`}>
                      <FaCheckCircle /> Supervised by {supervisor?.username}
                    </span>
                  ) : isAssignedToOther ? (
                    <span className={`${styles.supervisorTag} ${styles.supervisorTagOther}`}>
                      <FaExclamationCircle /> Current: {currentSup.username}
                    </span>
                  ) : (
                    <span className={`${styles.supervisorTag} ${styles.supervisorTagNone}`}>
                      ○ Unassigned
                    </span>
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
          <FaFolder style={{ color: '#22c55e' }} />
          <span>
            Assigning <strong>{selectedProjectIds.length}</strong> projects to <strong>{supervisor?.username}</strong>
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
            <FaCheck /> {isSaving ? 'Saving...' : 'Save Project Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
}
