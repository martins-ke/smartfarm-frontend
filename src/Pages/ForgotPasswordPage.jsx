import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthPage.module.css';
import { forgotPassword } from '../APIs/user';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const res = await forgotPassword({ email });
      if (res.success) {
        setSuccess(res.message || 'Password reset link has been sent to your email. Please check your inbox.');
      } else {
        setError(res.message || 'No account found with this email address.');
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
        <div className={styles.brandHeader}>
          <div className={styles.brandIcon}>🌱</div>
          <h1 className={styles.brandName}>SmartFarm</h1>
        </div>

        <h2 className={styles.formTitle}>Reset Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enter your email address to receive a reset link.<br/><br/>
          <strong>Note:</strong> If you did not provide an email when your account was created, you must contact your Farm Administrator to reset your password.
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner} style={{ backgroundColor: 'var(--green-bg, #dcfce7)', color: 'var(--green-text, #166534)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>{success}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className={styles.input}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className={styles.switchRow}>
          <button className={styles.switchLink} onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
