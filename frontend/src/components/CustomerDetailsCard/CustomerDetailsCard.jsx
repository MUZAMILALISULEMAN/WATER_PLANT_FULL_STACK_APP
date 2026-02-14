import React, { useState, useEffect, useRef } from 'react';
import styles from './CustomerDetailsCard.module.css';

function CustomerDetailsCard({ cust_id, Mode = "Add", setMode,toast, triggerRefresh, refresh }) {
  if (Mode === "None") return null;

  const cardRef = useRef(null);
  const customer_ref = useRef(null);
  const [customerData, setCustomerData] = useState(null);
  const [resetKey, setResetKey] = useState(false);

  useEffect(() => {
    if (cust_id <= -1) return;
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/customer/${cust_id}`);
        const data = await response.json();
        if (data.status) {
          let DATA_OBJ = {
            id: data.data[0],
            name: data.data[1],
            cell_phone: data.data[2],
            address: data.data[3],
            unit_price: data.data[4],
            advance_money: data.data[7],
            active: data.data[5],
            status_changed_at: data.data[6]
          };
          setCustomerData(DATA_OBJ);
        }
      } catch (error) {
        toast.error("Server is not responding, try later.");
      }
    };
    fetchCustomer();
  }, [cust_id, resetKey, refresh]);

  if (!customerData && Mode !== "Add") return null;

  const formatReadableDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  const handleSubmit = () => {
    if (!cardRef.current) return;
    
    // Logic traversal using the new BEM classes from the styles object
    const items = cardRef.current.querySelectorAll(`.${styles['customer-card__value']}`);
    const json = {};
    const clean = (str) => String(str ?? "").replace(/\s|&nbsp;|\u00A0/g, '').toLowerCase();

    const fieldMapping = [
      { index: 1, key: "name", type: "string" },
      { index: 2, key: "cell_phone", type: "string" },
      { index: 3, key: "address", type: "string" },
      { index: 4, key: "unit_price", type: "number" },
      { index: 5, key: "advance_money", type: "number" },
    ];

    fieldMapping.forEach(({ index, key, type }) => {
      const rawValue = items[index]?.innerText || "";
      const currentValue = customerData[key];
      if (type === "number") {
        if (parseFloat(rawValue) !== parseFloat(currentValue)) json[key] = rawValue.trim();
      } else {
        if (clean(rawValue) !== clean(currentValue)) json[key] = rawValue.trim().toLowerCase();
      }
    });

    const isActiveStatus = clean(items[6].innerText) === 'active';
    if (isActiveStatus !== customerData.active) {
      json["is_active"] = isActiveStatus;
    }

    const postData = async () => {

    

        const res = await fetch(`http://127.0.0.1:8000/customer/update/${cust_id}`, {
          method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const data = await res.json();
      

      if (data.status) {
        toast.success(data.message);
        triggerRefresh();
        setMode("View");
      } else {
        if(data.message && data.message != "") toast.error(data.message); 
        
        setResetKey(prev => !prev);
      }
    
      
    }

    try{

       
      if (Object.keys(json).length !== 0) postData();

      
      
    }catch{

      toast.error(data.message);

    }
  };

  const handleKeyEnter = (event) => {
    if (Mode === "Edit" && event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  };

  return (
    <div className = {` ${styles['customer-card']} ${Mode === "Add" ? styles['customer-card--gap-space-xl'] : ""}` } key={`${Mode === "Add" ? -1 : customerData.id}-${resetKey}`} ref={cardRef}>
      <div className={styles['customer-card__header']}>
        <i className="fa-solid fa-arrow-left" onClick={() => setMode("None")}></i>
        <div className={styles['customer-card__title']}>
          {Mode === "View" ? "Customer View" : Mode === "Add" ? "Customer Add" : "Customer Edit"}
        </div>
      </div>

      {Mode !== "Add" ? (
        <div className={styles['customer-card__info-group']}>
          {/* ID Item */}
          <div className={styles['customer-card__info-item']}>
            <div className={styles['customer-card__label']}>Customer ID</div>
            <div className={`${styles['customer-card__value']} ${styles['customer-card__value--id']}`}>
              {customerData.id}
            </div>
          </div>

          {/* Editable Items */}
          {[
            { label: "Customer Name", value: customerData.name },
            { label: "Cell Phone", value: customerData.cell_phone },
            { label: "Address", value: customerData.address || "No Address" },
            { label: "Unit Price", value: customerData.unit_price },
            { label: "Advance Money", value: customerData.advance_money },
          ].map((item, idx) => (
            <div key={idx} className={`${styles['customer-card__info-item']} ${Mode === "Edit" ? styles['customer-card__info-item--editing'] : ""}`}>
              <div className={styles['customer-card__label']}>{item.label}</div>
              <div
                spellCheck="false"
                className={`${styles['customer-card__value']} ${Mode === "Edit" ? styles['customer-card__value--editable'] : ""}`}
                contentEditable={Mode === "Edit"}
                onKeyDown={handleKeyEnter}
              >
                {item.value}
              </div>
            </div>
          ))}

          {/* Active Status Toggle */}
          <div className={`${styles['customer-card__info-item']} ${Mode === "Edit" ? styles['customer-card__info-item--editing'] : ""}`}>
            <div className={styles['customer-card__label']}>Active Status</div>
            <div
              className={styles['customer-card__value']}
              id={customerData.active ? styles['success-badge'] : styles['error-badge']}
              onClick={(e) => {
                if (Mode === "Edit") {
                  const isActive = e.target.innerText === "Active";
                  e.target.innerText = isActive ? "Inactive" : "Active";
                  e.target.id = isActive ? styles['error-badge'] : styles['success-badge'];
                }
              }}
            >
              {customerData.active ? "Active" : "Inactive"}
            </div>
          </div>

          <div className={styles['customer-card__info-item']}>
            <div className={styles['customer-card__label']}>Status Changed At</div>
            <div className={styles['customer-card__value']}>{formatReadableDate(customerData.status_changed_at)}</div>
          </div>

          {Mode === "Edit" && (
            <div className={styles['customer-card__info-item']}>
              <button className={styles['customer-card__submit-btn']} onClick={handleSubmit}>Submit</button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles['customer-card__add-form']} ref={customer_ref}>
          {/* Add form inputs */}
          {[
            { label: "Customer Name", icon: "fa-user", placeholder: "Muzamil Bhai" },
            { label: "Cell Phone", icon: "fa-phone", placeholder: "03XXXXXXXXX", validate: true },
            { label: "Address", icon: "fa-location-dot", placeholder: "ABC-House-123 Shah Town" },
            { label: "Unit Price", icon: "fa-rupee-sign", placeholder: "Price", defaultVal: "60" },
            { label: "Advance Money", icon: "fa-sharp fa-right-from-line", placeholder: "Advance", defaultVal: "0" },
          ].map((field, idx) => (
            <div key={idx} className={styles['customer-card__add-item']}>
              <label className={styles['customer-card__add-label']}>{field.label}</label>
              <div className={styles['customer-card__input-wrapper']}>
                <input 
                  data-id={idx}
                  className={styles['customer-card__input']} 
                  placeholder={field.placeholder} 
                  defaultValue={field.defaultVal}
                  
                />
                <i className={`fa-solid ${field.icon}`}></i>
                <span className={styles['customer-card__validation-msg']}></span>
              </div>
            </div>
          ))}
          <div className={styles['customer-card__add-item']}>
            <button className={styles['customer-card__add-submit']} onClick={(e) =>{

              
              
              const fields = customer_ref.current.querySelectorAll(`.${styles['customer-card__input']}`);
              let requestBody = {
                name : (fields[0].value).trim().toLowerCase(),
                cell_phone : fields[1].value.trim().toLowerCase(),
                address: fields[2].value.trim().toLowerCase(),
                unit_price : fields[3].value.trim().toLowerCase(),
                advance_money : fields[4].value.trim().toLowerCase()
              }


               if(requestBody.name === ""){

                toast.error("name is empty.")
                return;
                
                
              }


              if(requestBody.cell_phone === ""){

                toast.error("cell phone is empty.")
                return;
                
                
              }else if(!(/^03\d{9}$/.test(requestBody.cell_phone))){
                toast.error("cell phone format is not correct.")

                return;
              }
              if(requestBody.unit_price === ""){
                toast.error("price is empty.")
                return;

              }else if(parseFloat(requestBody.unit_price) < 0){ 
                toast.error("price is negative.")
                return;
                
              }
              
              if(requestBody.advance_money === ""){
                
                requestBody.advance_money = 0;
                
                
              }else if(parseFloat(requestBody.advance_money) < 0){
                toast.error("advance is negative.")
                return;
              }
              const clearForm = () => {
                
                
                
                for (let i = 0; i < 5; i++) {
                  fields[i].value = "";
                  
                }
              }

              requestBody.unit_price = parseInt(requestBody.unit_price);
              requestBody.advance_money = parseInt(requestBody.advance_money);

              console.log(JSON.stringify(requestBody));
              

              const postData = async ()=>{
                 let data = await fetch("http://127.0.0.1:8000/customer/add",{
                    method:"POST",
                    body: JSON.stringify(requestBody),  
                    headers: {
        'Content-Type': 'application/json', // MUST BE PRESENT
    },

                  })
                  data = await data.json();
                  
                  if(data.status){

                    toast.success(data.message)
                    triggerRefresh();
                    clearForm();
                    
                    
                  }else{
                    toast.error(data.message)
                    

                  }


                }

              try{

                postData();

              }
              catch{

                toast.error("server is not responding, try later.")

              }

              
  
              
                
                
                e.preventDefault()
                
              }
              }>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetailsCard;