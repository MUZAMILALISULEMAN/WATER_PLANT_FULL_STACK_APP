import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { toast, Toaster } from 'sonner'
import './App.css'
import CustomerSection from './components/CustomerSection/CustomerSection';
import SalesSection from './components/SalesSection/SalesSection';
import SideBar from './components/SideBar/SideBar'
import Login from './components/login/login';
import DailyDispatchSection from './components/DailyDispatchSection/DailyDispatchSection';

const Dispatch  = memo(DailyDispatchSection);
const Customers = memo(CustomerSection);
const Sales     = memo(SalesSection);

function App() {
  const [activeTab,  setActiveTab]  = useState('customers');
  const [appUser,    setAppUser]    = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Cross-section refresh triggers ──────────────────────────────────────
  const [customerRefresh, setCustomerRefresh] = useState(false);
  const [salesRefresh,    setSalesRefresh]    = useState(false);

  const refreshCustomers = useCallback(() => setCustomerRefresh(p => !p), []);
  const refreshSales     = useCallback(() => setSalesRefresh(p => !p),    []);

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

        {/* Sales status updated → refresh Customers */}
        <Sales
          toast={toast}
          appUser={appUser}
          isVisible={activeTab === 'sales'}
          onSalesUpdated={refreshCustomers}
          externalRefresh={salesRefresh}
        />

        {/* Dispatch submitted → refresh both Sales and Customers */}
        <Dispatch
          toast={toast}
          appUser={appUser}
          isVisible={activeTab === 'dispatch'}
          onDispatchSubmitted={() => { refreshSales(); refreshCustomers(); }}
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