import React, { useState, useRef, memo } from 'react';
import styles from './SalesSection.module.css';
import SalesDetailsCard from '../SalesDetailsCard/SalesDetailsCard';
import SalesStats from '../SalesStats/SalesStats';
import AllSalesDetailsSection from '../AllSalesDetailsSection/AllSalesDetailsSection';

const Stats             = memo(SalesStats);
const DetailsCard       = memo(SalesDetailsCard);
const AllDetailsSection = memo(AllSalesDetailsSection);

function SalesSection({ toast, appUser, isVisible }) {

  const state       = useRef('SALES-OPERATIONS');
  const [refresh, setRefresh] = useState(false);
  const [selectedSalesId, setSelectedSalesId] = useState(-1);
  const [Mode, setMode] = useState('Add');
  const [isCollapsed, setIsCollapsed] = useState(Mode === 'None');

  const triggerRefresh = () => setRefresh(prev => !prev);

  const layoutClassName = Mode === 'None'
    ? `${styles['sales-section']} ${styles['sales-section--collapsed']}`
    : styles['sales-section'];

  const visibilityClass = isVisible ? styles['display-grid'] : styles['display-none'];

  return (
    <div className={`${layoutClassName} ${visibilityClass}`}>
      <aside className={styles['sales-section__sidebar']}>
        <DetailsCard
          sales_id={selectedSalesId}
          triggerRefresh={triggerRefresh}
          toast={toast}
          Mode={Mode}
          setMode={setMode}
          refresh={refresh}
          appUser={appUser}
          setIsCollapsed={setIsCollapsed}
          state={state}
        />
      </aside>
      <main className={styles['sales-section__main']}>
        <Stats refresh={refresh} />
        <AllDetailsSection
          setSelectedSalesId={setSelectedSalesId}
          setMode={setMode}
          state={state}
          triggerRefresh={triggerRefresh}
          refresh={refresh}
          toast={toast}
          isCollapsed={isCollapsed}
          appUser={appUser}
        />
      </main>
    </div>
  );
}

export default SalesSection;