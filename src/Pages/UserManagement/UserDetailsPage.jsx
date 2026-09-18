import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './UserDetailsPage.module.css';
import { 
  getUserById, 
  getSupervisorProjects, 
  updateUserStatus, 
  deleteUser, 
  updateUserPrivileges, 
  updateStaffDetails
} from '../../APIs/user';
import { notify, confirmModal } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
import useAuth from '../../useAuth';
import { 
  FaCrown, 
  FaUserTie, 
  FaTags, 
  FaCheckCircle, 
  FaBan, 
  FaTrash, 
  FaExternalLinkAlt, 
  FaIdBadge, 
  FaCheck, 
  FaShieldAlt, 
  FaSave,
  FaFolderOpen,
  FaArrowLeft,
  FaEdit,
  FaTimes,
  FaEnvelope,
  FaIdCard,
  FaCircle,
  FaCopy
} from 'react-icons/fa';

export function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentAdminUser = useAuth((state) => state.user);

  const [user, setUser] = useState(null);
  const [supervisedProjects, setSupervisedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [privileges, setPrivileges] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [privilegeSaving, setPrivilegeSaving] = useState(false);

  // Edit user profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    maxProjectCapacity: 4
  });

  const handleCopy = (text, label) => {
    if (!text) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      notify(`${label} copied to clipboard! 📋`, 'info');
    }
  };

  const isAdmin = currentAdminUser?.role?.toUpperCase() === 'ADMIN';
  const isCurrentManager = currentAdminUser?.role?.toUpperCase() === 'MANAGER';

  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false;
    const initialPrivs = user.privileges || [];
    const privsChanged = 
      privileges.length !== initialPrivs.length ||
      privileges.some(k => !initialPrivs.includes(k)) ||
      initialPrivs.some(k => !privileges.includes(k));
    const isUserSupervisor = user.role?.toUpperCase() === 'SUPERVISOR';
    const capacityChanged = isUserSupervisor && Number(maxCapacity) !== Number(user.maxProjectCapacity || 4);
    return privsChanged || capacityChanged;
  }, [user, privileges, maxCapacity]);

  const loadUserDetails = async () => {
    setLoading(true);
    setLoadError(null);
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
      setLoadError(err);
      notify('Failed to load user details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadUserDetails();
  }, [userId]);

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
    } catch (err) {
      notify(err.message || 'Failed to save privileges', 'error');
    } finally {
      setPrivilegeSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await updateUserStatus(userId, newStatus);
      notify(`User status updated to ${newStatus} ✅`, 'success');
      loadUserDetails();
    } catch (err) {
      notify(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmModal({
      title: 'Remove User Account',
      message: `Are you sure you want to permanently delete user "${user?.username}"? This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await deleteUser(userId);
      notify(`User "${user?.username}" successfully removed ✅`, 'success');
      navigate('/users');
    } catch (err) {
      notify(err.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username || !editForm.username.trim()) {
      notify('Username is required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateStaffDetails(userId, {
        username: editForm.username.trim(),
        email: editForm.email ? editForm.email.trim() : null,
        role: isAdmin ? editForm.role : user.role,
        status: editForm.status,
        maxProjectCapacity: Number(editForm.maxProjectCapacity) || 4
      });
      notify('Staff details updated successfully! ✅', 'success');
      setShowEditModal(false);
      loadUserDetails();
    } catch (err) {
      notify(err.message || 'Failed to update staff details', 'error');
    } finally {
      setActionLoading(false);
    }
  };



  if (loading) {
    return <Spinner fullPage label="Loading staff member details..." />;
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <ErrorState
          error={loadError || 'User profile not found.'}
          title="User Profile Unavailable"
          onRetry={loadUserDetails}
        />
      </div>
    );
  }

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

  return (
    <div className={styles.page}>

      {/* Top Section: Pro Profile Overview Card (Identity on left, MetaList on right on Desktop) */}
      <div className={styles.topSection}>
        <div className={`${styles.card} ${styles.profileCard}`}>
          <div className={styles.profileIdentity}>
            <div className={styles.identityHeaderRow}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                {isUserAdmin && (
                  <div className={styles.crownBadge} title="Primary Farm Administrator">
                    👑
                  </div>
                )}
                <span 
                  className={`${styles.avatarStatusDot} ${
                    user.status === 'ACTIVE' ? styles.avatarStatusActive : 
                    user.status === 'PENDING_APPROVAL' ? styles.avatarStatusPending : 
                    styles.avatarStatusDisabled
                  }`}
                  title={`Account Status: ${user.status}`}
                />
              </div>

              <div className={styles.identityDetails}>
                <h2 className={styles.username}>{user.username}</h2>
                
                <div className={styles.badges}>
                  <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
                    <RoleIcon /> {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <div className={styles.actionItem}>
                <button 
                  className={styles.iconBtn}
                  title="Edit User Details"
                  onClick={() => {
                    setEditForm({
                      username: user.username || '',
                      email: user.email || '',
                      role: user.role || 'SUPERVISOR',
                      status: user.status || 'ACTIVE',
                      maxProjectCapacity: user.maxProjectCapacity || 4
                    });
                    setShowEditModal(true);
                  }}
                >
                  <FaEdit />
                </button>
                <span className={styles.actionLabel}>Edit</span>
              </div>

              {!isUserAdmin && user.status === 'PENDING_APPROVAL' && (isAdmin || (isCurrentManager && isUserSupervisor)) && (
                <div className={styles.actionItem}>
                  <button 
                    className={styles.iconBtn}
                    title="Approve & Activate Account"
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={actionLoading}
                  >
                    <FaCheck />
                  </button>
                  <span className={styles.actionLabel}>Approve</span>
                </div>
              )}

              {!isUserAdmin && user.status !== 'PENDING_APPROVAL' && (
                <div className={styles.actionItem}>
                  <button 
                    className={styles.iconBtn}
                    title={user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                    onClick={() => handleStatusChange(user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
                    disabled={actionLoading}
                  >
                    {user.status === 'ACTIVE' ? <FaBan /> : <FaCheck />}
                  </button>
                  <span className={styles.actionLabel}>
                    {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </span>
                </div>
              )}

              {!isUserAdmin && (isAdmin || (isCurrentManager && isUserSupervisor)) && (
                <div className={styles.actionItem}>
                  <button 
                    className={styles.iconBtn}
                    title="Delete User Account"
                    onClick={handleDelete}
                    disabled={actionLoading}
                  >
                    <FaTrash />
                  </button>
                  <span className={styles.actionLabel}>Delete</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <FaIdCard className={styles.metaIcon} /> User ID
              </span>
              <span className={styles.metaValueMono}>{user.id}</span>
            </div>
            {user.email && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  <FaEnvelope className={styles.metaIcon} /> Email
                </span>
                <span className={styles.metaValue}>{user.email}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <FaShieldAlt className={styles.metaIcon} /> Account Status
              </span>
              <span className={styles.metaStatusValue}>
                <span className={`${styles.statusDot} ${
                  user.status === 'ACTIVE' ? styles.statusDotActive : 
                  user.status === 'PENDING_APPROVAL' ? styles.statusDotPending : 
                  styles.statusDotDisabled
                }`} />
                {user.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Scopes, Projects & PBAC Privileges */}
      <div className={styles.bottomSection}>
          {/* Administrator Scope Card */}
          {isUserAdmin && (
            <div className={styles.card}>
              <h3 className={styles.sectionTitleMain}>
                <FaCrown style={{ color: '#f59e0b' }} /> Primary Administrator Authority
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6 }}>
                Full system authority with unrestricted control across all farm categories, projects, livestock, crops, sales analytics, expense auditing, inventory records, and user provisioning.
              </p>
            </div>
          )}

          {/* Manager Assigned Categories */}
          {isUserManager && (
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitleMain}>
                  <FaTags style={{ color: '#2aa1ee' }} /> Assigned Categories ({(user.assignedCategories || []).length})
                </h3>
                {isAdmin && (
                  <button 
                    className={styles.primaryActionBtn}
                    onClick={() => navigate(`/users/${user.id}/categories`)}
                  >
                    <FaExternalLinkAlt /> Edit Category Assignments
                  </button>
                )}
              </div>

              {(user.assignedCategories || []).length === 0 ? (
                <div className={styles.emptyBox}>
                  No categories assigned to this manager yet.
                </div>
              ) : (
                <div className={styles.chipsContainer}>
                  {user.assignedCategories.map((c) => (
                    <span key={c.id} className={styles.chip}>
                      🏷️ {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Supervisor Projects & Capacity */}
          {isUserSupervisor && (
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitleMain}>
                  <FaFolderOpen style={{ color: '#10b981' }} /> Supervised Projects ({supervisedProjects.length})
                </h3>
                {(isAdmin || isCurrentManager) && (
                  <button 
                    className={styles.primaryActionBtn}
                    onClick={() => navigate(`/users/${user.id}/projects`)}
                  >
                    <FaExternalLinkAlt /> Assign Projects
                  </button>
                )}
              </div>

              <div className={styles.capacityBox}>
                <label style={{ fontWeight: 600 }}>Max Project Capacity:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={maxCapacity} 
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className={styles.capacityInputMain}
                />
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  (Currently assigned: {supervisedProjects.length} / {maxCapacity} projects)
                </span>
              </div>

              {supervisedProjects.length === 0 ? (
                <div className={styles.emptyBox}>
                  No active projects assigned to this supervisor.
                </div>
              ) : (
                <div className={styles.projectsList}>
                  {supervisedProjects.map((p) => (
                    <div key={p.id} className={styles.projectCardItem}>
                      <span className={styles.projectCardName}>{p.name}</span>
                      <span className={styles.projectCardSeason}>{p.season || 'No season set'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manager Privileges Delegation (PBAC) */}
          {(isUserManager && isAdmin) && (
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitleMain}>
                  <FaShieldAlt style={{ color: '#2aa1ee' }} /> Manager Privileges & Authority
                </h3>
              </div>

              <div className={styles.privilegeListWide}>
                {[
                  { key: 'CAN_CREATE_CATEGORIES', label: 'Create Farm Categories / Sectors', desc: 'Allow manager to create and configure new categories.' },
                  { key: 'CAN_CREATE_SUPERVISORS', label: 'Create & Provision Supervisors', desc: 'Allow manager to hire and register dedicated field supervisors.' },
                  { key: 'CAN_ASSIGN_PRIVILEGES', label: 'Assign & Toggle Supervisor Privileges', desc: 'Allow manager to grant, customize, and toggle operational field privileges for their supervisors.' },
                  { key: 'CAN_VIEW_FINANCIALS', label: 'View Sector Financials & Cash Flow', desc: 'Allow manager to view revenue and expense analytics for their sectors.' },
                  { key: 'CAN_MANAGE_BUDGETS', label: 'Manage & Edit Project Budgets', desc: 'Allow manager to modify budget allocations on projects.' },
                  { key: 'CAN_DELETE_INVENTORY', label: 'Delete Inventory Items', desc: 'Allow manager to permanently remove items from the inventory catalog.' },
                ].map((item) => {
                  const isGranted = privileges.includes(item.key);
                  return (
                    <div 
                      key={item.key} 
                      className={`${styles.privilegeItemWide} ${isGranted ? styles.privilegeItemActive : ''}`} 
                      onClick={() => handleTogglePrivilege(item.key)}
                    >
                      <div className={styles.privilegeInfoWide}>
                        <span className={styles.privilegeTitle}>{item.label}</span>
                        <span className={styles.privilegeDescription}>{item.desc}</span>
                      </div>
                      <div className={`${styles.switchTrack} ${isGranted ? styles.switchTrackOn : ''}`} role="switch" aria-checked={isGranted}>
                        <div className={`${styles.switchThumb} ${isGranted ? styles.switchThumbOn : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Supervisor Privileges Delegation (PBAC) */}
          {(isUserSupervisor && (isAdmin || (isCurrentManager && currentAdminUser?.privileges?.includes('CAN_ASSIGN_PRIVILEGES')))) && (
            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitleMain}>
                  <FaShieldAlt style={{ color: '#10b981' }} /> Supervisor Privileges & Field Authority
                </h3>
              </div>

              <div className={styles.privilegeListWide}>
                {[
                  { key: 'CAN_RECORD_HARVEST', label: 'Record Harvest Yields', desc: 'Allow supervisor to submit harvest volumes and production logs.' },
                  { key: 'CAN_LOG_ACTIVITIES', label: 'Log Daily Field Activities', desc: 'Allow logging weeding, spraying, irrigation, and feeding tasks.' },
                  { key: 'CAN_USE_INVENTORY', label: 'Deduct Stock from Inventory', desc: 'Allow deducting fertilizer, feed, and seed quantities for assigned projects.' },
                  { key: 'CAN_RECORD_EXPENSES', label: 'Record Petty Field Expenses', desc: 'Allow logging cash expenses incurred in the field.' },
                  { key: 'CAN_RECORD_SALES', label: 'Record Farm-Gate Sales', desc: 'Allow recording direct sales from project harvest stock.' },
                ].map((item) => {
                  const isGranted = privileges.includes(item.key);
                  return (
                    <div 
                      key={item.key} 
                      className={`${styles.privilegeItemWide} ${isGranted ? styles.privilegeItemActive : ''}`} 
                      onClick={() => handleTogglePrivilege(item.key)}
                    >
                      <div className={styles.privilegeInfoWide}>
                        <span className={styles.privilegeTitle}>{item.label}</span>
                        <span className={styles.privilegeDescription}>{item.desc}</span>
                      </div>
                      <div className={`${styles.switchTrack} ${isGranted ? styles.switchTrackOn : ''}`} role="switch" aria-checked={isGranted}>
                        <div className={`${styles.switchThumb} ${isGranted ? styles.switchThumbOn : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      

      {/* Fixed Bottom Floating Save Bar */}
      <div className={`${styles.fixedSaveBar} ${hasUnsavedChanges ? styles.fixedSaveBarVisible : ''}`}>
        <div className={styles.fixedSaveInner}>
          <div className={styles.unsavedNotice}>
            <span className={styles.unsavedDot} />
            <span>Unsaved Changes</span>
          </div>
          <div className={styles.fixedSaveActions}>
            <button 
              type="button" 
              className={styles.saveCancelBtn}
              onClick={() => {
                setPrivileges(user?.privileges || []);
                setMaxCapacity(user?.maxProjectCapacity || 4);
              }}
            >
              Discard
            </button>
            <button 
              type="button"
              className={styles.savePrivilegesBtn}
              onClick={handleSavePrivileges}
              disabled={privilegeSaving}
            >
              <FaSave /> {privilegeSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Details Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3><FaEdit /> Edit Staff User Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.formGroup}>
                <label>Username *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="e.g. user@agrosync.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              {isAdmin && !isUserAdmin && (
                <div className={styles.formGroup}>
                  <label>Staff Role</label>
                  <select
                    className={styles.select}
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="MANAGER">Farm Manager</option>
                    <option value="SUPERVISOR">Field Supervisor</option>
                  </select>
                </div>
              )}

              {!isUserAdmin && (
                <div className={styles.formGroup}>
                  <label>Account Status</label>
                  <select
                    className={styles.select}
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              )}

              {isUserSupervisor && (
                <div className={styles.formGroup}>
                  <label>Max Assigned Project Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className={styles.input}
                    value={editForm.maxProjectCapacity}
                    onChange={(e) => setEditForm({ ...editForm, maxProjectCapacity: e.target.value })}
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserDetailsPage;
