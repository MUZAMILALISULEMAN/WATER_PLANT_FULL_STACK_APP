import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import './App.css'
import CustomerSection from './components/CustomerSection/CustomerSection';
import SalesSection from './components/SalesSection/SalesSection';
import SideBar from './components/SideBar/SideBar'
import Login from './components/login/login';
import DailyDispatchSection from './components/DailyDispatchSection/DailyDispatchSection';
import StatsSection from './components/StatsSection/StatsSection';
import BillingsSection from './components/BillingsSection/BillingsSection';


const Billings = memo(BillingsSection);
const Stats = memo(StatsSection);
const Dispatch  = memo(DailyDispatchSection);
const Customers = memo(CustomerSection);
const Sales     = memo(SalesSection);





function App() {
  const [activeTab,  setActiveTab]  = useState('stats');
  const [appUser,    setAppUser]    = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const [customerRefresh, setCustomerRefresh] = useState(false);
  const [salesRefresh,    setSalesRefresh]    = useState(false);
  const refreshCustomers = useCallback(() => setCustomerRefresh(p => !p), []);
const refreshSales     = useCallback(() => setSalesRefresh(p => !p),    []);
const onDispatchSubmitted = useCallback(() => {
  refreshSales();
  refreshCustomers();
}, [refreshSales, refreshCustomers]);

  return (
    isLoggedIn ? ( 
      <div className="app-layout">
        <SideBar activeTab={activeTab} setActiveTab={setActiveTab} setIsLoggedIn={setIsLoggedIn} />

        {/* Customer updated → refresh Sales */}
        <Customers
          toast={toast}
          appUser={appUser}
          isVisible={activeTab === 'customers'}
          onCustomerUpdated={refreshSales}
          externalRefresh={customerRefresh}
        />

   
        <Sales
          toast={toast}
          appUser={appUser}
          isVisible={activeTab === 'sales'}
          onSalesUpdated={refreshCustomers}
          externalRefresh={salesRefresh}
        />

       
        <Dispatch
          toast={toast}
          appUser={appUser}
          isVisible={activeTab === 'dispatch'}
          onDispatchSubmitted={onDispatchSubmitted}
        />

      <Stats
  isVisible={activeTab === 'stats'}
  externalRefresh={`${customerRefresh}|${salesRefresh}`}
/>

<Billings
  isVisible={activeTab === 'billings'}
  toast={toast}
  externalRefresh={`${customerRefresh}|${salesRefresh}`}
  onBillingUpdated={refreshSales}
/>


        <Toaster
          visibleToasts={1}
          unstyled={true}
          duration={2000}
          toastOptions={{
            classNames: {
              success: 'success-toast',
              error:   'error-toast',
              info:    'info-toast',
            },
          }}
          icons={{
            success: <i className='fa-solid fa-check'></i>,
            error:   <i className="fa-solid fa-x"></i>,
            info:    <i className="fa-solid fa-info"></i>,
          }}
        />
      </div>
    ) : (
      <Login onLogin={(id) => { setAppUser(id); setIsLoggedIn(true); }} />
    )
  );
}

export default App;