import React, { useState, useEffect, useRef, use } from 'react';
import styles from './AllCustomersDetailsSection.module.css';
import { toast } from 'sonner'; 

function FilterDropdown({ onSelect }) {
  const options = ["A-Z", "Z-A", "1-*", "+/-"];
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[2]);

  const toggleDropdown = () => setIsOpen(!isOpen);
  

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
    // Mapping your logic to the API filter strings
    const filterVal = option === "+/-" ? "active" : 
                      option === "A-Z" ? "name-asc" : 
                      option === "Z-A" ? "name-desc" : "id-asc";
    if (onSelect) onSelect(filterVal);
  };

  return (
    <div className={styles['filter-container']}>
      <button 
        className={styles['filter-button']} 
        onClick={toggleDropdown}
        type="button"
      >
        <i class="fa-solid fa-filter-list"></i> {selected}
      </button>

      {isOpen && (
        <ul className={styles['filter-menu']}>
          {options.map((option) => (
            <li
              key={option}
              className={`${styles['filter-menu-item']} ${selected === option ? styles['active-menu-item'] : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AllCustomersDetailsSection({ setSelectedCustomerId, setMode, state, refresh }) {
  const isLoading = useRef(false);
  const [filterMode, setfilterMode] = useState("id-asc");
  const [searchField, setSearchField] = useState("");
  const [dataFetched, setDataFetched] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isLoading.current) return;
    isLoading.current = true;

    const fetchData = async () => {
      let url = "";
      if (state.current === "FILTER" || state.current === "FILTER-REFRESH") {
        url = `http://127.0.0.1:8000/customer/filter?q=${filterMode}`;
      } else if (state.current === "SEARCH" || state.current === "SEARCH-REFRESH") {
        url = searchField === "" ? `http://127.0.0.1:8000/customer/` : `http://127.0.0.1:8000/customer/search?q=${searchField}`;
      }

      if (url) {
        try {
          let response = await fetch(url);
          let DATA = await response.json();
          if (DATA.status) {
            if (DATA.message && DATA.message.includes("there is no matching customer")) {
              toast.info(DATA.message);
            } 
            setDataFetched(DATA.data);
          }else{
            if(DATA.message &&  DATA.message != ""){
              toast.error(DATA.message);
            }
          }
        } catch (err) {
          toast.error("Network Issue try later.")
        }
      }
      isLoading.current = false;
    };

    fetchData();
  }, [filterMode, searchField, refresh]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setSearchField(searchInputRef.current.value);
      state.current = "SEARCH";
    }
  };

  return (
    <div className={styles['customer-manager']}>
      <header className={styles['customer-manager__header']}>
        <div className={styles['customer-manager__title-container']}>
          <h4 className={styles['customer-manager__title']}>All Customers</h4>
        </div>

        <div className={styles['customer-manager__controls']}>
          <div className={styles['customer-manager__stats']}>
            <i className="fa-regular fa-folder"></i>
            <span className={styles['customer-manager__count']}>
              {dataFetched ? dataFetched.length : 0}
            </span>
          </div>
          
          <div className={styles['customer-manager__actions-bar']}>
            <div className={styles['customer-manager__search-wrapper']}>
              <i 
                className={`fa-solid fa-magnifying-glass ${styles['customer-manager__search-icon']}`} 
                onClick={() => {
                  setSearchField(searchInputRef.current.value);
                  state.current = "SEARCH";
                }}
              ></i>
              <input
                className={styles['customer-manager__search-input']}
                type="text"
                placeholder="Search..."
                onKeyDown={handleKeyDown}
                ref={searchInputRef}
              />
            </div>
            
            <button 
              className={styles['customer-manager__add-btn']} 
              onClick={() => { setMode("Add"); setSelectedCustomerId(-2); }}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
            
            <FilterDropdown 
              onSelect={(val) => { setfilterMode(val); state.current = "FILTER"; }} 
            />
          </div>
        </div>
      </header>

      <div className={styles['customer-manager__table-wrapper']}>
        <table className={styles['customer-table']}>
          <thead className={styles['customer-table__head']}>
            <tr className={styles['customer-table__row']}>
              <th className={styles['customer-table__header']}>Name</th>
              <th className={styles['customer-table__header']}>ID</th>
              <th className={styles['customer-table__header']}>Contact</th>
              <th className={styles['customer-table__header']}>Status</th>
              <th className={styles['customer-table__header']}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles['customer-table__body']}>
            {dataFetched?.map((customer) => (
              <tr key={customer[0]} className={styles['customer-table__row']}>
                <td className={`${styles['customer-table__cell']} ${styles['customer-table__cell--name']}`}>
                  {customer[1]}
                </td>
                <td className={styles['customer-table__cell']}>{customer[0]}</td>
                <td className={styles['customer-table__cell']}>{customer[2]}</td>
                <td className={styles['customer-table__cell']}>
                  <span 
                    className={styles['customer-table__status']} 
                    id={customer[3] ? styles['success-badge'] : styles['error-badge']}
                  >
                    {customer[3] ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className={styles['customer-table__cell']}>
                  <button className={styles['customer-table__btn-view'] } id={customer[0]} onClick={() => { setSelectedCustomerId(customer[0]); setMode("View"); }}>  <i className="fa-regular fa-user-viewfinder"></i>  View</button>
                  <button className={styles['customer-table__btn-edit']} id={customer[0]} onClick={() => { setSelectedCustomerId(customer[0]); setMode("Edit"); }}><i className="fa-regular fa-pen-to-square"></i> Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllCustomersDetailsSection;