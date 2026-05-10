import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import styles from './BillingsSection.module.css';
import { toKarachi } from '../../utils/timeUtils.js';

const API_BASE = import.meta.env.VITE_URL;
const fmtRs = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Bill Details Card (sidebar — mirrors SalesDetailsCard) ─────────────────
function BillDetailsCard({ bill, Mode, setMode, onMarkPaid, onMarkUnpaid, onPayMonth, payingKey, isMarking, isMonthClosed }) {
  if (Mode === 'None') return null;

  return (
    <div className={styles['bill-card']}>

      {/* Header — matches sales-card__header */}
      <div className={styles['bill-card__header']}>
        <i className="fa-solid fa-arrow-left" onClick={() => setMode('None')} />
        <span>Bill View</span>
      </div>

      {!bill ? (
        <div className={styles['bill-card__loader-wrap']}>
          <span className={styles['bill-card__spinner']} />
        </div>
      ) : (
        <>
          {/* Info rows — matches info-group */}
          <div className={styles['info-group']}>

            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Customer</span>
              <span className={styles['info-value']}>{bill.name}</span>
            </div>

            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Customer ID</span>
              <span className={`${styles['badge']} ${styles['badge--id']}`}>{bill.cust_id}</span>
            </div>

            <div className={styles['info-row']}>
              <span className={styles['info-label']}>This Month</span>
              <span className={styles['info-value']}>{fmtRs(bill.this_month)}</span>
            </div>

            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Outstanding</span>
              <span className={`${styles['info-value']} ${bill.outstanding > 0 ? styles['info-value--red'] : ''}`}>
                {fmtRs(bill.outstanding)}
              </span>
            </div>

            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Total Due</span>
              <span className={`${styles['info-value']} ${styles['info-value--bold']}`}>
                {fmtRs(bill.total_due)}
              </span>
            </div>

            <div className={styles['info-row']}>
              <span className={styles['info-label']}>Status</span>
              <span className={`${styles['badge']} ${styles['badge--pill']} ${bill.status === 'paid' ? styles['badge--success'] : styles['badge--error']}`}>
                {bill.status}
              </span>
            </div>

          </div>

          {/* Unpaid months breakdown */}
          {bill.unpaid_months?.length > 0 && (
            <>
              <div className={styles['breakdown-title']}>Unpaid Months</div>
              <div className={styles['breakdown-list']}>
                {bill.unpaid_months.map((m, i) => {
                  const key       = `${m.month}-${m.year}`;
                  const isPaying  = payingKey === key;
                  return (
                    <div key={i} className={styles['breakdown-row']}>
                      <span className={styles['breakdown-month']}>{m.label}</span>
                      <span className={styles['breakdown-amt']}>{fmtRs(m.amount)}</span>
                      <button
                        className={styles['breakdown-pay-btn']}
                        title={`Mark ${m.label} as paid`}
                        disabled={isPaying || isMarking}
                        onClick={() => onPayMonth?.(m)}
                      >
                        {isPaying
                          ? <span className={styles['bill-card__btn-spinner']} />
                          : <><i className="fa-solid fa-check" /> Pay</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className={styles['bill-card__btns']}>
            <button
              className={`${styles['submit-btn']} ${isMarking ? styles['btn--loading'] : ''}`}
              onClick={onMarkPaid}
              disabled={isMarking || bill.status === 'paid' || !isMonthClosed}
              title={!isMonthClosed ? 'This month is still running. Payable from the 1st of next month.' : undefined}
            >
              {isMarking
                ? <span className={styles['bill-card__btn-spinner']} />
                : <><i className="fa-solid fa-check" /> Mark Paid</>}
            </button>
            <button
              className={`${styles['undo-btn']} ${isMarking ? styles['btn--loading'] : ''}`}
              onClick={onMarkUnpaid}
              disabled={isMarking || bill.status === 'unpaid'}
            >
              {isMarking
                ? <span className={styles['bill-card__btn-spinner']} />
                : <><i className="fa-solid fa-rotate-left" /> Mark Unpaid</>}
            </button>
          </div>

          {!isMonthClosed && (
            <div className={styles['bill-card__hint']}>
              Current month — billable from the 1st of next month.
            </div>
          )}
        </>
      )}

      {/* Footer — matches sales-card__footer */}
      <div className={styles['bill-card__footer']}>
        {bill?.modified_at ? (
          <>
            <span className={styles['bill-card__by']}>{bill.modified_by || 'system'}</span>
            <span className={styles['bill-card__at']}>on {toKarachi(bill.modified_at)}</span>
          </>
        ) : (
          <span className={styles['footer-meta']}>Account Customers Only</span>
        )}
      </div>

    </div>
  );
}

// ── Billings Table ─────────────────────────────────────────────────────────
function BillingsTable({ data, showLoader, onView, selectedId }) {
  return (
    <div className={styles['billings-table-wrapper']}>
      <table className={styles['billings-table']}>
        <thead className={styles['billings-table__head']}>
          <tr className={styles['billings-table__row']}>
            <th className={styles['billings-table__th']}>Customer</th>
            <th className={styles['billings-table__th']}>ID</th>
            <th className={styles['billings-table__th']}>This Month</th>
            <th className={styles['billings-table__th']}>Outstanding</th>
            <th className={styles['billings-table__th']}>Total Due</th>
            <th className={styles['billings-table__th']}>Status</th>
            <th className={styles['billings-table__th']}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {showLoader ? (
            <tr className={styles['billings-table__loader-row']}>
              <td colSpan="7">
                <div className={styles['loader-wrap']}>
                  <span className={styles['billings-spinner']} />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles['billings-table__empty']}>
                No billing data for this period.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.cust_id}
                className={`${styles['billings-table__row']} ${selectedId === row.cust_id ? styles['billings-table__row--selected'] : ''}`}
              >
                <td className={`${styles['billings-table__td']} ${styles['billings-table__td--name']}`}>
                  {row.name}
                </td>
                <td className={styles['billings-table__td']}>{row.cust_id}</td>
                <td className={styles['billings-table__td']}>{fmtRs(row.this_month)}</td>
                <td className={styles['billings-table__td']}>
                  <span className={row.outstanding > 0 ? styles['amount--overdue'] : ''}>
                    {fmtRs(row.outstanding)}
                  </span>
                </td>
                <td className={styles['billings-table__td']}>
                  <span className={styles['amount--total']}>{fmtRs(row.total_due)}</span>
                </td>
                <td className={styles['billings-table__td']}>
                  <span className={`${styles['badge']} ${styles['badge--pill']} ${row.status === 'paid' ? styles['badge--success'] : styles['badge--error']}`}>
                    {row.status}
                  </span>
                </td>
                <td className={styles['billings-table__td']}>
                  <button
                    className={styles['btn-view']}
                    onClick={() => onView(row)}
                  >
                    <i className="fa-regular fa-expand" /> View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function BillingsSection({ isVisible, toast, externalRefresh, onBillingUpdated }) {
  const now = new Date();
  const [period,       setPeriod]       = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [search,       setSearch]       = useState('');
  const [data,         setData]         = useState([]);
  const [showLoader,   setShowLoader]   = useState(false);
  const [Mode,         setMode]         = useState('None');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isMarking,    setIsMarking]    = useState(false);
  const [payingKey,    setPayingKey]    = useState(null);   // `${month}-${year}` of row being paid
  const searchRef = useRef(null);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ── Fetch summary ──
  const fetchBillings = useCallback(async () => {
    setShowLoader(true);
    try {
      const res  = await fetch(`${API_BASE}/billings/summary?month=${period.month}&year=${period.year}`);
      const DATA = await res.json();
      if (DATA.status) setData(DATA.data || []);
      else toast.error(DATA.message || 'Failed to load billings.');
    } catch {
      toast.error('Network issue — try later.');
    } finally {
      setShowLoader(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isVisible) return;
    fetchBillings();
  }, [isVisible, period, externalRefresh, fetchBillings]);

  // ── View bill ──
  const handleView = useCallback(async (row) => {
    setMode('View');
    setSelectedBill(null);
    try {
      const res  = await fetch(`${API_BASE}/billings/customer/${row.cust_id}?month=${period.month}&year=${period.year}`);
      const DATA = await res.json();
      if (DATA.status) setSelectedBill(DATA.data);
      else toast.error(DATA.message || 'Failed to load bill.');
    } catch {
      toast.error('Network issue — try later.');
    }
  }, [period]);

  // ── Mark paid ──
  const handleMarkPaid = async () => {
    if (isMarking || !selectedBill) return;
    setIsMarking(true);
    try {
      const res  = await fetch(`${API_BASE}/billings/mark_paid`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cust_id: selectedBill.cust_id, month: period.month, year: period.year }),
      });
      const DATA = await res.json();
      if (DATA.status) {
        toast.success(DATA.message || 'Marked as paid.');
        fetchBillings();
        handleView({ cust_id: selectedBill.cust_id });
        onBillingUpdated?.();   // notify App -> Sales + Stats refetch
      } else {
        toast.error(DATA.message || 'Failed.');
      }
    } catch {
      toast.error('Network issue — try later.');
    } finally {
      setIsMarking(false);
    }
  };

  // ── Mark unpaid ──
  const handleMarkUnpaid = async () => {
    if (isMarking || !selectedBill) return;
    setIsMarking(true);
    try {
      const res  = await fetch(`${API_BASE}/billings/mark_unpaid`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cust_id: selectedBill.cust_id, month: period.month, year: period.year }),
      });
      const DATA = await res.json();
      if (DATA.status) {
        toast.success(DATA.message || 'Marked as unpaid.');
        fetchBillings();
        handleView({ cust_id: selectedBill.cust_id });
        onBillingUpdated?.();   // notify App -> Sales + Stats refetch
      } else {
        toast.error(DATA.message || 'Failed.');
      }
    } catch {
      toast.error('Network issue — try later.');
    } finally {
      setIsMarking(false);
    }
  };

  // ── Pay a specific month from the breakdown row ──
  const handlePayMonth = async (m) => {
    if (!selectedBill || payingKey) return;
    const key = `${m.month}-${m.year}`;
    setPayingKey(key);
    try {
      const res  = await fetch(`${API_BASE}/billings/mark_paid`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cust_id: selectedBill.cust_id, month: m.month, year: m.year }),
      });
      const DATA = await res.json();
      if (DATA.status) {
        toast.success(DATA.message || `Marked ${m.label} as paid.`);
        fetchBillings();
        handleView({ cust_id: selectedBill.cust_id });
        onBillingUpdated?.();   // notify App -> Sales + Stats refetch
      } else {
        toast.error(DATA.message || 'Failed.');
      }
    } catch {
      toast.error('Network issue — try later.');
    } finally {
      setPayingKey(null);
    }
  };

  // ── Is the viewed month CLOSED? ──
  // A month becomes payable starting on the FIRST DAY OF THE NEXT MONTH.
  // period.month is 1-12; new Date(year, period.month, 1) gives the 1st of the next month
  // (JS months are 0-indexed, so passing period.month=5 yields June 1 for May).
  const isMonthClosed = new Date() >= new Date(period.year, period.month, 1);

  // ── Filtered data ──
  const filtered = data.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Summary stats ──
  const totalDue    = data.reduce((s, r) => s + (r.total_due || 0), 0);
  const unpaidCount = data.filter(r => r.status === 'unpaid').length;
  const paidCount   = data.filter(r => r.status === 'paid').length;

  // ── Layout — collapses sidebar when Mode is None (mirrors CustomerSection) ──
  const layoutClass = Mode === 'None'
    ? `${styles['billings-section']} ${styles['billings-section--collapsed']}`
    : styles['billings-section'];

  const visClass = isVisible ? styles['display-grid'] : styles['display-none'];

  return (
    <div className={`${layoutClass} ${visClass}`}>

      {/* ── SIDEBAR ── */}
      <aside className={styles['billings-section__sidebar']}>
        <BillDetailsCard
          bill={selectedBill}
          Mode={Mode}
          setMode={setMode}
          onMarkPaid={handleMarkPaid}
          onMarkUnpaid={handleMarkUnpaid}
          onPayMonth={handlePayMonth}
          payingKey={payingKey}
          isMarking={isMarking}
          isMonthClosed={isMonthClosed}
        />
      </aside>

      {/* ── MAIN ── */}
      <main className={styles['billings-section__main']}>

        {/* Header — mirrors sales-manager__header */}
        <header className={styles['billings-manager__header']}>
          <div className={styles['billings-manager__title-container']}>
            <h4 className={styles['billings-manager__title']}>Billings</h4>
          </div>

          <div className={styles['billings-manager__controls']}>
            {/* Stats count */}
            <div className={styles['billings-manager__stats']}>
              <i className="fa-regular fa-folder"></i>
              <span className={styles['billings-manager__count']}>{filtered.length}</span>
            </div>

            {/* Month/Year picker */}
            <div className={styles['period-picker']}>
              <i className="fa-solid fa-calendar-days" />
              <select
                className={styles['period-picker__select']}
                value={period.month}
                onChange={e => setPeriod(p => ({ ...p, month: Number(e.target.value) }))}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                className={styles['period-picker__select']}
                value={period.year}
                onChange={e => setPeriod(p => ({ ...p, year: Number(e.target.value) }))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className={styles['billings-manager__actions-bar']}>
              {/* Search */}
              <div className={styles['billings-manager__search-wrapper']}>
               
                <input
                  className={styles['billings-manager__search-input']}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  ref={searchRef}
                />
                 <i className={`fa-solid fa-magnifying-glass ${styles['billings-manager__search-icon']}`} />
              </div>
            </div>
          </div>
        </header>

        {/* Stats bar */}
        <div className={styles['stats-bar']}>
          <div className={styles['stats-bar__pill']}>
            <strong>{MONTHS[period.month - 1]} {period.year}</strong>
          </div>
          <div className={styles['stats-bar__pill']}>
            <strong>{data.length}</strong> customers
          </div>
          <div className={styles['stats-bar__pill']}>
            <strong className={styles['text-error']}>{unpaidCount}</strong> unpaid
          </div>
          <div className={styles['stats-bar__pill']}>
            <strong className={styles['text-success']}>{paidCount}</strong> paid
          </div>
          
        </div>

        {/* Table */}
        <BillingsTable
          data={filtered}
          showLoader={showLoader}
          onView={handleView}
          selectedId={selectedBill?.cust_id}
        />

        {/* Footer */}
        <div className={styles['billings-manager__footer']}>
          <span className={styles['footer-meta']}>Account Customers · {MONTHS[period.month - 1]} {period.year}</span>
          <span className={styles['footer-total']}>Grand Total Due: <strong>{fmtRs(totalDue)}</strong></span>
        </div>

      </main>
    </div>
  );
}

export default BillingsSection;