import React, { useState, useEffect } from 'react';
import styles from './CustomerStats.module.css';

function CustomerStats({ refresh }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      let DATA = await fetch(`http://127.0.0.1:8000/customer/stats`);
      DATA = await DATA.json();

      if (DATA.status) {
        setData(DATA.data);
      } else {
        setData([0, 0, 0]);
      }
    };
    fetchData();
  }, [refresh]);

  return (
    <section className={styles['stats']}>
      {/* Card 1: Customer Overview */}
      <div className={styles['stats__card']}>
        <div className={styles['stats__title-container']}>
          <h3 className={styles['stats__title']}>
            <i className="fa-sharp fa-regular fa-people-group"></i> Total Customers
          </h3>
          <span className={`${styles['stats__value']} ${styles['stats__value--total']}`}>
            {data ? data[0] : 0}
          </span>
        </div>
        
        <div className={styles['stats__content']}>
          <div className={styles['stats__row']}>
            
            <span className={`${styles['stats__value']} ${styles['stats__value--active']}`}>
              {data ? data[1] : 0}
            </span>
            <span> Active Customers</span>
          </div>
          <div className={styles['stats__row']}>
            
            <span className={`${styles['stats__value']} ${styles['stats__value--inactive']}`}>
              {data ? data[2] : 0}
            </span>
            <span> Inactive Customers </span>
          </div>
        </div>
      </div>

      {/* Card 2: Top Performer */}
      <div className={`${styles['stats__card']} ${styles['stats__card--highlight']}`}>
        <div className={styles['stats__title-container']}>
          <h3 className={styles['stats__title']}>
            <i className="fa-regular fa-award"></i> Top Customer
          </h3>
          <span className={`${styles['stats__value']} ${styles['stats__value--revenue']}`}>$100</span>
        </div>
        
        <div className={styles['stats__content']}>
          <div className={`${styles['stats__customer-name']} ${styles['stats__customer-name--highlight']}`}>
            Muzamil Suleman
          </div>
          <div className={styles['stats__customer-meta']}>
            <span className={`${styles['stats__value-bottle']} ${styles['stats__value-bottle--highlight']}`}>120 </span> 
            Deliveries / Month
          </div>
        </div>
      </div>
    </section>
  );
}

export default CustomerStats;