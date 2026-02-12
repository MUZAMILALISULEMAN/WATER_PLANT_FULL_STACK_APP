import { useEffect, useRef, useState } from 'react'
import './App.css'
import { toast ,Toaster} from 'sonner'
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

function CustomerDetailsCard({ cust_id, Mode = "Add" ,setMode, set_cust_id ,triggerRefresh,refresh}) {

  if(Mode === "None") return;

  const cardRef = useRef(null);
  const customer_ref = useRef(null);
  
  const [customerData, setCustomerData] = useState(null);
  const [resetKey,setResetKey] = useState(false)
 

  useEffect(() => {
   
  if(cust_id <= -1 ) return;
    const fetchCustomer = async () => {
      
      
      try {
        
        const response = await fetch(`http://127.0.0.1:8000/customer/${cust_id}`);
        const data = await response.json();
        
        if (data.status) {


            let DATA_OBJ = {

              id : data.data[0],
              name : data.data[1],
              cell_phone : data.data[2],
              address : data.data[3],
              unit_price : data.data[4],
              advance_money : data.data[7],
              active : data.data[5],
              status_changed_at  : data.data[6]
              
            };

          setCustomerData(DATA_OBJ); 
       
          
        }
      } catch (error) {
        console.error("Failed to fetch customer:", error);
      } finally {
        
      }
    };

    fetchCustomer();
  }, [cust_id,resetKey,refresh]);

  if ( !customerData && Mode !== "Add") return null;

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



const handleSubmit = ()=>{ 
  if (!cardRef.current) return;

  const items = cardRef.current.querySelectorAll(".info-item .info-value");
  const json = {};

  // 1. Helper: Robust cleaning for comparison
  const clean = (str) => String(str ?? "").replace(/\s|&nbsp;|\u00A0/g, '').toLowerCase();

  // 2. Define the Mapping
  // This maps the DOM index to the key name in your database/state
  const fieldMapping = [
    { index: 1, key: "name", type: "string" },
    { index: 2, key: "cell_phone", type: "string" },
    { index: 3, key: "address", type: "string" },
    { index: 4, key: "unit_price", type: "number" },
    { index: 5, key: "advance_money", type: "number" },
  ];

  // 3. Process Fields Automatically
  fieldMapping.forEach(({ index, key, type }) => {
    const rawValue = items[index]?.innerText || "";
    const currentValue = customerData[key];

    if (type === "number") {
      // Comparison for numeric fields
      if (parseFloat(rawValue) !== parseFloat(currentValue)) {
        json[key] = rawValue.trim();
      }
    } else {
      // Comparison for string fields using your 'clean' logic
      if (clean(rawValue) !== clean(currentValue)) {
        json[key] = rawValue.trim().toLowerCase();
      }
    }
  });

  
  
  const isActiveStatus = clean(items[6].innerText) === 'active' ? true : false; 
 
  console.log("cust active: " , customerData.active);
  console.log("active status: " , isActiveStatus);
  if ( isActiveStatus !== customerData.active) {
    json["is_active"] = isActiveStatus;
  }

  

    const postData = async ()=>{
      
      
      
      const res = await fetch(`http://127.0.0.1:8000/customer/update/${cust_id}`, {
      method: "PUT", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json), 
    });
    
    const data = await res.json();
    console.log("RESPONSE DATA: ",data);
  
    if(!data.status){

      toast.error(data.message)
      setResetKey(resetKey => !resetKey);
      
    }else{
      

      toast.success(data.message)
      triggerRefresh()
      setMode("View");
    }
    
  } 

    
    console.log(json);
    


  if(Object.keys(json).length !== 0){
    console.log("calling");

    postData();

}




}
    const handleKeyEnter = (event)=>{
      if(Mode === "Edit" && event.key == 'Enter' ){
        event.preventDefault();
          event.target.blur();

      }
    } 
    
    
  return (
  <>
  
<div className="customer-card"  key={`${Mode === "Add" ? -1 : customerData.id}-${resetKey}`} ref={cardRef}>  
  <div className="customer-header">
    <i className="fa-solid fa-arrow-left" id='closeCustomerDetails' onClick={()=>{setMode("None")
    }}></i>
    <div className="customer-details">
      {Mode === "View" ? "Customer View" :  Mode === "Add" ? "Customer Add" : "Customer Edit"}      
    </div>
</div>


  {(Mode !== "Add" ? <div className="customer-info">


        <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label" >Customer ID</div>
      <div id="id-badge" className="info-value"  key={customerData.id}> {customerData.id} </div>
    </div>

     <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label">Customer Name</div>
      <div spellcheck="false" className={`${Mode === "Edit" ? "editable-name" : ""} info-value`} contentEditable={Mode === "Edit" ? true  : false}  onKeyDown={handleKeyEnter}> {customerData.name}</div>
    </div>



    <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label">Cell Phone</div>
      <div spellcheck="false" className={`${Mode === "Edit" ? "editable-name" : ""} info-value`} contentEditable={Mode === "Edit" ? true  : false} onKeyDown={handleKeyEnter}>{customerData.cell_phone}</div>
    </div>

    <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label">Address</div>
      <div spellcheck="false" className={`${Mode === "Edit" ? "editable-name" : ""} info-value`} contentEditable={Mode === "Edit" ? true  : false} onKeyDown={handleKeyEnter}>
         {customerData.address !== "" ? customerData.address : "No Address" }
      </div>
    </div>

    <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label">Unit Price</div>
      <div spellcheck="false" className={`${Mode === "Edit" ? "editable-name" : ""} info-value`} contentEditable={Mode === "Edit" ? true  : false} onKeyDown={handleKeyEnter}> {customerData.unit_price}</div>
    </div>

    <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label">Advance Money</div>
      <div spellcheck="false" className={`${Mode === "Edit" ? "editable-name" : ""} info-value`} contentEditable={Mode === "Edit" ? true  : false} onKeyDown={handleKeyEnter}> {customerData.advance_money}</div>
    </div>

    <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label ">Active Status</div>
      <div id={(customerData.active && "success-badge") || "error-badge"} className="info-value " onClick={(e)=>{

        
        if(Mode === "Edit"){ 
          let ans = e.target.innerText === "Active" ? "Inactive" : "Active"; 
          e.target.innerText = e.target.innerText === "Active" ? "Inactive" : "Active";
          e.target.id = `${ans === "Active" ? "success-badge" : "error-badge"}`
        }
      }}> {(customerData.active && "Active") || "Inactive"}</div>
    </div>

    <div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
      <div className="info-label">Status Changed At</div>
      <div className="info-value">
        {formatReadableDate(customerData.status_changed_at)}
      </div>
    </div>

    {(Mode === "Edit" ? (<div className={`info-item ${Mode==="Edit" ? "mb-10" : ""}`}>
        <button className='submit-edit-customer' onClick={handleSubmit}>Submit </button>
    </div>) : null)}
    

    

  </div> : <>
  
  
  <div class="customer-add" ref={customer_ref}>
  

  <div className="add-item">
    <label className="add-label">Customer Name</label>
    <input className="add-input" placeholder='Enter Customer Name...'></input>
  </div>

 <div className="add-item">
    <label className="add-label">Cell Phone</label>
    <input className="add-input" placeholder='Enter Cell Phone...'></input>
  </div>

  <div className="add-item">
    <label className="add-label" >Address</label>
    <input className="add-input" placeholder='Enter Address...' formNoValidate></input>
  </div>

  <div className="add-item">
    <label className="add-label" >Unit Price</label>
    <input className="add-input" placeholder='Enter Unit Price...'></input>
  </div>

  <div className="add-item">
    <label className="add-label">Advance Money</label>
    <input className="add-input" placeholder='Enter Advance Money...'></input>
  </div>



  <div className="add-item">
    <button class="submit-add-customer"  onClick={(e)=>{

      e.preventDefault();




        


    }} >Submit</button>
  </div>

</div>
  
  
  
  
  
  
  
  
  </>)}


  

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

function CustomerStats({refresh}){
const [data,setData] = useState(null)

useEffect(()=>{

  const fetchData  =  async ()=>{
    let DATA = await fetch(`http://127.0.0.1:8000/customer/stats`)
    DATA = await DATA.json();
    
    if(DATA.status){
      setData(DATA.data)
    }else{
      setData([0,0,0])
    }
  }
  fetchData();
  
},[refresh])
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
    <span className="stat-value total-revenue">$100</span>
    </div>
    <div className="stat-content">
      <div className="customer-name highlight">Muzamil Suleman</div>
      <div className="customer-meta"><span className="value-bottle highlight">120 </span> Deliveries / Month</div>
    </div>
  </div>
</section>



)


}

function AllCustomersDetailsSection({setSelectedCustomerId,setMode,state,refresh}){


const isLoading  = useRef(false);
 const [filterMode,setfilterMode]  = useState("id-asc");
 const [searchField,setSearchField] = useState("");
 const [dataFetched,setDataFetched] = useState(null);
 const searchInputRef = useRef(null); 



 useEffect(()=>{

   
   if(isLoading.current) return;
   
   isLoading.current = true;


   if(state.current === "FILTER" || state.current === "FILTER-REFRESH"){
  const fetchFilterData  =  async ()=>{

      let DATA = await fetch(`http://127.0.0.1:8000/customer/filter?q=${filterMode}`)
      DATA = await DATA.json();
    
      if(DATA.status){
      setDataFetched(DATA.data)
      }
    
    }
    fetchFilterData();
  }
else if(state.current === "SEARCH" || state.current === "SEARCH-REFRESH"){

  let url = `http://127.0.0.1:8000/customer/search?q=${searchField}`;
  if(searchField === "") url = "http://127.0.0.1:8000/customer/";
  
  const fetchSearchData  =  async ()=>{
    let DATA = await fetch(`${url}`)
    DATA = await DATA.json();
    
    if(DATA.status){
   
      
      if(DATA.message.includes("there is no matching customer")){
        toast.info(DATA.message)
        return;
      }
      setDataFetched(DATA.data)
      
      
    }
    
  }
  fetchSearchData();
}

isLoading.current = false;


},[filterMode,searchField,refresh])


  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const searchValue = searchInputRef.current.value;
      setSearchField(searchValue);
      state.current  = "SEARCH";
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
            state.current  = "SEARCH";
        }}></i>
        <input 
          type="text" 
          placeholder="Search ID or Name..." 
          aria-label="Search customers"
          onKeyDown={handleKeyDown}
          ref={searchInputRef}
          />
      </div>
      <button className='add-customer-btn' onClick={()=> {setMode("Add");setSelectedCustomerId(-2)}}><i class="fa-solid fa-plus "></i></button>
      <FilterDropdown onSelect={(val) => {setfilterMode(val); state.current  = "FILTER";}}/>
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
        
  {dataFetched !== null ? dataFetched.map((customer) => (
    <tr className="table-row">
      {/* Index 1: Name */}
      <td className={`customer-name-cell capitalized`}>
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
      setMode("View");
        }}>
          <i className="fa-regular fa-user-viewfinder"></i> View
        </button>
        <button className="customer-button-edit" data-custid={customer[0]} onClick={(event)=>{
      
      setSelectedCustomerId(event.currentTarget.dataset.custid)
      setMode("Edit");
        }}>
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
  const stateLastAction =  useRef("SEARCH");
  const [refresh,setRefresh] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(-1);
  const [Mode, setMode] = useState('None'); 

  const triggerRefresh = ()=>{
    setRefresh(refresh => !refresh)
  }
  if (activeTab !== "customers") return null;

  return (
    <div className={  Mode === "None" ?  "details-collapsed customer-section-layout" : "customer-section-layout"}>
      <div>

        {console.log(selectedCustomerId)}
        <CustomerDetailsCard 
        cust_id={selectedCustomerId} 
        triggerRefresh = {triggerRefresh}
        set_cust_id = {setSelectedCustomerId}
        Mode={Mode} 
        setMode={setMode}
        refresh={refresh}
        

        /> 
      
        </div>
        <div className= "customer-main-section-layout" >
          <CustomerStats  refresh={refresh}></CustomerStats>
          <AllCustomersDetailsSection setSelectedCustomerId={setSelectedCustomerId} setMode={setMode}  state={stateLastAction}  refresh={refresh}></AllCustomersDetailsSection >
          
        </div>
    </div>
  );
}

  function FilterDropdown({ onSelect }){
  const options = ["A-Z","Z-A" ,"1-*","+/-"]
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[2]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false); 
    if (onSelect) onSelect(option==="+/-" ? "active" : option === "A-Z" ? "name-asc" : option==="Z-A" ? "name-desc" : "id-asc");
  };


  


  return (
    <div>
      <button onClick={()=>{
        toggleDropdown()        
      }} >
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
      <CustomerSection activeTab={activeTab} ></CustomerSection>
     <Toaster
     visibleToasts={1}
     unstyled={true}
     duration={2000}
    
  toastOptions={{
    classNames: {
      success: 'my-success-toast',
      error: 'my-error-toast',
      info:'my-info-toast'
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

