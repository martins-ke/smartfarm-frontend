import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './AuthPage.module.css';
import { loginUser } from '../APIs/user';
import useAuth from '../useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuth(state => state.login);

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await loginUser({ username: form.username, password: form.password });
      if (res.success) {
        login(res.body);
        navigate('/');
      } else {
        setError(res.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>

        {/* Brand */}
        <div className={styles.brandHeader}>
          <div className={styles.brandIcon}>🌱</div>
          <h1 className={styles.brandName}>SmartFarm</h1>
          <p className={styles.brandTagline}>Manage your farm effortlessly</p>
        </div>

        <h2 className={styles.formTitle}>Log In</h2>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* Username or Email */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="username">Username or Email</label>
            <input
              id="username"
              name="username"
              className={styles.input}
              type="text"
              placeholder="Enter username or email"
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
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className={styles.switchLink}
                style={{ fontSize: '0.85rem' }}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} /> Signing in...
              </>
            ) : (
              'Log In'
            )}
          </button>

        </form>

        <div className={styles.switchRow}>
          <span className={styles.switchText}>Don't have an account?</span>
          <button className={styles.switchLink} onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;