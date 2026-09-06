import { useEffect, useRef } from 'react';
import styles from '../ProjectDashboardPage.module.css';
import {
  FaMoneyBillWave,
  FaClipboardList,
  FaStore,
  FaLeaf,
  FaBoxes,
  FaPlus,
  FaMinus
} from 'react-icons/fa';

export const recordTabs = ['expenses', 'activities', 'sales', 'harvest'];

const tabIcons = {
  expenses: FaMoneyBillWave,
  activities: FaClipboardList,
  sales: FaStore,
  harvest: FaLeaf,
};

export function ProjectTabs({
  activeTab,
  onSelectTab,
  showRecordForm,
  onToggleRecordForm,
  canUseSupplies,
  onOpenUseSupplies,
  canRecordInTab,
  hasHarvestsForSale
}) {
  const tabsContainerRef = useRef(null);
  const tabButtonRefs = useRef({});

  // Center active tab button when selected
  useEffect(() => {
    const activeBtn = tabButtonRefs.current[activeTab];
    const container = tabsContainerRef.current;
    if (activeBtn && container) {
      const containerWidth = container.offsetWidth;
      const buttonLeft = activeBtn.offsetLeft;
      const buttonWidth = activeBtn.offsetWidth;
      const targetScrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  return (
    <div className={styles.recordHeader}>
      <div className={styles.tabs} ref={tabsContainerRef}>
        {recordTabs.map((tab) => {
          const Icon = tabIcons[tab];
          return (
            <button
              key={tab}
              ref={(el) => {
                tabButtonRefs.current[tab] = el;
              }}
              type="button"
              className={activeTab === tab ? styles.tabActive : ''}
              onClick={() => onSelectTab(tab)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon />
                {tab}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.actionButtonsWrap}>
        {activeTab === 'expenses' && canUseSupplies && (
          <button
            type="button"
            className={styles.useSuppliesBtn}
            onClick={onOpenUseSupplies}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <FaBoxes /> Use Supplies
            </span>
          </button>
        )}

        {canRecordInTab && (
          <button
            type="button"
            className={styles.addButton}
            onClick={onToggleRecordForm}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              {showRecordForm ? <FaMinus /> : <FaPlus />}
              {showRecordForm ? 'Close form' : `Record ${activeTab}`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
