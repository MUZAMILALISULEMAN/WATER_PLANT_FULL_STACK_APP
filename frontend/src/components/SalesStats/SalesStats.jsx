import React, { useState, useEffect } from 'react';
import styles from './SalesStats.module.css';

/**
 * Data layout (index):
 * 0: total sales revenue
 * 1: sale account count
 * 2: cash sales count
 * 3: top sale amount
 * 4: top customer name
 * 5: bottles or litres
 */
function SalesStats({ refresh }) {
  const [data, setData] = useState([0, 0, 0, 0, 'Customer', 0,0,0,-1]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let DATA = await fetch('http://127.0.0.1:8001/sales/stats',{
          method:"GET",
          headers:{
            "Content-Type":"application/json"
          }
        });
        DATA = await DATA.json();
        console.log(DATA);
        

        if (DATA.status && DATA.data) { 
          setData(DATA.data);
        } else {
          setData([0, 0, 0, 0, 'Customer', 0,0,0,-1]);
        }
      } catch {
        setData([0, 0, 0, 0, 'Customer', 0,0,0,-1]);
      }
    };
    fetchData();
  }, [refresh]);

  return (
    <section className={styles.stats}>
      <div className={styles['stats__card']}>
        <div className={styles['stats__title-container']}>
          <h3 className={styles['stats__title']}>
            <i className="fa-solid fa-file-invoice-dollar"></i> Total Sales
          </h3>
          <span className={`${styles['stats__value']} ${styles['stats__value--total']}`}>
             {data?.[0] ?? 0}
          </span>
        </div>

        <div className={styles['stats__content']}>
          <div className={styles['stats__row']}>
            <span className={`${styles['stats__value']} ${styles['stats__value--account']}`}>
              {data?.[1] ?? 0}
            </span>
            <span>Sale Account</span>
          </div>

          <div className={styles['stats__row']}>
            <span className={`${styles['stats__value']} ${styles['stats__value--cash']}`}>
              {data?.[2] ?? 0}
            </span>
            <span>Cash Sales</span>
          </div>
        </div>
      </div>

      <div className={`${styles['stats__card']} ${styles['stats__card--highlight']}`}>
        <div className={styles['stats__title-container']}>
          <h3 className={styles['stats__title']}>
            <i className="fa-solid fa-trophy"></i> Top Sale
          </h3>
          <span className={`${styles['stats__value']} ${styles['stats__value--top']}`}>
            Rs {data?.[4] ?? 0}
          </span>
        </div>

        <div className={styles['stats__content']}>
          
          <div className={`${styles['stats__customer-name']} ${styles['stats__customer-name--highlight']}`}>
            {data?.[3] ?? 'Customer'} <span className={styles['stats--id_label']}>Sales ID —<span className={styles['badge--id-stats']}>{data?.[7] ?? -1}</span></span>
          </div>
        

          <div className={styles['stats__row']}>
            <span className={`${styles['stats__value']} ${styles['stats__value--qty-highlight']}`}>
              {data[6] != null ? data[6] : data[5] ?? 0}
               {!data?.[5] ? <span>{data[5]} Litres</span>: null}
               {!data?.[6] ? <span> Bottles</span>: null} 

            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SalesStats;