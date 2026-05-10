"""
Wipes ALL customers/sales/bills (keeps users) and seeds a 6-month demo
dataset for the Tulip Water Plant app.

Idempotent — re-runs leave the same fresh state.

Run from backend/:
    venv\\Scripts\\python.exe seed_demo_data.py
"""

from psycopg2 import connect
from database import DB_CONFIG
from datetime import date


# (name, phone, address, unit_price, regular_bottles)
CUSTOMERS = [
    ("ahmad khan",  "03001234567", "lahore main bazaar", 60, 20),
    ("fatima ali",  "03012345678", "karachi defence",    70, 12),
    ("maria khan",  "03023456789", "islamabad f-7",      65,  8),
]

# Account-customer schedule: cust_id -> list of (year, month, [days], bottles_per_sale, bill_state)
# bill_state: True  -> bill row created, status='paid'   (sales also marked paid)
#             False -> bill row created, status='unpaid' (sales stay pending)
#             None  -> no bill row yet (current month, running)
ACCOUNT_SCHEDULE = {
    1: [  # ahmad
        (2025, 12, [4, 11, 18, 25],     5, True),
        (2026,  1, [6, 13, 20, 27],     5, True),
        (2026,  2, [3, 10, 17, 24],     6, True),
        (2026,  3, [5, 12, 19, 26],     5, False),   # outstanding
        (2026,  4, [7, 14, 21, 28],     5, False),   # outstanding
        (2026,  5, [4,  8, 11],         5, None),    # running
    ],
    2: [  # fatima
        (2025, 12, [5, 12, 19],         4, True),
        (2026,  1, [4, 11, 18, 25],     4, True),
        (2026,  2, [6, 13, 20],         4, False),   # outstanding
        (2026,  3, [4, 11, 18, 25],     4, False),   # outstanding
        (2026,  4, [7, 14, 21],         4, True),
        (2026,  5, [3, 10],             4, None),    # running
    ],
    3: [  # maria  (new customer this month — no history)
        (2026,  5, [2,  7, 10],         3, None),
    ],
}

# unit_price per customer (matches CUSTOMERS list)
UNIT_PRICE = {1: 60, 2: 70, 3: 65}

# Walk-in COD sales — generated for each month
COD_PER_MONTH = [
    (2,  10,  700),    # day, bottles, price
    (9,   8,  560),
    (16, 12,  840),
    (23,  6,  420),
]

# Vendor bulk-litre sales — generated for each month
VENDOR_PER_MONTH = [
    (15, 300, 2400),   # day, litres, price
    (28, 200, 1600),
]

MONTHS = [(2025, 12), (2026, 1), (2026, 2), (2026, 3), (2026, 4), (2026, 5)]


def main():
    conn = connect(**DB_CONFIG)
    cur  = conn.cursor()

    triggers_disabled = False
    try:
        # ── 1. WIPE ────────────────────────────────────────────────────────
        print("Wiping...")
        cur.execute("DELETE FROM schema_billings.bills")
        cur.execute("DELETE FROM schema_sales.sales")
        cur.execute("DELETE FROM schema_customers.customers")
        cur.execute("ALTER SEQUENCE schema_customers.customers_cust_id_seq RESTART WITH 1")
        cur.execute("ALTER TABLE   schema_sales.sales    ALTER COLUMN sales_id RESTART WITH 1")
        cur.execute("ALTER TABLE   schema_billings.bills ALTER COLUMN bill_id  RESTART WITH 1")
        print("  cleared bills, sales, customers (sequences reset)")

        # ── 2. CUSTOMERS ───────────────────────────────────────────────────
        print("\nSeeding customers...")
        for name, phone, addr, price, bots in CUSTOMERS:
            cur.execute(
                """
                INSERT INTO schema_customers.customers
                  (name, cell_phone, address, unit_price, is_active,
                   advance_money, modified_by, regular_bottles)
                VALUES (%s, %s, %s, %s, TRUE, 0, 0, %s)
                RETURNING cust_id
                """,
                (name, phone, addr, price, bots),
            )
            cid = cur.fetchone()[0]
            print(f"  cust_id={cid}  {name}  (Rs {price}/bottle, {bots} reg)")

        # ── 3. DISABLE TRIGGERS so we can write past-dated rows w/ explicit billing_locked
        cur.execute("ALTER TABLE schema_sales.sales DISABLE TRIGGER trg_sales_lock_on_insert")
        cur.execute("ALTER TABLE schema_sales.sales DISABLE TRIGGER trg_sales_lock_on_update")
        triggers_disabled = True

        # ── 4. ACCOUNT SALES ───────────────────────────────────────────────
        print("\nSeeding account sales...")
        n_account = 0
        for cust_id, schedule in ACCOUNT_SCHEDULE.items():
            for year, month, days, bots, paid in schedule:
                up = UNIT_PRICE[cust_id]
                # paid bill -> the sales for that month are also paid (with billing_locked=FALSE
                # so they'd reverse if user clicks Mark Unpaid). Otherwise pending.
                status = 'paid' if paid else 'pending'
                for day in days:
                    ts = f"{year:04d}-{month:02d}-{day:02d} 10:30:00"
                    cur.execute(
                        """
                        INSERT INTO schema_sales.sales
                          (consumer_name, cust_id, sales_type, litres, bottles, price,
                           sales_status, billing_locked, modified_by, created_at)
                        VALUES (NULL, %s, 'account', NULL, %s, %s,
                                %s::schema_sales.sales_status, FALSE, 0, %s::timestamp)
                        """,
                        (cust_id, bots, bots * up, status, ts),
                    )
                    n_account += 1
        print(f"  inserted {n_account} account sales")

        # ── 5. COD WALK-INS ────────────────────────────────────────────────
        print("\nSeeding COD walk-ins...")
        n_cod = 0
        for year, month in MONTHS:
            for day, bots, price in COD_PER_MONTH:
                ts = f"{year:04d}-{month:02d}-{day:02d} 14:30:00"
                cur.execute(
                    """
                    INSERT INTO schema_sales.sales
                      (consumer_name, cust_id, sales_type, litres, bottles, price,
                       sales_status, billing_locked, modified_by, created_at)
                    VALUES ('walk-in', NULL, 'cod', NULL, %s, %s,
                            'paid', TRUE, 0, %s::timestamp)
                    """,
                    (bots, price, ts),
                )
                n_cod += 1
        print(f"  inserted {n_cod} cod walk-ins")

        # ── 6. VENDOR BULK SALES ───────────────────────────────────────────
        print("\nSeeding vendor sales...")
        n_vendor = 0
        for year, month in MONTHS:
            for day, lit, price in VENDOR_PER_MONTH:
                ts = f"{year:04d}-{month:02d}-{day:02d} 09:00:00"
                cur.execute(
                    """
                    INSERT INTO schema_sales.sales
                      (consumer_name, cust_id, sales_type, litres, bottles, price,
                       sales_status, billing_locked, modified_by, created_at)
                    VALUES ('vendor co.', NULL, 'vendor', %s, NULL, %s,
                            'paid', TRUE, 0, %s::timestamp)
                    """,
                    (lit, price, ts),
                )
                n_vendor += 1
        print(f"  inserted {n_vendor} vendor sales")

        # ── 7. BILLS (snapshot rows for past months) ───────────────────────
        print("\nSeeding bills...")
        n_bills = 0
        for cust_id, schedule in ACCOUNT_SCHEDULE.items():
            for year, month, days, bots, paid in schedule:
                if paid is None:
                    continue  # current/running month — no bill row
                up     = UNIT_PRICE[cust_id]
                amount = len(days) * bots * up
                last   = days[-1]
                if paid:
                    cur.execute(
                        """
                        INSERT INTO schema_billings.bills
                          (cust_id, bill_month, bill_year, amount, status,
                           generated_at, paid_at, paid_by, modified_by)
                        VALUES (%s, %s, %s, %s, 'paid',
                                make_date(%s, %s, %s)::timestamp,
                                make_date(%s, %s, %s)::timestamp, 0, 0)
                        """,
                        (cust_id, month, year, amount,
                         year, month, last, year, month, last),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO schema_billings.bills
                          (cust_id, bill_month, bill_year, amount, status,
                           generated_at, modified_by)
                        VALUES (%s, %s, %s, %s, 'unpaid',
                                make_date(%s, %s, %s)::timestamp, 0)
                        """,
                        (cust_id, month, year, amount,
                         year, month, last),
                    )
                n_bills += 1
        print(f"  inserted {n_bills} bills")

        conn.commit()

        # ── 8. SUMMARY ─────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print(f"DONE.  today = {date.today()}")
        print("=" * 60)

        for label, q in [
            ("customers", "SELECT count(*) FROM schema_customers.customers"),
            ("sales",     "SELECT count(*) FROM schema_sales.sales"),
            ("bills",     "SELECT count(*) FROM schema_billings.bills"),
        ]:
            cur.execute(q)
            print(f"  {label:<10} {cur.fetchone()[0]}")

        print("\nBills per customer:")
        cur.execute(
            """
            SELECT c.cust_id, c.name,
                   coalesce(string_agg(
                       to_char(make_date(b.bill_year, b.bill_month, 1), 'Mon-YY')
                       || ' ' || b.amount || ' (' || b.status || ')',
                       ', ' ORDER BY b.bill_year, b.bill_month),
                       '(no bills)')
            FROM schema_customers.customers c
            LEFT JOIN schema_billings.bills b ON b.cust_id = c.cust_id
            GROUP BY c.cust_id, c.name
            ORDER BY c.cust_id
            """
        )
        for cid, name, line in cur.fetchall():
            print(f"  [{cid}] {name}: {line}")

        print("\nMay 2026 billing snapshot (what BillingsSection will show):")
        cur.execute("SELECT * FROM schema_billings.get_billing_summary(5, 2026)")
        cols = [d[0][2:] for d in cur.description]
        for r in cur.fetchall():
            print(f"  {dict(zip(cols, r))}")

    finally:
        if triggers_disabled:
            try:
                cur.execute("ALTER TABLE schema_sales.sales ENABLE TRIGGER trg_sales_lock_on_insert")
                cur.execute("ALTER TABLE schema_sales.sales ENABLE TRIGGER trg_sales_lock_on_update")
                conn.commit()
            except Exception:
                pass
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
