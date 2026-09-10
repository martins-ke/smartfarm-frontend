import { useMemo } from 'react';
import styles from './ErrorState.module.css';
import { 
  FaWifi, 
  FaServer, 
  FaLock, 
  FaExclamationTriangle, 
  FaRedoAlt 
} from 'react-icons/fa';

export function ErrorState({
  error = null,
  title = '',
  description = '',
  onRetry = null,
  variant = 'full', // 'full' | 'card'
  showDiagnostics = false
}) {
  const errMeta = useMemo(() => {
    const rawMsg = typeof error === 'string' ? error : (error?.message || '');
    const isOffline = typeof window !== 'undefined' && window.navigator && !window.navigator.onLine;
    const lower = rawMsg.toLowerCase();
    const isNetwork = error?.isNetworkError || isOffline || lower.includes('connect') || lower.includes('offline') || lower.includes('network') || lower.includes('fetch');
    const isAuth = error?.isAuthError || error?.status === 401 || error?.status === 403 || lower.includes('denied') || lower.includes('unauthorized');
    const isServer = error?.isServerError || error?.status >= 500 || lower.includes('server error');

    if (isOffline) {
      return {
        icon: <FaWifi />,
        iconClass: styles.iconNetwork,
        defaultTitle: 'You Are Offline',
        defaultDesc: 'Please check your internet or Wi-Fi connection and try again.',
      };
    }

    if (isNetwork) {
      return {
        icon: <FaServer />,
        iconClass: styles.iconNetwork,
        defaultTitle: 'Cannot Connect to AgroSync Server',
        defaultDesc: 'The backend service appears unreachable.',
      };
    }

    if (isAuth) {
      return {
        icon: <FaLock />,
        iconClass: styles.iconAuth,
        defaultTitle: 'Access Restricted / Session Expired',
        defaultDesc: rawMsg || 'You do not have permissions for this resource or your session has expired.',
      };
    }

    if (isServer) {
      return {
        icon: <FaServer />,
        iconClass: styles.iconServer,
        defaultTitle: 'Server Error Encountered',
        defaultDesc: rawMsg || 'An unexpected problem occurred while processing the request on the server.',
      };
    }

    return {
      icon: <FaExclamationTriangle />,
      iconClass: styles.iconDefault,
      defaultTitle: 'Unable to Load Data',
      defaultDesc: rawMsg || 'An unexpected issue occurred. Please try refreshing.',
    };
  }, [error]);

  const displayTitle = title || errMeta.defaultTitle;
  const displayDesc = description || errMeta.defaultDesc;

  return (
    <div className={`${styles.errorWrap} ${variant === 'card' ? styles.cardVariant : styles.fullVariant}`}>
      <div className={`${styles.iconWrap} ${errMeta.iconClass}`}>
        {errMeta.icon}
      </div>

      <h3 className={styles.title}>{displayTitle}</h3>
      <p className={styles.description}>{displayDesc}</p>

      {showDiagnostics && error && (
        <pre className={styles.diagnostics}>
          {typeof error === 'object' ? JSON.stringify({ message: error.message, status: error.status, name: error.name }, null, 2) : String(error)}
        </pre>
      )}

      {onRetry && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={onRetry}
            title="Retry loading data from server"
          >
            <FaRedoAlt size={12} /> Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
