import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import styles from './DailyDispatchSection.module.css';
import { toKarachiDate } from '../../utils/timeUtils';

// ── Sub-component: individual row ──────────────────────────────────────────
const DispatchRow = memo(({
  row, index, onBottlesChange, onPriceChange, onToggleStatus, onToggleAdd, onBottlesBlur, onPriceBlur, locked
}) => {
  const total = (Number(row.bottles) || 0) * (Number(row.price) || 0);

  return (
    <tr className={`${styles['dispatch-table__row']} ${row.added ? styles['dispatch-table__row--added'] : ''}`}>

      <td className={styles['dispatch-table__cell']}>
        <span className={styles['row-num']}>{index + 1}</span>
      </td>

      <td className={styles['dispatch-table__cell']}>
        <span className={styles['cust-name']}>{row.name}</span>
      </td>

      <td className={styles['dispatch-table__cell']}>
        <div className={styles['input-wrap']}>
          <i className="fa-solid fa-bottle-water"></i>
          <input
            className={`${styles['field']} ${row.bottles !== row.defBottles ? styles['field--changed'] : ''}`}
            type="number"
            min="0"
            value={row.bottles}
            onFocus={(e) => e.target.select()}
            onChange={e => onBottlesChange(index, e.target.value)}
            onBlur={() => onBottlesBlur(index)}
            disabled={!row.added || locked}
          />
        </div>
      </td>

      <td className={styles['dispatch-table__cell']}>
        <div className={styles['input-wrap']}>
          <i className="fa-solid fa-rupee-sign" style={{ fontSize: '10px' }}></i>
          <input
            className={`${styles['field']} ${row.price !== row.defPrice ? styles['field--changed'] : ''}`}
            type="number"
            min="0"
            step="10"
            value={row.price}
            onFocus={(e) => e.target.select()}
            onChange={e => onPriceChange(index, e.target.value)}
            onBlur={() => onPriceBlur(index)}
            disabled={!row.added || locked}
          />
        </div>
      </td>

      <td className={styles['dispatch-table__cell']}>
        <span className={styles['total-val']}>
          {row.added ? `Rs ${total.toLocaleString()}` : '—'}
        </span>
      </td>

      <td className={`${styles['dispatch-table__cell']} ${styles['dispatch-table__cell--center']}`}>
        <span
          className={`${styles['badge']} ${styles['badge--pill']} ${styles['badge--toggle']} ${row.status === 'paid' ? styles['badge--success'] : styles['badge--pending']}`}
          onClick={() => !locked && row.added && onToggleStatus(index)}
          style={{ pointerEvents: (!locked && row.added) ? 'auto' : 'none', opacity: row.added ? 1 : 0.3 }}
        >
          {row.status}
        </span>
      </td>

      <td className={`${styles['dispatch-table__cell']} ${styles['dispatch-table__cell--center']}`}>
        <button
          className={`${styles['tick-btn']} ${row.added ? styles['tick-btn--on'] : ''}`}
          onClick={() => !locked && onToggleAdd(index)}
          disabled={locked}
          title={row.added ? 'Remove from dispatch' : 'Add to dispatch'}
        >
          <i className="fa-solid fa-check"></i>
        </button>
      </td>

    </tr>
  );
});

// ── Lock overlay ────────────────────────────────────────────────────────────
function LockOverlay({ message }) {
  return (
    <div className={styles['lock-overlay']}>
      <div className={styles['lock-overlay__box']}>
        <i className="fa-solid fa-lock-keyhole"></i>
        <span className={styles['lock-overlay__title']}>Dispatch Locked</span>
        <span className={styles['lock-overlay__msg']}>{message || "Today's dispatch has already been submitted."}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
// onDispatchSubmitted — called after successful submit, tells App to refresh Sales + Customers
function DailyDispatchSection({ toast, appUser, isVisible, onDispatchSubmitted }) {
  const [rows,         setRows]         = useState([]);
  const [fetchLoader,  setFetchLoader]  = useState(false);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [locked,       setLocked]       = useState(true);
  const [lockMessage,  setLockMessage]  = useState('');

  // ── Derived stats ──
  const addedRows     = rows.filter(r => r.added);
  const pendingCount  = addedRows.filter(r => r.status === 'pending').length;
  const paidCount     = addedRows.filter(r => r.status === 'paid').length;
  const notAddedCount = rows.length - addedRows.length;
  const totalBottles  = addedRows.reduce((s, r) => s + (Number(r.bottles) || 0), 0);
  const grandTotal    = addedRows.reduce((s, r) => s + ((Number(r.bottles) || 0) * (Number(r.price) || 0)), 0);

  // ── Fetch customers ──
  const fetchCustomers = useCallback(async () => {
    try {
      setFetchLoader(true);
      const res  = await fetch('http://127.0.0.1:8001/sales/dispatch_customers');
      const DATA = await res.json();
      if (DATA.status) {
        setRows((DATA.data || []).map(c => ({
          id:         c[0],
          name:       c[1],
          bottles:    c[2],
          price:      c[3],
          defBottles: c[2],
          defPrice:   c[3],
          status:     'pending',
          added:      false,
        })));
      } else {
        toast.error(DATA.message || 'Failed to load customers.');
      }
    } catch {
      toast.error('Network issue — try later.');
    } finally {
      setFetchLoader(false);
    }
  }, []);

  // ── Init: lock check then conditionally fetch ──
  useEffect(() => {
    if (!isVisible) return;

    const init = async () => {
      setLocked(true);
      try {
        const res  = await fetch('http://127.0.0.1:8001/sales/dispatch_today');
        if (!res.ok) throw new Error('Network response was not ok');
        const DATA = await res.json();
        if (DATA.status) {
          setLockMessage(DATA.message);
          return; // stay locked, skip customer fetch
        }
        setLocked(false);
        fetchCustomers();
      } catch (error) {
        console.log(error);
        toast.error('Could not verify dispatch status.');
        setLocked(true);
        setLockMessage('Unable to verify dispatch status. Please try again later.');
      }
    };

    init();
  }, [isVisible]);

  // ── Handlers ──
  const handleBottles      = useCallback((i, v) => { const val = v === '' ? '' : Number(v); setRows(prev => prev.map((r, idx) => idx === i ? { ...r, bottles: val } : r)); }, []);
  const handlePrice        = useCallback((i, v) => { const val = v === '' ? '' : Number(v); setRows(prev => prev.map((r, idx) => idx === i ? { ...r, price:   val } : r)); }, []);
  const handleBottlesBlur  = useCallback((i)    => setRows(prev => prev.map((r, idx) => (idx === i && r.bottles === '') ? { ...r, bottles: 0 } : r)), []);
  const handlePriceBlur    = useCallback((i)    => setRows(prev => prev.map((r, idx) => (idx === i && r.price   === '') ? { ...r, price:   0 } : r)), []);
  const handleToggleStatus = useCallback((i)    => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: r.status === 'paid' ? 'pending' : 'paid' } : r)), []);
  const handleToggleAdd    = useCallback((i)    => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, added: !r.added } : r)), []);
  const handleReset        = useCallback(()     => fetchCustomers(), [fetchCustomers]);

  // ── Submit ──
  const handleSubmit = async () => {
    const requestBody = addedRows.map(row => ({
      user_id:      appUser,
      cust_id:      row.id,
      bottles:      Number(row.bottles) || 0,
      price:        (Number(row.bottles) || 0) * (Number(row.price) || 0),
      sales_status: row.status,
      sales_type:   'account',
    }));

    if (requestBody.length === 0) { toast.info('No rows added.'); return; }

    const payload = { sales_list: requestBody, dispatched_by: `${appUser}` };

    try {
      setSubmitLoader(true);
      const response = await fetch('http://127.0.0.1:8001/sales/dispatch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.status) {
        toast.success('Dispatch submitted successfully!');
        setLocked(true);
        setLockMessage("Today's dispatch has been submitted.");
        onDispatchSubmitted?.(); // ← notify App → refresh Sales + Customers
      } else {
        toast.error(result.message || 'Submission failed.');
      }
    } catch (error) {
      console.log(error);
      toast.error('Network error during submission.');
    } finally {
      setSubmitLoader(false);
    }
  };

  const today    = toKarachiDate(new Date());
  const visClass = isVisible ? styles['display-block'] : styles['display-none'];

  return (
    <div className={`${styles['dispatch-section']} ${visClass}`}>

      {/* ── HEADER ── */}
      <div className={styles['dispatch-card__header']}>
        <div>
          <span className={styles['dispatch-card__title']}>Daily Dispatch Sheet</span>
          <span className={styles['dispatch-card__date']}>{today}</span>
        </div>
        <div className={styles['dispatch-card__header-actions']}>
          <button className={styles['btn-reset']} onClick={handleReset} disabled={fetchLoader || submitLoader || locked}>
            <i className={`fa-solid fa-rotate-left ${fetchLoader ? styles['icon-spin'] : ''}`}></i>
            {fetchLoader ? 'Loading...' : 'Reset'}
          </button>
          <button
            className={styles['submit-btn']}
            disabled={addedRows.length === 0 || submitLoader || fetchLoader || locked}
            onClick={handleSubmit}
          >
            {submitLoader
              ? <><span className={styles['spinner-2']} /> Submitting...</>
              : <><i className="fa-solid fa-paper-plane"></i> Submit All</>
            }
          </button>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className={styles['stats-bar']}>
        <div className={styles['stats-bar__pill']}><strong>{addedRows.length}</strong> Added</div>
        <div className={styles['stats-bar__pill']}><strong>{totalBottles}</strong> Bottles</div>
        <div className={styles['stats-bar__pill']}><strong>{notAddedCount}</strong> Remaining</div>
        <div className={styles['stats-bar__pill']}><strong>{pendingCount}</strong> Pending</div>
        <div className={styles['stats-bar__pill']}><strong>{paidCount}</strong> Paid</div>
      </div>

      {/* ── TABLE ── */}
      <div className={styles['dispatch-table-wrapper']}>
        {locked && <LockOverlay message={lockMessage} />}
        <table className={styles['dispatch-table']}>
          <thead className={styles['dispatch-table__head']}>
            <tr className={styles['dispatch-table__row']}>
              <th className={styles['dispatch-table__header']}>#</th>
              <th className={styles['dispatch-table__header']}>Customer</th>
              <th className={styles['dispatch-table__header']}>Bottles</th>
              <th className={styles['dispatch-table__header']}>Price</th>
              <th className={styles['dispatch-table__header']}>Total</th>
              <th className={`${styles['dispatch-table__header']} ${styles['dispatch-table__header--center']}`}>Status</th>
              <th className={`${styles['dispatch-table__header']} ${styles['dispatch-table__header--center']}`}>Added</th>
            </tr>
          </thead>
          <tbody className={styles['dispatch-table__body']}>
            {fetchLoader && rows.length === 0 ? (
              <tr className={styles['dispatch-table__loader-row']}>
                <td colSpan="7">
                  <div className={styles['loader-wrap']}><span className={styles['spinner']} /></div>
                </td>
              </tr>
            ) : rows.length === 0 && !locked ? (
              <tr>
                <td colSpan="7" className={styles['dispatch-table__empty']}>No regular customers found.</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <DispatchRow
                  key={row.id}
                  row={row}
                  index={i}
                  onBottlesChange={handleBottles}
                  onPriceChange={handlePrice}
                  onBottlesBlur={handleBottlesBlur}
                  onPriceBlur={handlePriceBlur}
                  onToggleStatus={handleToggleStatus}
                  onToggleAdd={handleToggleAdd}
                  locked={locked}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div className={styles['dispatch-card__footer']}>
        <span className={styles['footer-meta']}>Mode — Account &nbsp;·&nbsp; Regular Customers</span>
        <span className={styles['footer-total']}>
          Grand Total: <strong>Rs {grandTotal.toLocaleString()}</strong>
        </span>
      </div>

    </div>
  );
}

export default DailyDispatchSection;