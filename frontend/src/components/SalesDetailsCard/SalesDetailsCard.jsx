import React, { useState, useEffect, useRef } from 'react';
import styles from './SalesDetailsCard.module.css';

const API_BASE = 'http://127.0.0.1:8001';

function normalizeSalesRow(data) {
  const rows = data?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row = Array.isArray(rows[0]) ? rows[0] : rows;
  return row && row.length >= 8 ? row : null;
}

function displayValue(v) {
  if (v === null || v === undefined || v === '') return '—';
  return v;
}

const CASH_DEFAULTS = { consumer_name: '', quantity: '', price: '', sales_status: 'paid' };
const ACCT_DEFAULTS = { quantity: '', price: '', sales_status: 'pending' };

function SalesDetailsCard({
  sales_id,
  appUser,
  Mode = 'Add',
  setMode,
  toast,
  triggerRefresh,
  refresh,
  setIsCollapsed,
  state
}) {
  if (Mode === 'None') return null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [salesData,      setSalesData]      = useState(null);
  const [systemType,     setSystemType]     = useState('cash');
  const [unitType,       setUnitType]       = useState('bottles');
  const [vendorType,     setVendorType]     = useState('vendor');
  const [priceUnlocked,  setPriceUnlocked]  = useState(false);
  const [formState,      setFormState]      = useState(CASH_DEFAULTS);

  const [custSearch,     setCustSearch]     = useState('');
  const [custResults,    setCustResults]    = useState([]);
  const [selectedCust,   setSelectedCust]   = useState(null);
  const [showDropdown,   setShowDropdown]   = useState(false);

  const [isFetching,     setIsFetching]     = useState(false);   // card-level spinner (View)
  const [isSubmitting,   setIsSubmitting]   = useState(false);   // submit button spinner

  // ── Refs ───────────────────────────────────────────────────────────────────
  const searchRef       = useRef(null);
  const submitLockRef   = useRef(false);      // blocks double-submit on Add form
  const fetchAbortRef   = useRef(null);       // AbortController for fetchSales
  const searchAbortRef  = useRef(null);       // AbortController for customer search

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced customer search with AbortController ─────────────────────────
  useEffect(() => {
    if (!custSearch.trim() || systemType !== 'account') {
      setCustResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel any previous in-flight search
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const res = await fetch(
          `${API_BASE}/sales/search_customer/${encodeURIComponent(custSearch)}`,
          { signal: controller.signal },
        );
        if (!res.ok) { toast.error('Server Internal Error.'); return; }
        const data = await res.json();
        if (data.status && Array.isArray(data.data)) {
          const mapped = data.data.map(row => ({
            cust_id:    row[0],
            name:       row[1],
            unit_price: row[2],
          }));
          setCustResults(mapped);
          setShowDropdown(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') { /* silently fail */ }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Don't abort here — let the debounce timer handle stale requests
    };
  }, [custSearch, systemType]);

  // ── Fetch sale + reset on mode / id change ─────────────────────────────────
  useEffect(() => {
    if (Mode !== 'None') setIsCollapsed(false);

    if (Mode === 'Add') {
      setSalesData(null);
      setSystemType('cash');
      setUnitType('bottles');
      setVendorType('vendor');
      setPriceUnlocked(false);
      setCustSearch('');
      setCustResults([]);
      setSelectedCust(null);
      setShowDropdown(false);
      setFormState(CASH_DEFAULTS);
      return;
    }

    if (sales_id == null || sales_id <= -1) return;

    // Cancel any previous in-flight fetch
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const fetchSales = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(`${API_BASE}/sales/${sales_id}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data?.message || data?.detail || 'Could not load sale.');
          setSalesData(null);
          return;
        }

        const row = normalizeSalesRow(data);
        if (data.status && row) {
          setSalesData({
            sales_id:      row[0],  customer_name: row[1],  cust_id:    row[2],
            sales_type:    row[3],  litres:        row[4],  bottles:    row[5],
            price:         row[6],  sales_status:  row[7],  created_at: row[8],
            modified_at:   row[9],  modified_by:   row[10],
          });
        } else {
          setSalesData(null);
          if (data.message) toast.info(data.message);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Server is not responding, try later.');
          setSalesData(null);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchSales();

    return () => controller.abort();
  }, [sales_id, refresh, Mode]);

  // ── Derived flags ──────────────────────────────────────────────────────────
  const isCash         = systemType === 'cash';
  const isLitres       = unitType   === 'litres';
  const qtyLabel       = isLitres ? 'Litres' : 'Bottles';
  const priceDisabled  = !isCash && !isLitres && !priceUnlocked;
  const showFetchLoader = isFetching && Mode !== 'Add';

  // Block render of data until fetch completes (View mode)
  if (!salesData && !isFetching && Mode !== 'Add') return null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleModeSwitch = () => {
    const next = systemType === 'cash' ? 'account' : 'cash';
    setSystemType(next);
    setUnitType('bottles');
    setVendorType('vendor');
    setPriceUnlocked(false);
    setCustSearch('');
    setCustResults([]);
    setSelectedCust(null);
    setShowDropdown(false);
    setFormState(next === 'cash' ? CASH_DEFAULTS : ACCT_DEFAULTS);
  };

  const formatReadableDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(d);
  };

  const statusBadgeClass = (s) => {
    const v = String(s ?? '').trim().toLowerCase();
    if (v === 'paid')    return styles['badge--success'];
    if (v === 'deleted') return styles['badge--error'];
    return styles['badge--pending'];
  };

  const handleInputChange = (key) => (e) =>
    setFormState((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSelectCustomer = (cust) => {
    setSelectedCust(cust);
    setCustSearch(cust.name);
    setShowDropdown(false);
    setPriceUnlocked(false);
    setFormState((prev) => ({ ...prev, price: !isLitres ? String(cust.unit_price ?? '') : '' }));
  };

  // ── Add submit ─────────────────────────────────────────────────────────────
  const handleAddSubmit = () => {
    // Ref lock — ignore if already in-flight
    if (submitLockRef.current) return;

    const priceValue = Number.parseFloat(formState.price?.trim());
    if (!Number.isFinite(priceValue) || priceValue < 0) { toast.error('Price is required.'); return; }
    const qtyValue = Number.parseFloat(formState.quantity?.trim());
    if (!Number.isFinite(qtyValue) || qtyValue <= 0)   { toast.error('Quantity is required.'); return; }

    let payload = {
      user_id:       appUser,
      sales_status:  (formState.sales_status || (isCash ? 'paid' : 'pending')).trim().toLowerCase(),
      consumer_name: null,
      cust_id:       null,
      sales_type:    null,
      litres:        null,
      bottles:       null,
      price:         null,
    };

    if (isCash) {
      payload.consumer_name = formState.consumer_name?.trim() || null;
      payload.sales_type    = vendorType;
    } else {
      if (!selectedCust) { toast.error('Please select a customer.'); return; }
      payload.cust_id    = selectedCust.cust_id;
      payload.sales_type = 'account';
    }

    if (isLitres) {
      payload.litres = Math.round(qtyValue);
      payload.price  = Math.round(priceValue);
    } else {
      payload.bottles = Math.round(qtyValue);
      if (isCash) {
        payload.price = Math.round(qtyValue * priceValue);
      } else {
        payload.price = priceUnlocked ? Math.round(qtyValue * priceValue) : null;
      }
    }

    // Acquire lock
    submitLockRef.current = true;
    setIsSubmitting(true);

    const postData = async () => {
      try {
        const res = await fetch(`${API_BASE}/sales/add`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });

        if (!res.ok) { toast.error('Server Internal Error.'); return; }

        const data = await res.json();
        if (data.status) {
          toast.success(data.message || 'Sale added.');
          triggerRefresh?.();
          state.current = 'SALES-OPERATIONS';
          handleModeSwitch();
        } else {
          toast.error(data.message || 'Could not add sale.');
        }
      } catch {
        toast.error('Server is not responding, try later.');
      } finally {
        // Always release lock
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    };

    postData();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`${styles['sales-card']} ${Mode === 'Add' ? styles['sales-card--add'] : ''}`}>

      {/* ── Header ── */}
      <div className={styles['sales-card__header']}>
        <i
          className="fa-solid fa-arrow-left"
          onClick={() => { setMode?.('None'); setIsCollapsed(true); }}
          aria-hidden
        />
        <span>{Mode === 'View' ? 'Sales View' : 'Sales Add'}</span>
      </div>

      {/* ── Centered fetch loader (View mode) ── */}
      {showFetchLoader && (
        <div className={styles['sales-card__loader-wrap']}>
          <span className={styles['sales-card__spinner']} />
        </div>
      )}

      {/* ── View body ── */}
      {Mode === 'View' && !showFetchLoader && salesData && (
        <div className={`${styles['info-group']} ${salesData.cust_id == null ? styles['info-group--spacious'] : ''}`}>

          <div className={styles['info-row']}>
            <span className={styles['info-label']}>Sales ID</span>
            <span className={`${styles['badge']} ${styles['badge--id']}`}>{displayValue(salesData.sales_id)}</span>
          </div>

          <div className={styles['info-row']}>
            <span className={styles['info-label']}>Customer Name</span>
            <span className={styles['info-value']}>{displayValue(salesData.customer_name)}</span>
          </div>

          <div className={styles['info-row']}>
            <span className={styles['info-label']}>Sales Type</span>
            <span className={`${styles['badge']} ${styles['badge--unit']}`}>{displayValue(salesData.sales_type)}</span>
          </div>

          {salesData.cust_id != null && (
            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Customer ID</span>
              <span className={`${styles['badge']} ${styles['badge--id']}`}>{displayValue(salesData.cust_id)}</span>
            </div>
          )}

          <div className={styles['info-row']}>
            {salesData.bottles != null ? (
              <><span className={styles['info-label']}>Bottles</span><span className={styles['info-value']}>{displayValue(salesData.bottles)}</span></>
            ) : salesData.litres != null ? (
              <><span className={styles['info-label']}>Litres</span><span className={styles['info-value']}>{displayValue(salesData.litres)}</span></>
            ) : (
              <><span className={styles['info-label']}>Quantity</span><span className={styles['info-value']}>—</span></>
            )}
          </div>

          {salesData.price != null && (
            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Price (Rs)</span>
              <span className={styles['info-value']}>Rs {displayValue(salesData.price)}</span>
            </div>
          )}

          <div className={styles['info-row']}>
            <span className={styles['info-label']}>Sales Status</span>
            <span className={`${styles['badge']} ${styles['badge--pill']} ${statusBadgeClass(salesData.sales_status)}`}>
              {displayValue(salesData.sales_status)}
            </span>
          </div>

          <div className={styles['info-row']}>
            <span className={styles['info-label']}>Created At</span>
            <span className={styles['info-value']}>{formatReadableDate(salesData.created_at)}</span>
          </div>
        </div>
      )}

      {/* ── Add form ── */}
      {Mode === 'Add' && (
        <div className={styles['add-form']}>

          {/* Mode toggle */}
          <div className={styles['form-row']}>
            <span className={styles['form-label']}>Mode</span>
            <div
              className={styles['mode-switch']}
              onClick={handleModeSwitch}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleModeSwitch(); }}
            >
              <span className={`${styles['mode-opt']} ${isCash ? styles['mode-opt--on'] : ''}`}>Cash</span>
              <span className={`${styles['mode-opt']} ${!isCash ? styles['mode-opt--on'] : ''}`}>Account</span>
              <span className={styles['mode-thumb']} style={{ left: isCash ? '2px' : 'calc(50%)' }} />
            </div>
          </div>

          {/* Consumer Name / Customer Search */}
          {isCash ? (
            <div className={styles['form-row']}>
              <label className={styles['form-label']}>Consumer Name</label>
              <div className={styles['input-wrap']}>
                <i className="fa-solid fa-user" />
                <input
                  className={styles['field']}
                  placeholder="Name on receipt"
                  value={formState.consumer_name ?? ''}
                  onChange={(e) => setFormState((p) => ({ ...p, consumer_name: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className={styles['form-row']} ref={searchRef}>
              <label className={styles['form-label']}>Customer</label>
              <div className={styles['input-wrap']}>
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  className={styles['field']}
                  placeholder="Search by name…"
                  value={custSearch}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setSelectedCust(null);
                    setPriceUnlocked(false);
                    setFormState((p) => ({ ...p, price: '' }));
                  }}
                  onFocus={() => custResults.length > 0 && setShowDropdown(true)}
                  onBlur={() => { if (!selectedCust) setCustSearch(''); }}
                  autoComplete="off"
                />
              </div>
              {showDropdown && custResults.length > 0 && (
                <div className={styles['cust-dropdown']}>
                  {custResults.map((c) => (
                    <div
                      key={c.cust_id}
                      className={styles['cust-option']}
                      onMouseDown={() => handleSelectCustomer(c)}
                    >
                      <span className={styles['cust-option__name']}>{c.name}</span>
                      <span className={styles['cust-option__meta']}>Rs {c.unit_price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unit Type */}
          <div className={styles['form-row']}>
            <label className={styles['form-label']}>Unit Type</label>
            <span
              className={`${styles['badge']} ${styles['badge--unit']} ${styles['badge--toggle']}`}
              onClick={() => { setUnitType((p) => (p === 'bottles' ? 'litres' : 'bottles')); setPriceUnlocked(false); }}
              title="Click to switch"
            >
              {isLitres ? 'Litres' : 'Bottles'}
            </span>
          </div>

          {/* Quantity */}
          <div className={styles['form-row']}>
            <label className={styles['form-label']}>{qtyLabel}</label>
            <div className={styles['input-wrap']}>
              <i className={`fa-solid ${isLitres ? 'fa-flask' : 'fa-bottle-water'}`} />
              <input
                className={styles['field']}
                placeholder={`Enter ${qtyLabel}`}
                value={formState.quantity}
                onChange={handleInputChange('quantity')}
              />
            </div>
          </div>

          {/* Price */}
          <div className={styles['form-row']}>
            <label className={styles['form-label']}>
              {isLitres ? 'Price (Rs) — Total' : 'Price (Rs) / Bottle'}
            </label>
            <div className={styles['input-wrap']}>
              <i className="fa-solid fa-rupee-sign" />
              <input
                className={`${styles['field']} ${priceDisabled ? styles['field--disabled'] : ''}`}
                placeholder={priceDisabled ? 'Auto-filled — double-click to edit' : (isLitres ? 'Total price' : 'Per bottle')}
                value={formState.price}
                onChange={priceDisabled ? undefined : handleInputChange('price')}
                readOnly={priceDisabled}
                onDoubleClick={() => { if (!isCash && !isLitres) setPriceUnlocked(true); }}
                title={priceDisabled ? 'Double-click to override' : ''}
              />
            </div>
          </div>

          {/* Sales Via */}
          <div className={styles['form-row']}>
            <label className={styles['form-label']}>Sales Via</label>
            {isCash ? (
              <span
                className={`${styles['badge']} ${vendorType === 'vendor' ? styles['badge--unit'] : styles['badge--cod']} ${styles['badge--toggle']}`}
                onClick={() => setVendorType((p) => (p === 'vendor' ? 'cod' : 'vendor'))}
                title="Click to switch"
              >
                {vendorType === 'vendor' ? 'Vendor' : 'COD'}
              </span>
            ) : (
              <span className={`${styles['badge']} ${styles['badge--unit']}`}>Account</span>
            )}
          </div>

          {/* Sales Status */}
          <div className={styles['form-row']}>
            <label className={styles['form-label']}>Sales Status</label>
            <span
              className={`${styles['badge']} ${styles['badge--pill']} ${
                formState.sales_status === 'paid' ? styles['badge--success'] : styles['badge--pending']
              } ${styles['badge--toggle']}`}
              onClick={() => setFormState((prev) => ({
                ...prev,
                sales_status: prev.sales_status === 'paid' ? 'pending' : 'paid',
              }))}
              title="Click to toggle"
            >
              {formState.sales_status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>

          {/* Submit */}
          <div className={styles['form-row']}>
            <button
              type="button"
              className={`${styles['submit-btn']} ${isSubmitting ? styles['btn--loading'] : ''}`}
              onClick={handleAddSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <span className={styles['sales-card__btn-spinner']} />
                : 'Submit'}
            </button>
          </div>

        </div>
      )}

      {/* ── Footer (View only, hidden during fetch) ── */}
      {Mode === 'View' && !showFetchLoader && salesData && (
        <div className={styles['sales-card__footer']}>
          <span className={styles['footer-by']}>{displayValue(salesData.modified_by)}</span>
          <span className={styles['footer-at']}>on {formatReadableDate(salesData.modified_at)}</span>
        </div>
      )}
    </div>
  );
}

export default SalesDetailsCard;