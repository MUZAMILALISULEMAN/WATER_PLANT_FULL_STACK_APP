import { useEffect, useRef, useState } from 'react'

import './App.css'
function ExitButton(){
  return (
    <button className='exit-button'><i className="fa-solid fa-arrow-left-to-bracket "></i>Exit</button>
  )
}

function SideBar({activeTab,setActiveTab}) { 

  return (
    <div className='sidebar-container'>
      <div className='brand-logo'>Tulip Water Plant</div>

    <div className="sidebar-items-group">
      <SideBarItems 
        name="Home" 
        active={activeTab === 'home'} 
        onClick={() => setActiveTab('home')} 
        icon="house"
      />
      
      <SideBarItems 
        name="Customers" 
        active={activeTab === 'customers'} 
        onClick={() => setActiveTab('customers')} 
        icon="user"
      />
      <SideBarItems 
        name="Sales" 
        active={activeTab === 'sales'} 
        onClick={() => setActiveTab('sales')} 
        icon="dollar"
        
      />
      <SideBarItems 
        name="Stats & Analysis" 
        active={activeTab === 'stats'} 
        onClick={() => setActiveTab('stats')} 
        icon="chart-bar"
      />
      <SideBarItems 
        name="Daily Expenses" 
        active={activeTab === 'expenses'} 
        onClick={() => setActiveTab('expenses')} 
        icon="box-dollar"
      />

    </div>

    <ExitButton></ExitButton>

    </div>


  )
}

function CustomerDetailsCard({ cust_id, Mode = "Read-Only" ,set_cust_id,isActive}) {

  
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
   
  
    const fetchCustomer = async () => {
      
      setLoading(true);
      try {
        
        const response = await fetch(`http://127.0.0.1:8000/customer/${cust_id}`);
        const data = await response.json();
        
        if (data.status) {
          setCustomerData(data.data); 
          console.log(data.data);
          
        }
      } catch (error) {
        console.error("Failed to fetch customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [cust_id]);

  if (!customerData) return null;

    const formatReadableDate = (isoString) => {
  if (!isoString) return "";
  
  const date = new Date(isoString);
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',   // "Feb"
    day: 'numeric',   // "5"
    year: 'numeric',  // "2026"
    hour: 'numeric',  // "11"
    minute: '2-digit',// "34"
    hour12: true      // "PM"
  }).format(date);
};


  return (
  <>
<div className="customer-card" style={{ display: (isActive ? "flex" : "none")}}>  
  <div className="customer-header">
    <i class="fa-solid fa-arrow-left" id='closeCustomerDetails' onClick={()=>{
      set_cust_id(-1)
    }}></i>
    <div className="customer-details">
      Customer Details      
    </div>
</div>

  <div className="customer-info">


        <div className="info-item">
      <div className="info-label">Customer ID</div>
      <div id="id-badge" className="info-value"> {customerData[0]}</div>
    </div>

     <div className="info-item">
      <div className="info-label">Customer Name</div>
      <div className="info-value"> {customerData[1]}</div>
    </div>



    <div className="info-item">
      <div className="info-label">Cell Phone</div>
      <div className="info-value">{customerData[2]}</div>
    </div>

    <div className="info-item">
      <div className="info-label">Address</div>
      <div className="info-value">
         {customerData[3] !== "" ? customerData[3] : "-" }
      </div>
    </div>

    <div className="info-item">
      <div className="info-label">Unit Price</div>
      <div className="info-value"> {customerData[4]}</div>
    </div>

    <div className="info-item">
      <div className="info-label">Advance Money</div>
      <div className="info-value"> {customerData[7]}</div>
    </div>

    <div className="info-item">
      <div className="info-label ">Active Status</div>
      <div id={(customerData[5] && "success-badge") || "error-badge"} className="info-value " > {(customerData[5] && "Active") || "Inactive"}</div>
    </div>

    <div className="info-item">
      <div className="info-label">Status Changed At</div>
      <div className="info-value">
        {formatReadableDate(customerData[6])}
      </div>
    </div>

    

  </div>

</div>

  </>
  );
}


function SideBarItems({ name, active, onClick , icon}) {
  return (
    <div 
      className={`sidebar-item ${active ? 'active' : ''}`} 
      onClick={onClick}
    >
      <i className={`fa-regular fa-${icon}`}></i>
      {name}
    </div>
  )
}

function CustomerStats({addCustomer}){
const [data,setData] = useState(null)

useEffect(()=>{

  const fetchData  =  async ()=>{
    let DATA = await fetch(`http://127.0.0.1:8000/customer/stats`)
    DATA = await DATA.json();
    
    if(DATA.status){
      setData(DATA.data)
      console.log(DATA.data);
      
    }
    
  }
  fetchData();
  
},[])
return (

<section className= {"stats-container"}>  
  {/* Card 1: Customer Overview */}
  <div className= "stat-card">
    <div className='title-container'>
    <h3 className="stat-title"><i class="fa-sharp fa-regular fa-people-group"></i>Total Customers</h3>
    
    <span className="stat-value total-customer">{data ? data[0] : 0}</span>
    </div>
    <div className="stat-content">
      <div className="stat-row">
        <span >Active: </span>
        <span className="stat-value active">{data ? data[1] : 0}</span>
      </div>
      <div className="stat-row ">
        <span>Inactive: </span>
        <span className="stat-value inactive">{data ? data[2] : 0}</span>
      </div>
    </div>
  </div>

  {/* Card 2: Top Performer */}
  <div className="stat-card highlight" >
    <div className='title-container'>
    <h3 className="stat-title"><i class="fa-regular fa-award"></i>Top Customer</h3>
    <span className="stat-value total-revenue">$12500</span>
    </div>
    <div className="stat-content">
      <div className="customer-name highlight">Waseem Badami</div>
      <div className="customer-meta"><span className="value-bottle highlight">120 </span> Deliveries / Month</div>
    </div>
  </div>
</section>



)


}

function AllCustomersDetailsSection({setSelectedCustomerId}){

 const [filterMode,setfilterMode]  = useState("id-asc");
 const [searchField,setSearchField] = useState("");
 const [dataFetched,setDataFetched] = useState(null);
 const searchInputRef = useRef(null); 



 useEffect(()=>{

  if(filterMode === "") return;
  const fetchData  =  async ()=>{
    let DATA = await fetch(`http://127.0.0.1:8000/customer/filter?q=${filterMode}`)
    DATA = await DATA.json();
    
    if(DATA.status){
      setDataFetched(DATA.data)
      console.log(DATA.data);
      
    }

  }
  fetchData();



 },[filterMode])

 useEffect(()=>{

  if(searchField === "") return;
  const fetchData  =  async ()=>{
    let DATA = await fetch(`http://127.0.0.1:8000/customer/search?q=${searchField}`)
    DATA = await DATA.json();
    
    if(DATA.status){
      setDataFetched(DATA.data)
      console.log(DATA.data);
      
    }

  }

  fetchData();

 },[searchField])

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // 2. Grab the value only when Enter is pressed
      const searchValue = searchInputRef.current.value;
      
      
      setSearchField(searchValue);
      
      
      // 3. Trigger your fetch logic here
      // fetchData(searchValue);
    }
  };
 
   
      
      
      
      
      
      
      
      
      
    
  



  return (

    <div className="customer-manager">
  {/* Header Section */}
  <header className="customer-manager-header">
    <div className="header-title">
      <h4>All Customers</h4>
    </div>

    <div className="controls-group">
      <div ><i class="fa-regular fa-folder"></i><span className="customer-count">{(dataFetched) ? dataFetched.length : 0}</span></div>
      <div className='controls-group-sub-container'>
      <div className="search-wrapper">
        <i class="fa-solid fa-magnifying-glass search-icon" onClick={()=>{
            setSearchField(searchInputRef.current.value);
        }}></i>
        <input 
          type="text" 
          placeholder="Search ID or Name..." 
          aria-label="Search customers"
          onKeyDown={handleKeyDown}
          ref={searchInputRef}
          />
      </div>
      <button className='add-customer-btn'><i class="fa-solid fa-plus "></i></button>
<FilterDropdown 
 
onSelect={(val) => setfilterMode(val)} 
/>
          </div>
    </div>
  </header>

  {/* Table Section */}
  <div className="table-responsive">
    <table className="customer-table">
      <thead>
        <tr>
          <th >Name</th>
          <th >ID</th>
          <th >Contact</th>
          <th >Status</th>
          <th >Actions</th>
        </tr>
      </thead>
      <tbody>
        
  {dataFetched !== null ? dataFetched.map((customer, index) => (
    <tr className="table-row">
      {/* Index 1: Name */}
      <td className="customer-name-cell">
        {customer[1]}
      </td>

      {/* Index 0: ID */}
      <td className="customer-id-cell">
        {customer[0]}
      </td>

      {/* Index 2: Contact */}
      <td className="customer-phone-cell">
        {customer[2]}
      </td>

      {/* Index 3: Status (Boolean to Text logic) */}
      <td>
        <span 
          className="customer-status-cell" 
          id={customer[3] ? 'success-badge' : 'error-badge'}
        >
          {customer[3] ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td  className="action-cells">
        <button className="customer-button-view" data-custid={customer[0]} onClick={(event)=>{

      setSelectedCustomerId(event.currentTarget.dataset.custid)
        }}>
          <i className="fa-regular fa-user-viewfinder"></i> View
        </button>
        <button className="customer-button-edit">
          <i className="fa-regular fa-pen-to-square"></i> Edit
        </button>
      </td>
    </tr>
  )) : null}

        

      </tbody>
    </table>
  </div>
</div>

)

}


function CustomerSection({ activeTab }) {

  const [selectedCustomerId, setSelectedCustomerId] = useState(-1);
  const [viewMode, setViewMode] = useState('Read-Only'); // or 'Edit'

  if (activeTab !== "customers") return null;

  return (
    <div className={  selectedCustomerId === -1 ?  "details-collapsed customer-section-layout" : "customer-section-layout"}>
      <div>


        <CustomerDetailsCard isActive={selectedCustomerId !== -1} 
        cust_id={selectedCustomerId} 
        set_cust_id = {setSelectedCustomerId}
        Mode={viewMode} 
        /> 
      
        </div>
        <div className= "customer-main-section-layout" >
          <CustomerStats isActive={selectedCustomerId !== -1} ></CustomerStats>
          <AllCustomersDetailsSection setSelectedCustomerId={setSelectedCustomerId}></AllCustomersDetailsSection>

        </div>
    </div>
  );
}



  const FilterDropdown = ({ onSelect }) => {
  const options = ["A-Z","Z-A" ,"1-*","+/-"]
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[2]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false); // Close menu after selection
    if (onSelect) onSelect(option==="+/-" ? "active" : option === "A-Z" ? "name-asc" : option==="Z-A" ? "name-desc" : "id-asc");
  };

  return (
    <div>
      <button onClick={toggleDropdown} >
        <i class="fa-regular fa-filter-list"></i>       
      </button>

      {isOpen && (
        <ul className='filter-menu' style={{zIndex:"1000"}}>
          {options.map((option) => (
            <li 
              
              className = {option == selected ? "active-menu-item filter-menu-item" : "filter-menu-item"} 
              key={option} 
              onClick={() => handleSelect(option)}
                
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


function App() {
  const [activeTab, setActiveTab] = useState('customers');
  return (
    <div className="app-layout">

      <SideBar activeTab={activeTab} setActiveTab={setActiveTab}/>
      <CustomerSection activeTab={activeTab}></CustomerSection>
      
    </div>
  )
}

export default App

