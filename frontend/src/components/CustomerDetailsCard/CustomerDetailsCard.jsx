import React, { useState, useEffect, useRef } from 'react';
import styles from './CustomerDetailsCard.module.css';

function CustomerDetailsCard({ cust_id, appUser, Mode, setMode, toast, triggerRefresh, refresh ,state}) {
  if (Mode === "None") return null;

  const cardRef         = useRef(null);
  const customer_ref    = useRef(null);

  // ── Idempotency locks ──────────────────────────────────────────────────────
  const submitLockRef   = useRef(false);   // blocks double-submit on Edit form
  const addLockRef      = useRef(false);   // blocks double-submit on Add form
  const fetchAbortRef   = useRef(null);    // AbortController for in-flight fetches

  // ── State ──────────────────────────────────────────────────────────────────
  const [customerData,  setCustomerData]  = useState(null);
  const [resetKey,      setResetKey]      = useState(false);
  const [isFetching,    setIsFetching]    = useState(false);   // card-level skeleton
  const [isSubmitting,  setIsSubmitting]  = useState(false);   // edit submit button
  const [isAdding,      setIsAdding]      = useState(false);   // add submit button

  // ── Fetch customer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cust_id <= -1) return;

    // Cancel any previous in-flight request
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const fetchCustomer = async () => {
      setIsFetching(true);
      try {
        const response = await fetch(`http://127.0.0.1:8001/customer/${cust_id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          toast.error("Server Internal Error.");
          return;
        }

        const data = await response.json();
        const rows = data.data;
        const row =
          Array.isArray(rows) && rows.length > 0
            ? Array.isArray(rows[0]) ? rows[0] : rows
            : null;

        const toBool = (v) =>
          v === true || v === 1 || v === '1' ||
          String(v).toLowerCase() === 't'    ||
          String(v).toLowerCase() === 'true' ||
          String(v).toLowerCase() === 'active';

        if (data.status && row && row.length >= 7) {
          setCustomerData({
            id: row[0], name: row[1], cell_phone: row[2],
            address: row[3], unit_price: row[4], advance_money: row[5],
            active: toBool(row[6]), status_changed_at: row[7],
            modified_at: row[8], user_id: row[9],
          });
        } else if (!rows || !rows.length) {
          setCustomerData({
            id: 0, name: "Dummy", cell_phone: "03000000000",
            address: "No Address", unit_price: 0, advance_money: 0,
            active: true, status_changed_at: new Date(),
            modified_at: new Date(), user_id: 0,
          });
        }
      } catch (err) {
        // Ignore abort errors — they are intentional
        if (err.name !== 'AbortError') {
          toast.error("Server is not responding, try later.");
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchCustomer();

    // Cleanup: abort if component unmounts or deps change before fetch completes
    return () => controller.abort();
  }, [cust_id, resetKey, refresh]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatReadableDate = (isoString) => {
    if (!isoString) return "";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(isoString));
  };

  // ── Edit submit ────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    // Ref lock — ignore if a submission is already running
    if (submitLockRef.current) return;
    if (!cardRef.current) return;

    const items = cardRef.current.querySelectorAll(`.${styles['customer-card__value']}`);
    const json  = {};
    const clean = (val) => String(val ?? "").replace(/\s|&nbsp;|\u00A0/g, '').toLowerCase();

    const fields = [
      { index: 1, key: "name",          type: "string" },
      { index: 2, key: "cell_phone",    type: "string" },
      { index: 4, key: "unit_price",    type: "number" },
      { index: 5, key: "advance_money", type: "number" },
    ];

    for (const { index, key, type } of fields) {
      const rawValue = (items[index]?.innerText?.trim()).toLowerCase() ?? "";

      if (type === "number") {
        if (rawValue === "") {
          toast.error(`${key.replace("_", " ")} is empty.`);
          setResetKey(prev => !prev);
          return;
        }
        const parsedNum = parseInt(rawValue);
        if (isNaN(parsedNum)) {
          toast.error(`${key.replace("_", " ")} must be a number.`);
          setResetKey(prev => !prev);
          return;
        }
        if (parsedNum < 0) {
          toast.error(`${key.replace("_", " ")} is negative.`);
          setResetKey(prev => !prev);
          return;
        }
        if (parsedNum !== parseInt(customerData[key])) json[key] = parsedNum;
      } else {
        if (rawValue === "") {
          toast.error(`${key.replace("_", " ")} is empty.`);
          setResetKey(prev => !prev);
          return;
        }
        if (key === "cell_phone" && !/^03\d{9}$/.test(rawValue)) {
          toast.error("Cell phone format is not correct.");
          setResetKey(prev => !prev);
          return;
        }
        if (clean(rawValue) !== clean(customerData[key])) json[key] = rawValue;
      }
    }

    // Active status toggle
    const isActiveStatus = clean(items[6]?.innerText) === 'active';
    if (isActiveStatus !== customerData?.active) json["is_active"] = isActiveStatus;

    if (clean(items[3]?.innerText).toLowerCase() !== clean(customerData?.address || "no address").toLowerCase()) {
      json["address"] = items[3]?.innerText.trim().toLowerCase() || "";
    }

    if (Object.keys(json).length === 0) return;

    json["user_id"] = appUser;

    // Acquire lock
    submitLockRef.current = true;
    setIsSubmitting(true);

    const postData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8001/customer/update/${cust_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });

        if (!res.ok) {
          toast.error("Server Internal Error.");
          setResetKey(prev => !prev);
          return;
        }

        const data = await res.json();
        if (data.status) {
          toast.success(data.message);
          triggerRefresh();
          state.current = "CUSTOMER-OPERATIONS";
          setMode("View");
        } else {
          if (data.message) toast.error(data.message);
          setResetKey(prev => !prev);
        }
      } catch {
        toast.error("Server is not responding, try later.");
      } finally {
        // Always release lock
        submitLockRef.current = false;
        setIsSubmitting(false);
      }
    };

    postData();
  };

  // ── Key handler ────────────────────────────────────────────────────────────
  const handleKeyEnter = (event) => {
    if (Mode === "Edit" && event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  // Show centered spinner while fetching (View / Edit modes only)
  const showFetchLoader = isFetching && Mode !== "Add";

  // Block render until data arrives (after first fetch), unless we're in Add mode
  if (!customerData && !isFetching && Mode !== "Add") return null;

  return (
    <div
      className={`${styles['customer-card']} ${Mode === "Add" ? styles['customer-card--gap-space-xl'] : ""}`}
      key={`${Mode === "Add" ? -1 : customerData?.id}-${resetKey}`}
      ref={cardRef}
    >
      {/* ── Header ── */}
      <div className={styles['customer-card__header']}>
        <i className="fa-solid fa-arrow-left" onClick={() => setMode("None")} />
        <div className={styles['customer-card__title']}>
          {Mode === "View" ? "Customer View" : Mode === "Add" ? "Customer Add" : "Customer Edit"}
        </div>
      </div>

      {/* ── Centered fetch loader (View / Edit) ── */}
      {showFetchLoader && (
        <div className={styles['customer-card__loader-wrap']}>
          <span className={styles['customer-card__spinner']} />
        </div>
      )}

      {/* ── View / Edit body ── */}
      {Mode !== "Add" && !showFetchLoader && customerData && (
        <div className={styles['customer-card__info-group']}>

          {/* ID */}
          <div className={styles['customer-card__info-item']}>
            <div className={styles['customer-card__label']}>Customer ID</div>
            <div className={`${styles['customer-card__value']} ${styles['customer-card__value--id']}`}>
              {customerData.id}
            </div>
          </div>

          {/* Editable fields */}
          {[
            { label: "Customer Name", value: customerData.name },
            { label: "Cell Phone",    value: customerData.cell_phone },
            { label: "Address",       value: (customerData.address === "" ? "no address" : customerData.address) || "no address" },
            { label: "Unit Price",    value: customerData.unit_price },
            { label: "Advance Money", value: customerData.advance_money },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`${styles['customer-card__info-item']} ${Mode === "Edit" ? styles['customer-card__info-item--editing'] : ""}`}
            >
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
              className={`${styles['customer-card__value']} ${styles['customer-card__value--badge']} ${customerData.active ? styles['badge--success'] : styles['badge--error']}`}
              onClick={(e) => {
                if (Mode === "Edit") {
                  const isActive = e.target.innerText === "Active";
                  e.target.innerText = isActive ? "Inactive" : "Active";
                  e.target.className = `${styles['customer-card__value']} ${styles['customer-card__value--badge']} ${isActive ? styles['badge--error'] : styles['badge--success']}`;
                }
              }}
            >
              {customerData.active ? "active" : "inactive"}
            </div>
          </div>

          {/* Status Changed At */}
          <div className={styles['customer-card__info-item']}>
            <div className={styles['customer-card__label']}>Status Changed At</div>
            <div className={styles['customer-card__value']}>{formatReadableDate(customerData.status_changed_at)}</div>
          </div>

          {/* Edit Submit */}
          {Mode === "Edit" && (
            <div className={styles['customer-card__info-item']}>
              <button
                className={`${styles['customer-card__submit-btn']} ${isSubmitting ? styles['btn--loading'] : ""}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <span className={styles['customer-card__btn-spinner']} />
                  : "Submit"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Add form ── */}
      {Mode === "Add" && (
        <div className={styles['customer-card__add-form']} ref={customer_ref}>
          {[
            { label: "Customer Name",  icon: "fa-user",                     placeholder: "Muzamil Bhai" },
            { label: "Cell Phone",     icon: "fa-phone",                    placeholder: "03XXXXXXXXX" },
            { label: "Address",        icon: "fa-location-dot",             placeholder: "ABC-House-123 Shah Town" },
            { label: "Unit Price",     icon: "fa-rupee-sign",               placeholder: "Price",   defaultVal: "60" },
            { label: "Advance Money",  icon: "fa-sharp fa-right-from-line", placeholder: "Advance", defaultVal: "0" },
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
                <i className={`fa-solid ${field.icon}`} />
                <span className={styles['customer-card__validation-msg']} />
              </div>
            </div>
          ))}

          <div className={styles['customer-card__add-item']}>
            <button
              className={`${styles['customer-card__add-submit']} ${isAdding ? styles['btn--loading'] : ""}`}
              disabled={isAdding}
              onClick={(e) => {
                e.preventDefault();

                // Ref lock — ignore if a submission is already running
                if (addLockRef.current) return;

                const inputs = customer_ref.current.querySelectorAll(`.${styles['customer-card__input']}`);
                const requestBody = {
                  name:          inputs[0].value.trim().toLowerCase(),
                  cell_phone:    inputs[1].value.trim(),
                  address:       inputs[2].value.trim().toLowerCase(),
                  unit_price:    inputs[3].value.trim(),
                  advance_money: inputs[4].value.trim(),
                  user_id:       appUser,
                };

                if (requestBody.name === "")                                               return toast.error("Name is empty.");
                if (requestBody.cell_phone === "")                                         return toast.error("Cell phone is empty.");
                if (!/^03\d{9}$/.test(requestBody.cell_phone))                            return toast.error("Cell phone format is not correct.");
                if (requestBody.unit_price === "")                                         return toast.error("Price is empty.");
                if (parseFloat(requestBody.unit_price) < 0)                               return toast.error("Price is negative.");
                if (requestBody.advance_money !== "" && parseFloat(requestBody.advance_money) < 0)
                                                                                           return toast.error("Advance is negative.");

                requestBody.unit_price    = parseInt(requestBody.unit_price);
                requestBody.advance_money = requestBody.advance_money === "" ? 0 : parseInt(requestBody.advance_money);

                // Acquire lock
                addLockRef.current = true;
                setIsAdding(true);

                const postData = async () => {
                  try {
                    let res = await fetch("http://127.0.0.1:8001/customer/add", {
                      method: "POST",
                      body: JSON.stringify(requestBody),
                      headers: { 'Content-Type': 'application/json' },
                    });

                    if (!res.ok) {
                      toast.error("Server Internal Error.");
                      return;
                    }

                    const data = await res.json();
                    if (data.status) {
                      toast.success(data.message);
                      triggerRefresh();
                      state.current = "CUSTOMER-OPERATIONS";
                      setMode("None");
                    } else {
                      toast.error(data.message);
                    }
                  } catch {
                    toast.error("Server is not responding, try later.");
                  } finally {
                    // Always release lock
                    addLockRef.current = false;
                    setIsAdding(false);
                  }
                };

                postData();
              }}
            >
              {isAdding
                ? <span className={styles['customer-card__btn-spinner']} />
                : "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* ── Footer (View only) ── */}
      {Mode === "View" && !showFetchLoader && customerData && (
        <div className={styles['customer-card__footer']}>
          <div className={styles['customer-card__by']}>{customerData.user_id}</div>
          <div className={styles['customer-card__at']}>on {formatReadableDate(customerData.modified_at)}</div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetailsCard;