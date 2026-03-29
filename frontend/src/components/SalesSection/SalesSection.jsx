import React, { useState, useCallback, useRef, memo } from 'react';
import styles from './SalesSection/SalesSection.module.css';
import SalesDetailsCard from './SalesDetailsCard/SalesDetailsCard.jsx';
import SalesStats from './SalesStats/SalesStats.jsx';
import AllSalesDetailsSection from './AllSalesDetailsSection/AllSalesDetailsSection.jsx';

const Stats             = memo(SalesStats);
const DetailsCard       = memo(SalesDetailsCard);
const AllDetailsSection = memo(AllSalesDetailsSection);

// externalRefresh — flipped by App when Customer/Dispatch update something
// onSalesUpdated  — called after a status update, tells App to refresh Customers
function SalesSection({ toast, appUser, isVisible, externalRefresh, onSalesUpdated }) {
  const state               = useRef('SALES-OPERATIONS');
  const [refresh,           setRefresh]           = useState(false);
  const [selectedSalesId,   setSelectedSalesId]   = useState(-1);
  const [Mode,              setMode]              = useState('Add');
  const [isCollapsed,       setIsCollapsed]       = useState(false);

  const triggerRefresh = useCallback(() => {
    setRefresh(prev => !prev);
    onSalesUpdated?.(); // notify App → Customers will re-fetch
  }, [onSalesUpdated]);

  const handleSetMode           = useCallback((m)  => setMode(m),            []);
  const handleSetSelectedSalesId = useCallback((id) => setSelectedSalesId(id), []);

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
          setMode={handleSetMode}
          refresh={refresh}
          appUser={appUser}
          setIsCollapsed={setIsCollapsed}
          state={state}
        />
      </aside>
      <main className={styles['sales-section__main']}>
        {/* externalRefresh keeps Stats in sync when Customer/Dispatch mutate data */}
        <Stats refresh={refresh} externalRefresh={externalRefresh} />
        <AllDetailsSection
          setSelectedSalesId={handleSetSelectedSalesId}
          setMode={handleSetMode}
          state={state}
          triggerRefresh={triggerRefresh}
          refresh={refresh}
          externalRefresh={externalRefresh}
          toast={toast}
          isCollapsed={isCollapsed}
          appUser={appUser}
        />
      </main>
    </div>
  );
}

export default SalesSection;