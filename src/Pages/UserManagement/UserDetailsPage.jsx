import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './UserDetailsPage.module.css';
import { 
  getUserById, 
  getSupervisorProjects, 
  updateUserStatus, 
  deleteUser, 
  updateUserPrivileges, 
  adminResetPassword 
} from '../../APIs/user';
import { notify, confirmModal } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import useAuth from '../../useAuth';
import { 
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
  FaSave,
  FaKey,
  FaLock,
  FaFolderOpen,
  FaArrowLeft
} from 'react-icons/fa';

export function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentAdminUser = useAuth((state) => state.user);

  const [user, setUser] = useState(null);
  const [supervisedProjects, setSupervisedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [privileges, setPrivileges] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [privilegeSaving, setPrivilegeSaving] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

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
    } catch (_err) {
      notify('Failed to load user details', 'error');
      navigate('/users');
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

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      notify('Password must be at least 6 characters', 'error');
      return;
    }
    setResettingPassword(true);
    try {
      await adminResetPassword(userId, newPassword);
      notify(`Password for "${user?.username}" successfully reset ✅`, 'success');
      setNewPassword('');
    } catch (err) {
      notify(err.message || 'Failed to reset password', 'error');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return <Spinner fullPage label="Loading staff member details..." />;
  }

  if (!user) {
    return (
      <div className={styles.page} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '1.5rem' }}>User not found.</p>
        <button onClick={() => navigate('/users')} className={styles.backBtn}>
          <FaArrowLeft /> Return to Staff Management
        </button>
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
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.pageHeaderInfo}>
          <h1 className={styles.pageTitle}>
            <FaIdBadge style={{ color: '#2aa1ee' }} /> User Profile & Authority
          </h1>
        </div>
      </div>

      {/* Top Section: Profile Overview, Account Actions, Password Reset */}
      <div className={styles.topSection}>
        {/* Profile Overview Card */}
        <div className={`${styles.card} ${styles.profileCard}`}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
            {isUserAdmin && (
              <div className={styles.crownBadge} title="Primary Farm Administrator">
                👑
              </div>
            )}
          </div>

          <h2 className={styles.username}>{user.username}</h2>

          <div className={styles.badges}>
            <span className={`${styles.roleBadge} ${roleBadgeClass}`}>
              <RoleIcon /> {user.role}
            </span>
          </div>

          <div className={styles.metaList}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>User ID</span>
              <span className={styles.metaValue}>{user.id}</span>
            </div>
            {user.email && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Email</span>
                <span className={styles.metaValue}>{user.email}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Account Status</span>
              <span className={styles.metaValue} style={{ textTransform: 'capitalize' }}>
                {user.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Stack for Account Actions & Password Reset */}
        {!isUserAdmin && (isAdmin || (isCurrentManager && isUserSupervisor)) && (
          <div className={styles.topRightCol}>
            {/* Account Status Management Actions */}
            <div className={`${styles.card} ${styles.actionsCard}`}>
              <h3 className={styles.cardTitle}>Account Actions</h3>
              
              <div className={styles.actionButtonsCol}>
                {user.status === 'PENDING_APPROVAL' && (
                  <button 
                    className={styles.approveBtn}
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={actionLoading}
                  >
                    <FaCheck /> Approve & Activate Account
                  </button>
                )}

                {user.status === 'ACTIVE' && (
                  <button 
                    className={styles.deactivateBtn}
                    onClick={() => handleStatusChange('DISABLED')}
                    disabled={actionLoading}
                  >
                    <FaBan /> Deactivate Account
                  </button>
                )}

                {user.status === 'DISABLED' && (
                  <button 
                    className={styles.reactivateBtn}
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={actionLoading}
                  >
                    <FaCheckCircle /> Reactivate Account
                  </button>
                )}

                <button 
                  className={styles.deleteBtn}
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  <FaTrash /> Permanently Delete User
                </button>
              </div>
            </div>

            {/* Admin Password Reset Card */}
            {isAdmin && (
              <div className={`${styles.card} ${styles.securityCard}`}>
                <h3 className={styles.cardTitle}>
                  <FaKey style={{ color: '#eab308' }} /> Reset Password
                </h3>
                <form onSubmit={handleAdminResetPassword} className={styles.passwordForm}>
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.passwordInput}
                    required
                    minLength={6}
                  />
                  <button
                    type="submit"
                    className={styles.resetSubmitBtn}
                    disabled={resettingPassword}
                  >
                    {resettingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
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
    </div>
  );
}
export default UserDetailsPage;
