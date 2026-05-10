"""
One-time seed for schema_users.users.

Hashes each password with the SAME bcrypt context auth.py uses to verify
logins, then INSERTs them.

ID assignment:
  - system  -> user_id = 0 (matches the add_customer / add_sales fallback
               default of coalesce(user_id, '0')::int — so any unattributed
               write resolves to the system account instead of failing FK)
  - tulip   -> user_id = 1 (assigned by serial sequence)
  - muzzy   -> user_id = 2 (assigned by serial sequence)

Idempotent: ON CONFLICT (user_name) DO NOTHING — re-running won't duplicate.

Run once after creating the DB:
    cd backend
    venv\\Scripts\\python.exe seed_users.py
"""

from psycopg2 import connect
from auth import get_password_hash, DB_CONFIG

# Order matters: system is inserted first with explicit id=0 so the serial
# sequence isn't disturbed; the next two then receive 1 and 2.
SYSTEM_USER = ("system", "system1234", "admin")
SEED = [
    ("tulip", "tulip1234", "admin"),
    ("muzzy", "muzzy2006", "admin"),
]


def main():
    conn = connect(**DB_CONFIG)
    cur = conn.cursor()
    try:
        # 1. system at id = 0 (explicit override of the serial default)
        username, password, role = SYSTEM_USER
        cur.execute(
            """
            INSERT INTO schema_users.users (user_id, user_name, password, role)
            VALUES (0, %s, %s, %s)
            ON CONFLICT (user_name) DO NOTHING
            RETURNING user_id
            """,
            (username, get_password_hash(password), role),
        )
        row = cur.fetchone()
        if row:
            print(f"  inserted: {username:<8}  user_id={row[0]}  role={role}")
        else:
            print(f"  skipped : {username:<8}  (already exists)")

        # 2. remaining users — let the serial sequence assign ids
        for username, password, role in SEED:
            cur.execute(
                """
                INSERT INTO schema_users.users (user_name, password, role)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_name) DO NOTHING
                RETURNING user_id
                """,
                (username, get_password_hash(password), role),
            )
            row = cur.fetchone()
            if row:
                print(f"  inserted: {username:<8}  user_id={row[0]}  role={role}")
            else:
                print(f"  skipped : {username:<8}  (already exists)")

        conn.commit()
        print("\nDone. Users are ready for login.")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
