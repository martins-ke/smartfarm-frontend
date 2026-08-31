import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCheckCircle, FaCrown, FaUserShield, FaInfoCircle } from 'react-icons/fa';
import styles from './AuthPage.module.css';
import { signup, checkBootstrapStatus } from '../APIs/user';
import useAuth from '../useAuth';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();
  const login = useAuth(state => state.login);

  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', role: 'MANAGER' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await checkBootstrapStatus();
        const data = res.body;
        // If there are 0 users or 0 admins, this is the bootstrap administrator
        setIsBootstrap(data?.isBootstrap || data?.adminCount === 0);
      } catch (err) {
        setIsBootstrap(false);
      } finally {
        setCheckingBootstrap(false);
      }
    };
    fetchStatus();
  }, []);

  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
  const passwordMismatch = form.password && form.confirmPassword && form.password !== form.confirmPassword;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.password || !form.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isBootstrap && !adminConfirmed) {
      setError('Please check the confirmation box acknowledging your role as Primary Farm Administrator.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await signup({
        username: form.username,
        password: form.password,
        cpassword: form.confirmPassword,
        role: isBootstrap ? 'ADMIN' : form.role,
      });

      if (res.success) {
        const user = res.body;
        if (user.status === 'ACTIVE') {
          login(user);
          navigate('/');
        } else {
          setSuccessMsg(res.message || 'Account created and pending Administrator approval.');
        }
      } else {
        setError(res.message || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>

        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.brandIcon}>🌱</div>
          <h1 className={styles.brandName}>SmartFarm</h1>
          <p className={styles.brandTagline}>Agricultural Management System</p>
        </div>

        <h2 className={styles.formTitle}>
          {isBootstrap ? 'Initial Farm Setup' : 'Create Account'}
        </h2>

        {/* First Admin Bootstrap Confirmation Banner */}
        {!checkingBootstrap && isBootstrap && (
          <div className={styles.adminBanner}>
            <div className={styles.adminBannerHeader}>
              <FaCrown /> Primary Farm Administrator
            </div>
            <p className={styles.adminBannerText}>
              You are creating the <strong>first and primary Administrator account</strong> for this farm. You will have full authority over farm categories, staff accounts, permissions, and system configurations.
            </p>
          </div>
        )}

        {/* Regular Signup Notice */}
        {!checkingBootstrap && !isBootstrap && (
          <div className={styles.noticeBanner}>
            <FaInfoCircle style={{ marginRight: '0.4rem' }} />
            New accounts require approval from the Farm Administrator before signing in.
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}
        {successMsg && (
          <div className={styles.noticeBanner} style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
            <FaCheckCircle style={{ marginRight: '0.4rem' }} /> {successMsg}
          </div>
        )}

        {!successMsg && (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {/* Role selection if not bootstrap */}
            {!isBootstrap && (
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="role">Requested Role</label>
                <select
                  id="role"
                  name="role"
                  className={styles.roleSelect}
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="MANAGER">👔 Farm Manager (Max 2 across farm)</option>
                  <option value="SUPERVISOR">👷 Field Supervisor (Max 10 across farm)</option>
                </select>
              </div>
            )}

            {/* Username */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                className={styles.input}
                type="text"
                placeholder={isBootstrap ? "admin_username" : "Choose username"}
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.passwordField}>
                <input
                  id="password"
                  name="password"
                  className={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
              <div
                className={[
                  styles.passwordField,
                  passwordMismatch ? styles.inputError : '',
                  passwordsMatch ? styles.inputSuccess : '',
                ].join(' ')}
              >
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  className={styles.input}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirm(p => !p)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
                {passwordsMatch && (
                  <span className={styles.matchIcon}>
                    <FaCheckCircle />
                  </span>
                )}
              </div>
              {passwordMismatch && (
                <p className={styles.fieldError}>Passwords do not match</p>
              )}
            </div>

            {/* Admin Explicit Confirmation Checkbox */}
            {isBootstrap && (
              <label className={styles.adminConfirmBox}>
                <input
                  type="checkbox"
                  checked={adminConfirmed}
                  onChange={e => {
                    setAdminConfirmed(e.target.checked);
                    if (error) setError('');
                  }}
                />
                <span className={styles.adminConfirmLabel}>
                  I confirm that I will be the <strong>Primary Farm Administrator</strong> and accept full administrative responsibility.
                </span>
              </label>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !!passwordMismatch || (isBootstrap && !adminConfirmed)}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} /> Processing...
                </>
              ) : isBootstrap ? (
                '👑 Complete Administrator Setup'
              ) : (
                'Submit Registration'
              )}
            </button>

          </form>
        )}

        <div className={styles.switchRow}>
          <span className={styles.switchText}>Already have an account?</span>
          <button className={styles.switchLink} onClick={() => navigate('/login')}>
            Log In
          </button>
        </div>

      </div>
    </div>
  );
};

export default SignupPage;