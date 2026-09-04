import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserDetailsModal.module.css';
import { getUserById, getSupervisorProjects, updateUserStatus, deleteUser, updateUserPrivileges } from '../../APIs/user';
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
  FaShieldAlt,
  FaToggleOn,
  FaToggleOff,
  FaSave
} from 'react-icons/fa';

export default function UserDetailsModal({ userId, currentAdminUser, onClose, onUserUpdated }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [supervisedProjects, setSupervisedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [privileges, setPrivileges] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [privilegeSaving, setPrivilegeSaving] = useState(false);

  const isAdmin = currentAdminUser?.role?.toUpperCase() === 'ADMIN';
  const isCurrentManager = currentAdminUser?.role?.toUpperCase() === 'MANAGER';

  const loadUserDetails = async () => {
    setLoading(true);
    try {
      const res = await getUserById(userId);
      const userData = res?.body;
      setUser(userData);
      setPrivileges(userData?.privileges || []);
      setMaxCapacity(userData?.maxProjectCapacity || 4);

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

  const handleTogglePrivilege = (privKey) => {
    setPrivileges((prev) => 
      prev.includes(privKey) ? prev.filter(k => k !== privKey) : [...prev, privKey]
    );
  };

  const handleSavePrivileges = async () => {
    setPrivilegeSaving(true);
    try {
      await updateUserPrivileges(userId, {
        privileges: privileges,
        maxProjectCapacity: Number(maxCapacity) || 4
      });
      notify('Privileges and capacity saved successfully ✅', 'success');
      loadUserDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      notify(err.message || 'Failed to save privileges', 'error');
    } finally {
      setPrivilegeSaving(false);
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

              {/* Granular Privilege Delegation Section (PBAC) */}
              {(isUserManager && isAdmin) && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>
                    <span>
                      <FaShieldAlt style={{ marginRight: '0.4rem', color: '#2aa1ee' }} />
                      Manager Privileges & Authority
                    </span>
                    <button 
                      className={styles.actionBtn}
                      style={{ background: '#0284c7', color: '#fff', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={handleSavePrivileges}
                      disabled={privilegeSaving}
                    >
                      <FaSave /> {privilegeSaving ? 'Saving...' : 'Save Privileges'}
                    </button>
                  </div>
                  <div className={styles.privilegeList}>
                    {[
                      { key: 'CAN_CREATE_CATEGORIES', label: 'Create Farm Categories / Sectors', desc: 'Allow manager to create and configure new categories.' },
                      { key: 'CAN_CREATE_SUPERVISORS', label: 'Create & Provision Supervisors', desc: 'Allow manager to hire and register dedicated field supervisors.' },
                      { key: 'CAN_VIEW_FINANCIALS', label: 'View Sector Financials & Cash Flow', desc: 'Allow manager to view revenue and expense analytics for their sectors.' },
                      { key: 'CAN_MANAGE_BUDGETS', label: 'Manage & Edit Project Budgets', desc: 'Allow manager to modify budget allocations on projects.' },
                      { key: 'CAN_DELETE_INVENTORY', label: 'Delete Inventory Items', desc: 'Allow manager to permanently remove items from the inventory catalog.' },
                    ].map((item) => {
                      const isGranted = privileges.includes(item.key);
                      return (
                        <div key={item.key} className={styles.privilegeItem} onClick={() => handleTogglePrivilege(item.key)}>
                          <div className={styles.privilegeInfo}>
                            <span className={styles.privilegeLabel}>{item.label}</span>
                            <span className={styles.privilegeDesc}>{item.desc}</span>
                          </div>
                          <span className={isGranted ? styles.toggleOn : styles.toggleOff}>
                            {isGranted ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(isUserSupervisor && (isAdmin || isCurrentManager)) && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>
                    <span>
                      <FaShieldAlt style={{ marginRight: '0.4rem', color: '#10b981' }} />
                      Supervisor Privileges & Capacity
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className={styles.actionBtn}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          onClose();
                          navigate(`/users/${user.id}/projects`);
                        }}
                      >
                        <FaExternalLinkAlt /> Assign Projects
                      </button>
                      <button 
                        className={styles.actionBtn}
                        style={{ background: '#10b981', color: '#fff', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={handleSavePrivileges}
                        disabled={privilegeSaving}
                      >
                        <FaSave /> {privilegeSaving ? 'Saving...' : 'Save Privileges'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.capacityRow}>
                    <label>Max Project Capacity:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={maxCapacity} 
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className={styles.capacityInput}
                    />
                    <span className={styles.capacityNote}>(Current: {supervisedProjects.length} / {maxCapacity} projects)</span>
                  </div>

                  <div className={styles.privilegeList}>
                    {[
                      { key: 'CAN_RECORD_HARVEST', label: 'Record Harvest Yields', desc: 'Allow supervisor to submit harvest volumes and production logs.' },
                      { key: 'CAN_LOG_ACTIVITIES', label: 'Log Daily Field Activities', desc: 'Allow logging weeding, spraying, irrigation, and feeding tasks.' },
                      { key: 'CAN_USE_INVENTORY', label: 'Deduct Stock from Inventory', desc: 'Allow deducting fertilizer, feed, and seed quantities for assigned projects.' },
                      { key: 'CAN_RECORD_EXPENSES', label: 'Record Petty Field Expenses', desc: 'Allow logging cash expenses incurred in the field.' },
                      { key: 'CAN_RECORD_SALES', label: 'Record Farm-Gate Sales', desc: 'Allow recording direct sales from project harvest stock.' },
                    ].map((item) => {
                      const isGranted = privileges.includes(item.key);
                      return (
                        <div key={item.key} className={styles.privilegeItem} onClick={() => handleTogglePrivilege(item.key)}>
                          <div className={styles.privilegeInfo}>
                            <span className={styles.privilegeLabel}>{item.label}</span>
                            <span className={styles.privilegeDesc}>{item.desc}</span>
                          </div>
                          <span className={isGranted ? styles.toggleOn : styles.toggleOff}>
                            {isGranted ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
