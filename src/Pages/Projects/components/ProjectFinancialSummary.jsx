import styles from '../ProjectDashboardPage.module.css';

export function ProjectFinancialSummary({ totalExpenses = 0, totalSales = 0, netValue = 0 }) {
  return (
    <div className={styles.summaryGrid}>
      <div className={styles.summaryCard}>
        <span>Total expenses</span>
        <strong style={{ color: '#ea580c' }}>
          Ksh. {Number(totalExpenses).toLocaleString()}
        </strong>
      </div>
      <div className={styles.summaryCard}>
        <span>Total sales</span>
        <strong style={{ color: 'var(--green-text, #15803d)' }}>
          Ksh. {Number(totalSales).toLocaleString()}
        </strong>
      </div>
      <div className={styles.summaryCard}>
        <span>Net value</span>
        <strong style={{ color: netValue >= 0 ? 'var(--green-text, #15803d)' : '#ef4444' }}>
          Ksh. {Number(netValue).toLocaleString()}
        </strong>
      </div>
    </div>
  );
}
