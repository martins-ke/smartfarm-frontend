import styles from '../ProjectDashboardPage.module.css';
import { recordTabs } from './ProjectTabs';

export function RecentRecordsSidebar({ recordsMap = {} }) {
  return (
    <aside className={styles.recentPanel}>
      <h3>Recent records</h3>

      {recordTabs.map((tab) => {
        const list = recordsMap[tab] || [];
        return (
          <div key={tab} className={styles.recordGroup}>
            <h4 style={{ color: '#7532e1' }}>{tab}</h4>
            {list.length === 0 ? (
              <p className={styles.emptyText}>No {tab} yet.</p>
            ) : (
              <ul>
                {list.slice(0, 5).map((entry) => (
                  <li key={entry.id}>
                    {entry.title || entry.item || 'Record'}
                    <span style={{ color: '#ee2ad1' }}>
                      {entry?.added_on || entry?.date || 'N/A'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </aside>
  );
}
