import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserManagementPage.module.css';
import { 
  fetchUsers, 
  createStaff, 
  updateUserStatus, 
  deleteUser,
  checkBootstrapStatus 
} from '../../APIs/user';
import { getCategories } from '../../APIs/category';
import useAuth from '../../useAuth';
import { notify } from '../../utils/notify';
import { 
  FaUserShield, 
  FaUserPlus, 
  FaUserCheck, 
  FaUserTimes, 
  FaTrash, 
  FaTags, 
  FaCrown, 
  FaUserTie, 
  FaUsers, 
  FaTimes, 
  FaExclamationTriangle,
  FaCheck,
  FaFolderOpen,
  FaEye
} from 'react-icons/fa';
import UserDetailsModal from './UserDetailsModal';
import { Spinner } from '../../Components/Spinner/Spinner';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  const isManager = currentUser?.role?.toUpperCase() === 'MANAGER';

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quotaStats, setQuotaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewUserId, setViewUserId] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetRoleToCreate, setTargetRoleToCreate] = useState(isAdmin ? 'MANAGER' : 'SUPERVISOR');
  const [createForm, setCreateForm] = useState({ username: '', password: '', role: 'MANAGER' });

  const loadData = async () => {
    setLoading(true);
    try {
      // If admin, load all users. If manager, load supervisors under this manager.
      const [usersRes, catsRes, quotaRes] = await Promise.all([
        fetchUsers(null, isManager ? currentUser?.id : null),
        getCategories().catch(() => ({ body: [] })),
        checkBootstrapStatus().catch(() => ({ body: null }))
      ]);

      setUsers(usersRes?.body || []);
      setCategories(catsRes?.body || []);
      setQuotaStats(quotaRes?.body || null);
    } catch (err) {
      notify('Failed to load user management data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.password) {
      notify('Username and password are required', 'error');
      return;
    }

    try {
      await createStaff({
        username: createForm.username,
        password: createForm.password,
        role: targetRoleToCreate,
        createdById: currentUser?.id
      });
      notify(`${targetRoleToCreate} created successfully`, 'success');
      setShowCreateModal(false);
      setCreateForm({ username: '', password: '', role: 'MANAGER' });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to create user', 'error');
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      notify(`User status set to ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to remove user "${username}"?`)) return;
    try {
      await deleteUser(userId);
      notify(`User ${username} removed`, 'success');
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to remove user', 'error');
    }
  };

  // Derived counts
  const adminCount = users.filter(u => u.role?.toUpperCase() === 'ADMIN').length;
  const managerCount = users.filter(u => u.role?.toUpperCase() === 'MANAGER').length;
  const supervisorCount = users.filter(u => u.role?.toUpperCase() === 'SUPERVISOR').length;
  const pendingUsers = users.filter(u => u.status === 'PENDING_APPROVAL');

  const managersReached = managerCount >= 2;
  const supervisorsReached = supervisorCount >= 10;

  return (
    <div className={styles.page}>
      {loading ? (
        <Spinner fullPage label="Loading staff data..." />
      ) : (
        <>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>{isAdmin ? 'Farm Administration' : 'Management Portal'}</p>
          <h2>{isAdmin ? 'Staff & Role Management' : 'My Supervisors & Field Team'}</h2>
        </div>
        <div className={styles.headerActions}>
          {isAdmin && (
            <button 
              className={styles.primaryBtn}
              onClick={() => {
                setTargetRoleToCreate('MANAGER');
                setShowCreateModal(true);
              }}
              disabled={managersReached}
            >
              <FaUserPlus /> Add Manager {managersReached && '(Max 2)'}
            </button>
          )}
          <button 
            className={styles.secondaryBtn}
            onClick={() => {
              setTargetRoleToCreate('SUPERVISOR');
              setShowCreateModal(true);
            }}
            disabled={supervisorsReached}
          >
            <FaUserTie /> Add Supervisor {supervisorsReached && '(Max 10)'}
          </button>
        </div>
      </div>

      {/* Quota Overview Cards */}
      <div className={styles.quotaGrid}>
        {isAdmin && (
          <div className={styles.quotaCard}>
            <div className={styles.quotaCardHeader}>
              <span>👑 Farm Administrator</span>
              <span className={styles.roleAdmin}>1 / 1 Cap</span>
            </div>
            <div className={styles.quotaValue}>{adminCount} / 1</div>
            <div className={styles.quotaProgress}>
              <div className={styles.progressBar} style={{ width: '100%', background: '#ef4444' }} />
            </div>
          </div>
        )}

        <div className={styles.quotaCard}>
          <div className={styles.quotaCardHeader}>
            <span>👔 Farm Managers</span>
            <span className={styles.roleManager}>Max 2</span>
          </div>
          <div className={styles.quotaValue}>{managerCount} / 2</div>
          <div className={styles.quotaProgress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${(managerCount / 2) * 100}%`, background: '#2aa1ee' }} 
            />
          </div>
        </div>

        <div className={styles.quotaCard}>
          <div className={styles.quotaCardHeader}>
            <span>👷 Field Supervisors</span>
            <span className={styles.roleSupervisor}>Max 10</span>
          </div>
          <div className={styles.quotaValue}>{supervisorCount} / 10</div>
          <div className={styles.quotaProgress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${(supervisorCount / 10) * 100}%`, background: '#22c55e' }} 
            />
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert (Admin Only) */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className={styles.pendingBox}>
          <div className={styles.pendingHeader}>
            <FaExclamationTriangle /> {pendingUsers.length} Account(s) Awaiting Your Approval
          </div>
          <div className={styles.pendingList}>
            {pendingUsers.map(u => (
              <div key={u.id} className={styles.pendingItem}>
                <div>
                  <strong>{u.username}</strong> — Requested Role: <span className={styles.roleBadge}>{u.role}</span>
                </div>
                <div className={styles.pendingActions}>
                  <button 
                    className={styles.approveBtn} 
                    onClick={() => handleStatusUpdate(u.id, 'ACTIVE')}
                  >
                    <FaCheck /> Approve & Activate
                  </button>
                  <button 
                    className={styles.rejectBtn} 
                    onClick={() => handleDelete(u.id, u.username)}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                {isAdmin && <th>Assigned Categories</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading staff members...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
                    No staff members registered yet.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isUserAdmin = u.role?.toUpperCase() === 'ADMIN';
                  const isUserManager = u.role?.toUpperCase() === 'MANAGER';
                  const isUserSupervisor = u.role?.toUpperCase() === 'SUPERVISOR';

                  let roleBadgeClass = styles.roleSupervisor;
                  if (isUserAdmin) roleBadgeClass = styles.roleAdmin;
                  if (isUserManager) roleBadgeClass = styles.roleManager;

                  let statusBadgeClass = styles.statusActive;
                  if (u.status === 'PENDING_APPROVAL') statusBadgeClass = styles.statusPending;
                  if (u.status === 'DISABLED') statusBadgeClass = styles.statusDisabled;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{u.username}</strong>
                            {isUserAdmin && <span style={{ marginLeft: '0.4rem', color: '#ef4444' }}>👑 Primary</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.roleBadge} ${roleBadgeClass}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusBadgeClass}`}>{u.status}</span>
                      </td>
                      {isAdmin && (
                        <td>
                          {isUserManager ? (
                            (u.assignedCategories || []).length > 0 ? (
                              (u.assignedCategories || []).map(c => (
                                <span key={c.id} className={styles.catPill}>{c.name}</span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>None assigned</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                      )}
                      <td>
                        <div className={styles.actionBtnGroup}>
                          <button 
                            className={styles.iconBtn}
                            style={{ color: '#2aa1ee', borderColor: 'rgba(42, 161, 238, 0.35)' }}
                            onClick={() => setViewUserId(u.id)}
                            title="View full user details"
                          >
                            <FaEye /> View
                          </button>

                          {isAdmin && isUserManager && (
                            <button 
                              className={styles.iconBtn}
                              onClick={() => navigate(`/users/${u.id}/categories`)}
                            >
                              <FaTags /> Assign Categories
                            </button>
                          )}

                          {(isAdmin || isManager) && isUserSupervisor && (
                            <button 
                              className={styles.iconBtn}
                              onClick={() => navigate(`/users/${u.id}/projects`)}
                            >
                              <FaFolderOpen /> Assign Projects
                            </button>
                          )}

                          {!isUserAdmin && (
                            <>
                              {u.status === 'ACTIVE' ? (
                                <button 
                                  className={styles.iconBtn}
                                  onClick={() => handleStatusUpdate(u.id, 'DISABLED')}
                                >
                                  <FaUserTimes /> Deactivate
                                </button>
                              ) : (
                                <button 
                                  className={styles.iconBtn}
                                  onClick={() => handleStatusUpdate(u.id, 'ACTIVE')}
                                >
                                  <FaUserCheck /> Activate
                                </button>
                              )}

                              <button 
                                className={styles.iconBtn}
                                style={{ color: '#ef4444' }}
                                onClick={() => handleDelete(u.id, u.username)}
                              >
                                <FaTrash /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New {targetRoleToCreate}</h3>
              <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder={`e.g. ${targetRoleToCreate.toLowerCase()}_john`}
                  value={createForm.username}
                  onChange={e => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className={styles.formGroup}>
                <label>Temporary Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Create {targetRoleToCreate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details & Management Modal */}
      {viewUserId && (
        <UserDetailsModal
          userId={viewUserId}
          currentAdminUser={currentUser}
          onClose={() => setViewUserId(null)}
          onUserUpdated={loadData}
        />
      )}
        </>
      )}
    </div>
  );
}
