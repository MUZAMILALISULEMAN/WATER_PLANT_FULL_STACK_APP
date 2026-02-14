import React, { useState, useRef } from 'react';
import styles from './CustomerSection.module.css';
import CustomerDetailsCard from '../CustomerDetailsCard/CustomerDetailsCard';
import CustomerStats from '../CustomerStats/CustomerStats';
import AllCustomersDetailsSection from '../AllCustomersDetailsSection/AllCustomersDetailsSection';

function CustomerSection({ activeTab ,toast}) {
  const stateLastAction = useRef("SEARCH");
  const [refresh, setRefresh] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(-1);
  const [Mode, setMode] = useState('None');

  const triggerRefresh = () => {
    setRefresh(prev => !prev);
  };

  if (activeTab !== "customers") return null;

  // Combine base layout with the modifier for collapsed state
  const layoutClassName = Mode === "None" 
    ? `${styles['customer-section']} ${styles['customer-section--collapsed']}` 
    : styles['customer-section'];

  return (
    <div className={layoutClassName}>
      <aside className={styles['customer-section__sidebar']}>
        <CustomerDetailsCard 
          cust_id={selectedCustomerId} 
          triggerRefresh={triggerRefresh}
          toast={toast}
          Mode={Mode} 
          setMode={setMode}
          refresh={refresh}
        /> 
      </aside>

      <main className={styles['customer-section__main']}>
        <CustomerStats refresh={refresh} />
        <AllCustomersDetailsSection 
          setSelectedCustomerId={setSelectedCustomerId} 
          setMode={setMode} 
          state={stateLastAction} 
          refresh={refresh}
        />
      </main>
    </div>
  );
}

export default CustomerSection;