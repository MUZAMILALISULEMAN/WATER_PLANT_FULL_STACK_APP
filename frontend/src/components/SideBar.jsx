import styles from './SideBar.module.css';

// 1. Define the menu structure outside the component
const MENU_ITEMS = [
  { id: 'home',     name: 'Home',           icon: 'house' },
  { id: 'customers',name: 'Customers',      icon: 'user' },
  { id: 'sales',    name: 'Sales',          icon: 'dollar-sign' },
  { id: 'stats',    name: 'Stats & Analysis',icon: 'chart-bar' },
  { id: 'expenses', name: 'Daily Expenses', icon: 'wallet' },
];

function SideBar({ activeTab, setActiveTab }) {
  return (
    <div className={styles['sidebar']}>
      {/* Brand Section */}
      <div className={styles['sidebar__logo']}>
        Tulip Water Plant
      </div>

      {/* Navigation Section */}
      <nav className={styles['sidebar__menu']}>
        {MENU_ITEMS.map((item) => (
          <div 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              ${styles['sidebar__item']} 
              ${activeTab === item.id ? styles['sidebar__item--active'] : ''}
            `}
          >
            <i className={`fa-solid fa-${item.icon} ${styles['sidebar__icon']}`}></i>
            <span className={styles['sidebar__item-text']}>{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      <button className={styles['sidebar__exit-btn']}>
        <i className="fa-solid fa-arrow-right-to-bracket"></i>
        <span>Exit</span>
      </button>
    </div>
  );
}

export default SideBar;