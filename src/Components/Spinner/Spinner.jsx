import styles from './Spinner.module.css';

/**
 * Spinner – theme-aware loading indicator.
 * Props:
 *   size     – 'sm' | 'md' (default) | 'lg'
 *   label    – optional text shown below the spinner
 *   fullPage – if true, centers in full available space
 */
export const Spinner = ({ size = 'md', label, fullPage = false }) => {
    return (
        <div className={`${styles.wrapper} ${fullPage ? styles.fullPage : ''}`}>
            <div className={`${styles.ring} ${styles[size]}`}>
                <div className={styles.arc} />
            </div>
            {label && <p className={styles.label}>{label}</p>}
        </div>
    );
};