import { useEffect, useRef, useState } from 'react';
import styles from './MessageCard.module.css';

// MessageCard component
// Props:
// - message (string) required: the text to display. If falsy, the component renders null.
// - duration (number) optional: milliseconds before auto-dismiss (default 6000)
// - type (string) optional: 'info' | 'success' | 'error' (affects styling)
// - onClose (function) optional: called after the card fully hides

export function MessageCard({ message, duration = 6000, type = 'info', onClose }) {
  const [visible, setVisible] = useState(Boolean(message));
  const hideTimer = useRef(null);

  // when message changes, show and schedule hide
  useEffect(() => {
    // clear any previous timer
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);

    hideTimer.current = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [message, duration]);

  // when visibility becomes false, call onClose after animation completes
  useEffect(() => {
    if (!visible && message) {
      const t = setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 300); // match CSS transition duration
      return () => clearTimeout(t);
    }
    return;
  }, [visible, message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`${styles.container} ${visible ? styles.show : styles.hide} ${styles[type] || ''}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.content}>{message}</div>
      <div className={styles.actions}>
        <button
          className={styles.okButton}
          onClick={() => {
            setVisible(false);
            if (typeof onClose === 'function') onClose();
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
