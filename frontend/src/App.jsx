import { useEffect, useRef, useState } from 'react'
import { toast ,Toaster} from 'sonner'
import './App.css'
import CustomerSection from './components/CustomerSection/CustomerSection';
import SideBar from './components/SideBar/SideBar'  

function App() {
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div className="app-layout">

      <SideBar activeTab={activeTab} setActiveTab={setActiveTab}/>
      <CustomerSection activeTab={activeTab}
       toast={toast}></CustomerSection>
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
    error: <i class="fa-solid fa-x"></i>,
    info:<i class="fa-solid fa-info"></i>
  }}


/>

     
      
    </div>
  )
}

export default App