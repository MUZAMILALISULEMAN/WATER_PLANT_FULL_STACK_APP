import React, { memo } from 'react';
import styles from '/src/components/SideBar/SideBar.module.css';

const NAV_ITEMS = [
  
  { id: 'customers', label: 'Customers', icon: 'fa-user' },
  { id: 'sales', label: 'Sales', icon: 'fa-dollar' },
  { id: 'dispatch', label: 'Daily Dispatch', icon: 'fa-calendar-day' },
  { id: 'stats', label: 'Stats & Analysis', icon: 'fa-chart-bar' },
  { id: 'billings', label: 'Billings', icon: 'fa-file-invoice' },
];
// { id: 'expenses', label: 'Daily Expenses', icon: 'fa-box-dollar' }

function SideBar({ activeTab, setActiveTab ,setIsLoggedIn}) {
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

      <button className={styles['sidebar__exit-btn']} onClick={() => setIsLoggedIn(false)}>
        <i className="fa-solid fa-arrow-left-to-bracket"></i> Exit
      </button>
    </div>
  );
}

export default memo(SideBar);