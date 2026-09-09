import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserManagementPage.module.css';
import { 
  fetchUsers, 
  createStaff, 
  updateUserStatus, 
  deleteUser,
  getSupervisorProjects
} from '../../APIs/user';
import { getEmployees, toggleEmployeeStatus } from '../../APIs/employee';
import { EmployeeModal } from '../../Components/Labor/EmployeeModal';
import useAuth from '../../useAuth';
import { notify, confirmModal } from '../../utils/notify';
import { 
  FaUserPlus, 
  FaUserTie, 
  FaUsers, 
  FaTimes, 
  FaExclamationTriangle,
  FaCheck,
  FaEye,
  FaIdCard,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { Spinner } from '../../Components/Spinner/Spinner';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  const isManager = currentUser?.role?.toUpperCase() === 'MANAGER';
  const canCreateSupervisor = isAdmin || (isManager && currentUser?.privileges?.includes('CAN_CREATE_SUPERVISORS'));

  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [targetRoleToCreate, setTargetRoleToCreate] = useState(isAdmin ? 'MANAGER' : 'SUPERVISOR');
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'MANAGER' });

  const loadData = async () => {
    setLoading(true);
    try {
      // If admin, load all users. If manager, load supervisors under this manager.
      const [usersRes, empList] = await Promise.all([
        fetchUsers(null, isManager ? currentUser?.id : null),
        getEmployees().catch(() => [])
      ]);

      const usersList = usersRes?.body || [];
      const supervisors = usersList.filter(u => u.role?.toUpperCase() === 'SUPERVISOR');
      if (supervisors.length > 0) {
        const counts = await Promise.all(
          supervisors.map(s =>
            getSupervisorProjects(s.id)
              .then(res => ({ id: s.id, count: (res?.body || []).length }))
              .catch(() => ({ id: s.id, count: s.assignedProjectsCount ?? 0 }))
          )
        );
        const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]));
        usersList.forEach(u => {
          if (countMap[u.id] !== undefined) {
            u.assignedProjectsCount = countMap[u.id];
          }
        });
      }

      setUsers(usersList);
      setEmployees(Array.isArray(empList) ? empList : []);
    } catch (_err) {
      notify('Failed to load user management data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployeeStatus = async (empId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await toggleEmployeeStatus(empId, newStatus);
      notify(`Worker status updated to ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to update employee status', 'error');
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
        email: createForm.email,
        password: createForm.password,
        role: targetRoleToCreate,
        createdById: currentUser?.id
      });
      notify(`${targetRoleToCreate} created successfully`, 'success');
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', password: '', role: 'MANAGER' });
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to create user', 'error');
    }
  };

  const handleApproveUser = async (userId) => {
    setActionLoading(true);
    try {
      await updateUserStatus(userId, 'ACTIVE');
      notify('User account approved & activated ✅', 'success');
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to approve user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async (userId) => {
    const confirmed = await confirmModal({
      title: 'Reject User Account',
      message: 'Are you sure you want to reject and remove this registration request?',
      confirmText: 'Reject & Remove',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await deleteUser(userId);
      notify('User registration rejected and removed ✅', 'success');
      loadData();
    } catch (err) {
      notify(err.message || 'Failed to reject user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Derived counts
  const adminCount = users.filter(u => u.role?.toUpperCase() === 'ADMIN').length;
  const managerCount = users.filter(u => u.role?.toUpperCase() === 'MANAGER').length;
  const supervisorCount = users.filter(u => u.role?.toUpperCase() === 'SUPERVISOR').length;
  const pendingUsers = users.filter(u => u.status === 'PENDING_APPROVAL');

  const managersReached = managerCount >= 2;
  const supervisorsReached = supervisorCount >= 10;

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery.trim() ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role?.toUpperCase() === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
          {canCreateSupervisor && (
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
          )}
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
              <div className={styles.progressBar} style={{ width: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
            </div>
          </div>
        )}

        {isAdmin && (
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
        )}

        <div className={styles.quotaCard}>
          <div className={styles.quotaCardHeader}>
            <span>👷 Field Supervisors</span>
            <span className={styles.roleSupervisor}>{isManager ? 'Your Team' : 'Max 10'}</span>
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

      {isAdmin && pendingUsers.length > 0 && (
        <div className={styles.pendingBox}>
          <div className={styles.pendingHeader}>
            <FaExclamationTriangle /> {pendingUsers.length} Account(s) Awaiting Your Approval
          </div>
          <p className={styles.pendingDescription}>
            Supervisors and Managers need your confirmation before they can access their accounts.
          </p>
          <div className={styles.pendingList}>
            {pendingUsers.map(u => (
              <div key={u.id} className={styles.pendingItem}>
                <div>
                  <strong>{u.username}</strong> ({u.role}) — {u.email}
                </div>
                <div className={styles.pendingActions}>
                  <button 
                    className={styles.approveBtn} 
                    onClick={() => handleApproveUser(u.id)}
                    disabled={actionLoading}
                  >
                    <FaCheck /> Approve
                  </button>
                  <button 
                    className={styles.rejectBtn} 
                    onClick={() => handleRejectUser(u.id)}
                    disabled={actionLoading}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by username, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterControls}>
          <div className={styles.selectWrapper}>
            <FaFilter className={styles.filterIcon} />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        {filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUserTie className={styles.emptyIcon} />
            <h4>No Users Found</h4>
            <p>Try refining your search or filters.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Categories / Projects Count</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isUserAdmin = u.role === 'ADMIN';
                  const isUserManager = u.role === 'MANAGER';
                  const isUserSupervisor = u.role === 'SUPERVISOR';

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
                            {isUserAdmin && <span style={{ marginLeft: '0.4rem', color: '#f59e0b' }}>👑 Primary</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.roleBadge} ${roleBadgeClass}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusBadgeClass}`}>{u.status}</span>
                      </td>
                      <td>
                        {isUserManager ? (
                          <span>
                            {(u.assignedCategories || []).length} Categories
                          </span>
                        ) : isUserSupervisor ? (
                          <span>
                            {u.assignedProjectsCount ?? 0} Projects
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>
                            Full Access
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => navigate(`/users/${u.id}`)}
                          title="View user profile & authority"
                        >
                          <FaEye /> Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verified Farm Workforce (Labor Compliance) */}
      <div className={styles.tableCard} style={{ marginTop: '1.5rem' }}>
        <div className={styles.tableHeader}>
          <div>
            <h2>
              <FaUsers style={{ color: '#10b981' }} /> Verified Farm Workforce (Labor Compliance)
            </h2>
            <p>
              Legal adult workforce registry verified by official Kenyan National ID numbers (Age 18+)
            </p>
          </div>
          <button 
            className={styles.primaryBtn}
            onClick={() => setShowEmployeeModal(true)}
          >
            <FaUserPlus /> Register Verified Worker
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>National ID (Adult Verified)</th>
                <th>Phone / M-Pesa</th>
                <th>Employment Type</th>
                <th>Daily Wage Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #94a3b8)' }}>
                    No farm employees registered yet. Click "Register Verified Worker" to add.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <strong style={{ color: '#fff' }}>{emp.fullName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>ID: {emp.id}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <FaIdCard style={{ marginRight: '0.3rem' }} /> {emp.idNumber}
                      </span>
                    </td>
                    <td>{emp.phoneNumber || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: emp.employmentType === 'PERMANENT' ? '#38bdf8' : '#fbbf24' }}>
                        {emp.employmentType}
                      </span>
                    </td>
                    <td>KES {Number(emp.dailyRate || 0).toLocaleString()} / day</td>
                    <td>
                      <span className={emp.status === 'ACTIVE' ? styles.statusActive : styles.statusDisabled}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                        onClick={() => handleToggleEmployeeStatus(emp.id, emp.status)}
                      >
                        {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSuccess={loadData}
        currentUserId={currentUser?.id}
      />

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
                <label>Email (Optional)</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="e.g. staff@agrosync.com"
                  value={createForm.email}
                  onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
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
        </>
      )}
    </div>
  );
}
