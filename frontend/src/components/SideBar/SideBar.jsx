import styles from './SideBar.module.css';

function SideBar({ activeTab, setActiveTab }) {
  return (
    <div className={styles['sidebar']}>
      <div className={styles['sidebar__logo']}>Tulip Water Plant</div>

      <div className={styles['sidebar__items']}>
        <div 
          className={`${styles['sidebar__item']} ${activeTab === 'home' ? styles['sidebar__item--active'] : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <i className="fa-solid fa-house"></i> Home
        </div>

        <div 
          className={`${styles['sidebar__item']} ${activeTab === 'customers' ? styles['sidebar__item--active'] : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <i className="fa-solid fa-user"></i> Customers
        </div>

        <div 
          className={`${styles['sidebar__item']} ${activeTab === 'sales' ? styles['sidebar__item--active'] : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <i className="fa-solid fa-dollar"></i> Sales
        </div>

        <div 
          className={`${styles['sidebar__item']} ${activeTab === 'stats' ? styles['sidebar__item--active'] : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <i className="fa-solid fa-chart-bar"></i> Stats & Analysis
        </div>

        <div 
          className={`${styles['sidebar__item']} ${activeTab === 'expenses' ? styles['sidebar__item--active'] : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <i className="fa-solid fa-box-dollar"></i> Daily Expenses
        </div>
      </div>

      <button className={styles['sidebar__exit-btn']}>
        <i className="fa-solid fa-arrow-left-to-bracket"></i> Exit
      </button>
    </div>
  );
}

export default SideBar;