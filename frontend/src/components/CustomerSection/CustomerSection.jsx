import React, { useState, useRef ,memo} from 'react';
import styles from './CustomerSection.module.css';
import CustomerDetailsCard from '../CustomerDetailsCard/CustomerDetailsCard';
import CustomerStats from '../CustomerStats/CustomerStats';
import AllCustomersDetailsSection from '../AllCustomersDetailsSection/AllCustomersDetailsSection';


const Stats = memo(CustomerStats);
const CustomerTable = memo(AllCustomersDetailsSection);
const DetailsCard = memo(CustomerDetailsCard);


function CustomerSection({  toast,appUser,isVisible}) {
  
  const [refresh, setRefresh] = useState(false);
  const state = useRef("CUSTOMER-OPERATIONS");
  const [selectedCustomerId, setSelectedCustomerId] = useState(-1);
  const [Mode, setMode] = useState('None');

  const triggerRefresh = () => {
    setRefresh(prev => !prev);
  };

  

  // Combine base layout with the modifier for collapsed state
  const layoutClassName = Mode === "None" 
    ? `${styles['customer-section']} ${styles['customer-section--collapsed']}` 
    : styles['customer-section'];

  return (
    <div className={`${layoutClassName} ${isVisible ? styles["display-grid"] : styles["display-none"]}`}>
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

        <Stats  refresh={refresh}/>
        <CustomerTable 
          setSelectedCustomerId={setSelectedCustomerId} 
          setMode={setMode} 
          refresh={refresh}
          state={state}
        />
      </main>
    </div>
  );
}

export default CustomerSection;