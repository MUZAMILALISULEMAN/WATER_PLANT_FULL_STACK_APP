import React, { useState, useRef, memo } from 'react';
import styles from './CustomerSection.module.css';
import CustomerDetailsCard from '../CustomerDetailsCard/CustomerDetailsCard';
import CustomerStats from '../CustomerStats/CustomerStats';
import AllCustomersDetailsSection from '../AllCustomersDetailsSection/AllCustomersDetailsSection';

const Stats         = memo(CustomerStats);
const CustomerTable = memo(AllCustomersDetailsSection);
const DetailsCard   = memo(CustomerDetailsCard);

// externalRefresh — flipped by App when Sales/Dispatch update something
// onCustomerUpdated — called after a customer edit, tells App to refresh Sales
function CustomerSection({ toast, appUser, isVisible, externalRefresh, onCustomerUpdated }) {
  const [refresh, setRefresh] = useState(false);
  const state = useRef('CUSTOMER-OPERATIONS');
  const [selectedCustomerId, setSelectedCustomerId] = useState(-1);
  const [Mode, setMode] = useState('None');

  const triggerRefresh = () => {
    setRefresh(prev => !prev);
    onCustomerUpdated?.(); // notify App → Sales will re-fetch
  };

  const layoutClassName = Mode === 'None'
    ? `${styles['customer-section']} ${styles['customer-section--collapsed']}`
    : styles['customer-section'];

  return (
    <div className={`${layoutClassName} ${isVisible ? styles['display-grid'] : styles['display-none']}`}>
      <aside className={styles['customer-section__sidebar']}>
        <DetailsCard
          cust_id={selectedCustomerId}
          triggerRefresh={triggerRefresh}
          toast={toast}
          Mode={Mode}
          setMode={setMode}
          set_cust_id={setSelectedCustomerId}
          appUser={appUser}
          refresh={refresh}
          state={state}
        />
      </aside>
      <main className={styles['customer-section__main']}>
        {/* externalRefresh keeps Stats in sync when Sales/Dispatch mutate data */}
        <Stats refresh={refresh} externalRefresh={externalRefresh} />
        <CustomerTable
          setSelectedCustomerId={setSelectedCustomerId}
          setMode={setMode}
          refresh={refresh}
          externalRefresh={externalRefresh}
          state={state}
        />
      </main>
    </div>
  );
}

export default CustomerSection;