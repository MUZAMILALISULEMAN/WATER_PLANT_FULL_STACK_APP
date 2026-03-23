import React, { useState, useEffect, useRef,memo, use } from 'react';
import styles from './AllSalesDetailsSection.module.css';

const API_BASE = 'http://127.0.0.1:8001';

const Table = memo(SalesTable)



// ── Status dropdown per row ──────────────────────────────────────────────────
function StatusDropdown({ salesId, currentStatus, onUpdated, toast ,refresh, state,appUser}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    
     if(currentStatus === 'pending'){

       setOptions(['paid', 'deleted'])
    }else if(currentStatus === 'deleted'){
      setOptions(['pending','paid'])
    }else{
      setOptions(['pending','deleted'])
    } 
    

  }, [refresh]);

  useEffect(() => { 
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const handleSelect = async (newStatus) => {
    setOpen(false);
    try {
      const res = await fetch(`${API_BASE}/sales/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales_id: salesId, sales_status: newStatus ,user_id:appUser}),
      });
      if (!res.ok) {
        toast.error('Server internal error, try later.');
        return;
      }
      const data = await res.json();
      
      if (data.status) {
        toast.success(data.message || 'Status updated.');
        onUpdated();
        // state.current = 'SALES-OPERATIONS';
      } else {
        toast.error(data.message || 'Could not update status.');
      }
    } catch(e) {
      console.log(e);
      // console.log("here");
      
      toast.error('Server is not responding, try later.');
    }
  };

  return (
    <div className={styles['status-dd']} ref={ref}>
      <button
        className={styles['status-dd__trigger']}
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        title="Update status"
        type="button"
      >
        <i className="fa-solid fa-chevron-down" />
      </button>
      {open && (
        <ul className={styles['status-dd__menu']}>
          {options.map((opt) => (
            <li
              key={opt}
              className={`${styles['status-dd__item']}  ${styles[`status-dd__item--${opt}`]}`}
              onClick={() => handleSelect(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Filter dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ onSelect }) {
  const options = [ '1-*', '+/-','Rs'];
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
    const filterVal =
      option === '+/-'  ? 'status' :
      option === '1-*'  ? 'id-asc'       :
      option === 'Rs'  ? 'price-desc'       : 'id-asc';
    onSelect?.(filterVal);
  };

  return (
    <div className={styles['filter-container']}>
      <button
        className={styles['filter-button']}
        onClick={() => setIsOpen((p) => !p)}
        type="button"
      >
        <i className="fa-solid fa-filter-list" /> {selected}
      </button>
      {isOpen && (
        <ul className={styles['filter-menu']}>
          {options.map((opt) => (
            <li
              key={opt}
              className={`${styles['filter-menu-item']} ${selected === opt ? styles['active-menu-item'] : ''}`}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Sales Table Component ────────────────────────────────────────────────────
function SalesTable({ dataFetched, setSelectedSalesId,setMode,triggerRefresh,toast ,refresh,state,appUser}) {
  const getQty = (row) => {
    if (row[5] != null) return { val: row[5], unit: 'B' };
    if (row[4] != null) return { val: row[4], unit: 'L' };
    return { val: '—', unit: '' };
  };

  const statusBadgeClass = (s) => {
    const v = String(s ?? '').trim().toLowerCase();
    if (v === 'paid')    return styles['badge--success'];
    if (v === 'deleted') return styles['badge--error']
    return styles['badge--pending'];
  };

  const typeBadgeClass = (t) => {
    const v = String(t ?? '').trim().toLowerCase();
    if (v === 'account') return styles['badge--account'];
    if (v === 'cod')     return styles['badge--cod'];
    return styles['badge--vendor'];
  };

  return (
    <div className={styles['sales-manager__table-wrapper']}>
      <table className={styles['sales-table']}>
        <thead className={styles['sales-table__head']}>
          <tr className={styles['sales-table__row']}>
            <th className={styles['sales-table__header']}>Customer</th>
            <th className={styles['sales-table__header']}>ID</th>
            <th className={styles['sales-table__header']}>Type</th>
            <th className={styles['sales-table__header']}>Qty</th>
            <th className={styles['sales-table__header']}>Price</th>
            <th className={styles['sales-table__header']}>Status</th>
            <th className={styles['sales-table__header']}>Actions</th>
          </tr>
        </thead>
        <tbody className={styles['sales-table__body']}>
          {dataFetched?.map((row) => {
            const qty    = getQty(row);
            const status = String(row[7] ?? '').trim().toLowerCase();
            return (
              <tr key={row[0]} className={styles['sales-table__row']}>
                {/* Customer name */}
                <td className={`${styles['sales-table__cell']} ${styles['sales-table__cell--name']}`}>
                  {row[1] ?? '—'}
                </td>
                {/* Sales ID */}
                <td className={styles['sales-table__cell']}>{row[0]}</td>
                {/* Sales type badge */}
                <td className={styles['sales-table__cell']}>
                  <span className={`${styles['badge']} ${typeBadgeClass(row[3])}`}>
                    {row[3] ?? '—'}
                  </span>
                </td>
                {/* Qty */}
                <td className={styles['sales-table__cell']}>
                  {qty.val} <span className={styles['unit-label']}>{qty.unit}</span>
                </td>
                {/* Price */}
                <td className={styles['sales-table__cell']}>
                  {row[6] != null ? `Rs ${row[6]}` : '—'}
                </td>
                {/* Status badge */}
                <td className={styles['sales-table__cell']}>
                  <span className={`${styles['badge']} ${styles['badge--pill']} ${statusBadgeClass(row[7])}`}>
                    {row[7] ?? '—'}
                  </span>
                </td>
                {/* Actions */}
                <td className={`${styles['sales-table__cell']} ${styles['sales-table__cell--actions']}`}>
                  <button
                    className={styles['sales-table__btn-view']}
                    onClick={() => { setSelectedSalesId(row[0]); setMode('View');}}
                    type="button"
                  >
                    <i className="fa-regular fa-chisel fa-expand" /> View
                  </button>
                  <StatusDropdown
                    salesId={row[0]}
                    currentStatus={status}
                    onUpdated={triggerRefresh}
                    toast={toast}
                    refresh={refresh}
                    state={state}
                    appUser={appUser}

                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function AllSalesDetailsSection({ setSelectedSalesId, setMode, refresh, triggerRefresh, toast, isCollapsed ,state,appUser}) {
  const dateBarRef = useRef(null);
  const isLoading   = useRef(false);
  
  const [filterMode,   setFilterMode]   = useState('id-asc');
  const [searchField,  setSearchField]  = useState('');
  const [dataFetched,  setDataFetched]  = useState(null);
  const [dateRange,    setDateRange]    = useState({ start: '', end: '' });
  const [activeShortcut, setActiveShortcut] = useState(null);
  const searchInputRef = useRef(null);

  // ── Date helpers ──
  const toDateStr = (d) => d.toISOString().split('T')[0];
  const today     = () => toDateStr(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toDateStr(d); };
  const weekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toDateStr(d);
  };
  const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; };

  const shortcuts = [
    { label: 'Today',      start: today,      end: today      },
    { label: 'Yesterday',  start: yesterday,  end: yesterday  },
    { label: 'This Week',  start: weekStart,  end: today      },
    { label: 'This Month', start: monthStart, end: today      },
  ];

  const applyShortcut = (s, idx) => {
    const range = { start: s.start(), end: s.end() };
    setDateRange(range);
    setActiveShortcut(idx);
    state.current = 'DATE';
    isLoading.current = false;
  };

  const clearDate = () => {
    setDateRange({ start: '', end: '' });
    setActiveShortcut(null);
    state.current = 'SEARCH';
    isLoading.current = false;
  };

useEffect(() => {
  const fetchData = async () => {
    
    
    try {
      let res;
      
      if (state.current === 'SALES-OPERATIONS' || state.current === 'DATE' && (dateRange.start || dateRange.end)) {
        res = await fetch(`${API_BASE}/sales/all`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: dateRange.start || null, end: dateRange.end || null }),
        });
        
      } else if (state.current === 'FILTER' || state.current === 'FILTER-REFRESH') {
        
        
        res = await fetch(`${API_BASE}/sales/filter?q=${filterMode}`,{method:"PUT",headers:{'Content-Type':'application/json'},body: JSON.stringify({ start: dateRange.start || null, end: dateRange.end || null })});
      } else {
        
        
        res = searchField === ''
          ? await fetch(`${API_BASE}/sales/all`,{method:"PUT",headers:{'Content-Type':'application/json'},body: JSON.stringify({ start: null, end: null })} ) :
           await fetch(`${API_BASE}/sales/search?q=${searchField}`,{method:"GET",headers:{'Content-Type':'application/json'}}); 
           
      }
      if (!res.ok) { toast.error('Server internal error, try later.'); return; }
      const data = await res.json();
      console.log(data);
      
      if (data.status) setDataFetched(data.data); 
      else if (data.message) toast.error(data.message);
    } catch(e) {
      console.log(e);
      
      toast.error('Network issue, try later.');
    }
  };

  fetchData();
}, [filterMode, searchField, dateRange,refresh,]);

// useEffect(() => {
//   if (!refresh) return;

//   const fetchData = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/sales/`);
//       if (!res.ok) { toast.error('Server internal error, try later.'); return; }
//       const data = await res.json();
//       if (data.status) setDataFetched(data.data);
//       else if (data.message) toast.error(data.message);
//     } catch {
//       toast.error('Network issue, try later.');
//     }
//   };

//   fetchData();
// }, [refresh]);




  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchField(searchInputRef.current.value.trim().toLowerCase());
      state.current = 'SEARCH';
    }
  };

  return (
    <div className={styles['sales-manager']}>
      <header className={styles['sales-manager__header']}>
        <div className={styles['sales-manager__title-container']}>
          <h4 className={styles['sales-manager__title']}>All Sales</h4>
        </div>
        <div className={styles['sales-manager__controls']}>
          <div className={styles['sales-manager__stats']}>
            <i className="fa-regular fa-folder" />
            <span className={styles['sales-manager__count']}>
              {dataFetched ? dataFetched.length : 0}
            </span>
          </div>
          <div className={styles['sales-manager__actions-bar']}>
            <div className={styles['sales-manager__search-wrapper']}>
              <i
                className={`fa-solid fa-magnifying-glass ${styles['sales-manager__search-icon']}`}
                onClick={() => {
                  setSearchField(searchInputRef.current.value.trim().toLowerCase());
                  console.log(searchInputRef);
                  
                  state.current = 'SEARCH';
                }}
              />
              <input
                className={styles['sales-manager__search-input']}
                type="text"
                placeholder="Search..."
                onKeyDown={handleKeyDown}
                ref={searchInputRef}
              />
            </div>
            <button
              className={styles['sales-manager__add-btn']}
              onClick={() => {setMode('Add');}}
              type="button"
            >
              <i className="fa-solid fa-plus" />
            </button>
            <FilterDropdown
              onSelect={(val) => { setFilterMode(val); state.current = 'FILTER';
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Date range bar ── */}
      <div className={styles['date-bar']}>
        <div className={`${styles['date-bar__shortcuts']} ` } >
          {shortcuts.map((s, idx) => (
            <button
              
              key={s.label}
              type="button"
              className={`${styles['date-bar__shortcut']} ${activeShortcut === idx ? styles['date-bar__shortcut--active'] : ''} ${!isCollapsed ? styles['date-bar__shortcuts--card--opened'] : ''}`}
              onClick={() => applyShortcut(s, idx)}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles['date-bar__clear']} ${activeShortcut === null ? styles['date-bar__clear--hide'] : ''}`}
            onClick={clearDate}
            title="Clear date filter"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className={styles['date-bar__inputs']}>
          <input
            type="date"
            className={styles['date-bar__input']}
            value={dateRange.start}
            onChange={(e) => {
              setDateRange((p) => ({ ...p, start: e.target.value }));
              setActiveShortcut(null);
              state.current = 'DATE';
              isLoading.current = false;
            }}
          />
          <span className={styles['date-bar__sep']}>—</span>
          <input
            type="date"
            className={styles['date-bar__input']}
            value={dateRange.end}
            onChange={(e) => {
              setDateRange((p) => ({ ...p, end: e.target.value }));
              setActiveShortcut(null);
              state.current = 'DATE';
              isLoading.current = false;
            }}
          />
        </div>
      </div>

      {/* ── Sales Table ── */}
      <Table
        dataFetched={dataFetched}
        setSelectedSalesId={setSelectedSalesId}
        setMode={setMode}
        triggerRefresh={triggerRefresh}
        toast={toast}
        refresh={refresh}
        state={state}
        appUser={appUser}
      />
    </div>
  );
}

export default AllSalesDetailsSection;