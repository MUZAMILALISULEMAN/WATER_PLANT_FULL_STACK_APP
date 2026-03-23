import { useEffect, useRef, useState, memo } from 'react'
import { toast ,Toaster} from 'sonner'
import './App.css'
import CustomerSection from './components/CustomerSection/CustomerSection';
import SalesSection from './components/SalesSection/SalesSection';
import SideBar from './components/SideBar/SideBar'  
import Login from './components/login/login';

  const Customers = memo(CustomerSection);
  const Sales = memo(SalesSection);

function App() {
  const [activeTab, setActiveTab] = useState('customers');
  const [appUser,setAppUser] = useState(1);
  const [isLoggedIn,setIsLoggedIn] = useState(false);

  return  (
  isLoggedIn ? (
    <div className="app-layout">

      <SideBar activeTab={activeTab} setActiveTab={setActiveTab}/>
      
      <Customers  
       toast={toast} appUser={appUser}  isVisible={activeTab === "customers"}></Customers>
       
       <Sales 
         toast={toast} 
         appUser={appUser} 
         isVisible={activeTab === "sales"}
       />


     <Toaster
     visibleToasts={1}
     unstyled={true}
     duration={2000}
    
  toastOptions={{
    classNames: {
      success: 'success-toast',
      error: 'error-toast',
      info:'info-toast'
    }
  }}
  icons={{
    success: <i className='fa-solid fa-check'></i>,
    error: <i className="fa-solid fa-x"></i>,
    info:<i className="fa-solid fa-info"></i>
  }}


/>
      
    </div> 
  ) : <Login onLogin={(id) => { setAppUser(id); setIsLoggedIn(true); }} /> )



}


export default App