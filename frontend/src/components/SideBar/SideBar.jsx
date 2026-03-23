import React, { memo } from 'react';
import styles from './SideBar.module.css';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'fa-house' },
  { id: 'customers', label: 'Customers', icon: 'fa-user' },
  { id: 'sales', label: 'Sales', icon: 'fa-dollar' },
  { id: 'stats', label: 'Stats & Analysis', icon: 'fa-chart-bar' },
  { id: 'expenses', label: 'Daily Expenses', icon: 'fa-box-dollar' },
];

function SideBar({ activeTab, setActiveTab }) {
  return (
    <div className={styles['sidebar']}>
      <div className={styles['sidebar__logo']}>Tulip Water Plant</div>

      <div className={styles['sidebar__items']}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`${styles['sidebar__item']} ${
              activeTab === item.id ? styles['sidebar__item--active'] : ''
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <i className={`fa-solid ${item.icon}`}></i> {item.label}
          </div>
        ))}
      </div>

      <button className={styles['sidebar__exit-btn']}>
        <i className="fa-solid fa-arrow-left-to-bracket"></i> Exit
      </button>
    </div>
  );
}

export default memo(SideBar);