import { useEffect, useState } from 'react';
import styles from './ConfirmModal.module.css';
import { FaExclamationTriangle, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';

export function ConfirmModal({ data, onClose }) {
  const [visible, setVisible] = useState(Boolean(data));

  useEffect(() => {
    setVisible(Boolean(data));
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!visible) return;
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, data]);

  const handleCancel = () => {
    setVisible(false);
    if (data?.onCancel) data.onCancel();
    if (onClose) setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    setVisible(false);
    if (data?.onConfirm) data.onConfirm();
    if (onClose) setTimeout(onClose, 200);
  };

  if (!data && !visible) return null;

  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' // 'warning' | 'danger' | 'info'
  } = data || {};

  return (
    <div className={`${styles.overlay} ${visible ? styles.show : styles.hide}`} onClick={handleCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          {type === 'danger' && (
            <div className={styles.iconDanger}>
              <FaExclamationTriangle />
            </div>
          )}
          {type === 'warning' && (
            <div className={styles.iconWarning}>
              <FaQuestionCircle />
            </div>
          )}
          {type === 'info' && (
            <div className={styles.iconInfo}>
              <FaInfoCircle />
            </div>
          )}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${type === 'danger' ? styles.dangerBtn : styles.primaryBtn}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
