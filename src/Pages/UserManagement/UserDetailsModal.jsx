import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserDetailsModal.module.css';
import { getUserById, getSupervisorProjects, updateUserStatus, deleteUser } from '../../APIs/user';
import { notify } from '../../utils/notify';
import { 
  FaTimes, 
  FaUserShield, 
  FaCrown, 
  FaUserTie, 
  FaTags, 
  FaFolder, 
  FaCheckCircle, 
  FaBan, 
  FaTrash, 
  FaExternalLinkAlt,
  FaIdBadge,
  FaCheck,
  FaShieldAlt
} from 'react-icons/fa';

export default function UserDetailsModal({ userId, currentAdminUser, onClose, onUserUpdated }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [supervisedProjects, setSupervisedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = currentAdminUser?.role?.toUpperCase() === 'ADMIN';

  const loadUserDetails = async () => {
    setLoading(true);
    try {
      const res = await getUserById(userId);
      const userData = res?.body;
      setUser(userData);

      if (userData?.role?.toUpperCase() === 'SUPERVISOR') {
        const projRes = await getSupervisorProjects(userId).catch(() => ({ body: [] }));
        setSupervisedProjects(projRes?.body || []);
      }
    } catch (err) {
      notify('Failed to load user details', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadUserDetails();
  }, [userId]);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await updateUserStatus(userId, newStatus);
      notify(`User status changed to ${newStatus}`, 'success');
      loadUserDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      notify(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently remove user "${user?.username}"?`)) return;
    setActionLoading(true);
    try {
      await deleteUser(userId);
      notify(`User ${user?.username} deleted`, 'success');
      if (onUserUpdated) onUserUpdated();
      onClose();
    } catch (err) {
      notify(err.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!userId) return null;

  const isUserAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isUserManager = user?.role?.toUpperCase() === 'MANAGER';
  const isUserSupervisor = user?.role?.toUpperCase() === 'SUPERVISOR';

  let roleBadgeClass = styles.roleSupervisor;
  let RoleIcon = FaUserTie;
  if (isUserAdmin) {
    roleBadgeClass = styles.roleAdmin;
    RoleIcon = FaCrown;
  } else if (isUserManager) {
    roleBadgeClass = styles.roleManager;
    RoleIcon = FaShieldAlt;
  }

  let statusBadgeClass = styles.statusActive;
  if (user?.status === 'PENDING_APPROVAL') statusBadgeClass = styles.statusPending;
  if (user?.status === 'DISABLED') statusBadgeClass = styles.statusDisabled;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h3>
            <FaIdBadge style={{ color: '#2aa1ee' }} /> User Account Profile
          </h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
              Loading user profile details...
            </div>
          ) : !user ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)' }}>
              User not found.
            </div>
          ) : (
            <>
              {/* Profile Hero Card */}
              <div className={styles.profileHero}>
                <div className={styles.largeAvatar}>
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileMeta}>
                  <h2 className={styles.userName}>
                    {user.username}
                    {isUserAdmin && <span title="Primary Farm Administrator">👑</span>}
                  </h2>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                      <RoleIcon /> {user.role}
                    </span>
                    <span className={`${styles.statusBadge} ${statusBadgeClass}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>System User ID</span>
                  <span className={styles.infoValue}>{user.id}</span>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Account Status</span>
                  <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                    {user.status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Administrator Scope */}
              {isUserAdmin && (
                <div className={styles.sectionBlock}>
                  <p className={styles.sectionTitle}>
                    <span>👑 Administrative Authority</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.45 }}>
                    Primary Administrator with complete control over all farm categories, project planning, financial records, inventory items, and staff credential management.
                  </p>
                </div>
              )}

              {/* Manager Assigned Categories */}
              {isUserManager && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>
                    <span>
                      <FaTags style={{ marginRight: '0.4rem', color: '#2aa1ee' }} />
                      Assigned Categories ({(user.assignedCategories || []).length})
                    </span>
                    {isAdmin && (
                      <button 
                        className={styles.actionBtn}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          onClose();
                          navigate(`/users/${user.id}/categories`);
                        }}
                      >
                        <FaExternalLinkAlt /> Edit Assignments
                      </button>
                    )}
                  </div>

                  {(user.assignedCategories || []).length === 0 ? (
                    <p className={styles.emptyNote}>No categories assigned to this manager yet.</p>
                  ) : (
                    <div className={styles.chipsList}>
                      {user.assignedCategories.map((c) => (
                        <span key={c.id} className={styles.chipItem}>
                          🏷️ {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Supervisor Assigned Projects */}
              {isUserSupervisor && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>
                    <span>
                      <FaFolder style={{ marginRight: '0.4rem', color: '#22c55e' }} />
                      Assigned Field Projects ({supervisedProjects.length})
                    </span>
                    <button 
                      className={styles.actionBtn}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        onClose();
                        navigate(`/users/${user.id}/projects`);
                      }}
                    >
                      <FaExternalLinkAlt /> Delegate Projects
                    </button>
                  </div>

                  {supervisedProjects.length === 0 ? (
                    <p className={styles.emptyNote}>No projects currently supervised by this staff member.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {supervisedProjects.map((p) => (
                        <div key={p.id} className={styles.projectListItem}>
                          <div>
                            <div className={styles.projectListName}>{p.name}</div>
                            <div className={styles.projectListMeta}>{p.category?.name || 'Category'} • {p.season}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'capitalize' }}>
                            {p.status || 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        {user && (
          <div className={styles.modalFooter}>
            <div className={styles.footerLeft}>
              {!isUserAdmin && user.status === 'PENDING_APPROVAL' && (
                <button 
                  className={styles.actionBtn}
                  style={{ background: '#16a34a', color: '#fff', borderColor: '#16a34a' }}
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={actionLoading}
                >
                  <FaCheck /> Approve Account
                </button>
              )}

              {!isUserAdmin && user.status === 'ACTIVE' && (
                <button 
                  className={styles.actionBtn}
                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                  onClick={() => handleStatusChange('DISABLED')}
                  disabled={actionLoading}
                >
                  <FaBan /> Deactivate
                </button>
              )}

              {!isUserAdmin && user.status === 'DISABLED' && (
                <button 
                  className={styles.actionBtn}
                  style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#058a36' }}
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={actionLoading}
                >
                  <FaCheckCircle /> Reactivate
                </button>
              )}

              {!isUserAdmin && (
                <button 
                  className={styles.dangerBtn}
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  <FaTrash /> Delete
                </button>
              )}
            </div>

            <div className={styles.footerRight}>
              <button className={styles.closeModalBtn} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
