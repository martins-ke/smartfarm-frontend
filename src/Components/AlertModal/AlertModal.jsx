import { useEffect, useState } from 'react';
import styles from './AlertModal.module.css';

export function AlertModal({ message, type = 'error', onClose }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) setTimeout(onClose, 200); // Wait for transition
  };

  if (!message && !visible) return null;

  return (
    <div className={`${styles.overlay} ${visible ? styles.show : styles.hide}`}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          {type === 'error' && <span className={styles.iconError}>!</span>}
          {type === 'success' && <span className={styles.iconSuccess}>✓</span>}
          {type === 'info' && <span className={styles.iconInfo}>i</span>}
        </div>
        <h3 className={styles.title}>
          {type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice'}
        </h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.okButton} onClick={handleClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
