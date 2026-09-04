import React, { useState } from 'react';
import styles from './EditProfileModal.module.css';
import { FaUserEdit, FaTimes, FaEye, FaEyeSlash, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { updateUserProfile, deleteUser } from '../../APIs/user';
import { notify, confirmModal } from '../../utils/notify';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../useAuth';

export default function EditProfileModal({ onClose }) {
  const currentUser = useAuth((state) => state.user);
  const login = useAuth((state) => state.login);
  const logout = useAuth((state) => state.logout);
  const navigate = useNavigate();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = (currentUser?.role || '').toUpperCase() === 'ADMIN';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      notify('Username cannot be empty', 'error');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      notify('New passwords do not match', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        username: username.trim(),
        currentPassword: currentPassword ? currentPassword.trim() : null,
        newPassword: newPassword ? newPassword.trim() : null,
      };

      const res = await updateUserProfile(currentUser.id, payload);
      if (res?.success) {
        notify('Profile updated successfully!', 'success');
        // Update local session with new username
        if (res.body) {
          login(res.body);
        }
        onClose();
      } else {
        notify(res?.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      notify(err?.message || 'An error occurred while updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const promptTitle = isAdmin ? 'Delete Administrator Account' : 'Delete Account';
    const promptMessage = isAdmin
      ? 'Are you sure you want to delete your Administrator account? This will remove your account and return the farm portal to Bootstrap mode so a new Admin can register.'
      : 'Are you sure you want to delete your account? You will be logged out immediately.';

    const confirmed = await confirmModal({
      title: promptTitle,
      message: promptMessage,
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await deleteUser(currentUser.id);
      if (res?.success) {
        notify('Account deleted successfully. Returning to portal signup.', 'success');
        logout();
        onClose();
        navigate('/signup', { replace: true });
      } else {
        notify(res?.message || 'Failed to delete account', 'error');
      }
    } catch (err) {
      notify(err?.message || 'Error deleting account', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <FaUserEdit /> Edit Profile & Credentials
          </h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Username / Display Name</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Current Password (required only if changing password)</label>
            <div className={styles.inputWrapper}>
              <input
                type={showCurrentPass ? 'text' : 'password'}
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowCurrentPass(!showCurrentPass)}
              >
                {showCurrentPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>New Password (leave blank to keep current)</label>
            <div className={styles.inputWrapper}>
              <input
                type={showNewPass ? 'text' : 'password'}
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowNewPass(!showNewPass)}
              >
                {showNewPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving || deleting}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving || deleting}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone: Delete Account */}
        <div className={styles.dangerZone}>
          <div className={styles.dangerHeader}>
            <FaExclamationTriangle /> Danger Zone
          </div>
          <p className={styles.dangerDesc}>
            {isAdmin
              ? 'Wiping this administrator account will reset the farm portal to Bootstrap Mode so your client can sign up fresh.'
              : 'Permanently remove your account from this farm portal.'}
          </p>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDeleteAccount}
            disabled={saving || deleting}
          >
            <FaTrash /> {deleting ? 'Deleting...' : isAdmin ? 'Reset Farm / Delete Admin Account' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
