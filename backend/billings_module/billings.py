from fastapi import APIRouter, Depends, Body
from psycopg2 import Error
from database import GET_DB
from validation import Response, BillingMark, BillingSendAll
from loguru import logger

billingsAPI = APIRouter()


# ----------------------------------------------------------------------------
# Helpers — strip the f_ prefix PG TABLE-returning functions use.
# ----------------------------------------------------------------------------
def _strip(col: str) -> str:
    return col[2:] if col.startswith("f_") else col


def _row_to_dict(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    cols = [_strip(d[0]) for d in cursor.description]
    return dict(zip(cols, row))


def _rows_to_list(cursor):
    rows = cursor.fetchall()
    cols = [_strip(d[0]) for d in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


# ----------------------------------------------------------------------------
# GET /billings/summary?month=M&year=Y
# ----------------------------------------------------------------------------
@billingsAPI.get("/summary")
def billings_summary(month: int, year: int, cursor=Depends(GET_DB)):
    try:
        logger.info(f"FETCHING BILLING SUMMARY for {month}/{year}...")
        cursor.execute(
            "select * from schema_billings.get_billing_summary(%s, %s)",
            (month, year),
        )
        data = _rows_to_list(cursor)
        logger.success(f"FETCHED {len(data)} BILLING ROWS.")
        return Response(status=True, data=data, message="fetched billing summary.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e


# ----------------------------------------------------------------------------
# GET /billings/customer/{cust_id}?month=M&year=Y
# ----------------------------------------------------------------------------
@billingsAPI.get("/customer/{cust_id}")
def billings_customer(cust_id: int, month: int, year: int, cursor=Depends(GET_DB)):
    try:
        logger.info(f"FETCHING BILL for customer={cust_id} {month}/{year}...")
        cursor.execute(
            "select * from schema_billings.get_customer_bill(%s, %s, %s)",
            (cust_id, month, year),
        )
        data = _row_to_dict(cursor)
        if data is None:
            return Response(status=False, message=f"No bill data for customer {cust_id}.")
        logger.success("FETCHED CUSTOMER BILL.")
        return Response(status=True, data=data, message="fetched customer bill.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e


# ----------------------------------------------------------------------------
# POST /billings/mark_paid    body: {cust_id, month, year, user_id?}
# ----------------------------------------------------------------------------
@billingsAPI.post("/mark_paid")
def billings_mark_paid(payload: BillingMark = Body(), cursor=Depends(GET_DB)):
    try:
        logger.info(f"MARK PAID: cust={payload.cust_id} {payload.month}/{payload.year}")
        cursor.execute(
            "call schema_billings.mark_customer_paid(%s, %s, %s, %s)",
            (payload.cust_id, payload.month, payload.year, payload.user_id or 0),
        )
        logger.success("MARK PAID OK.")
        return Response(status=True, message="Marked as paid.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e


# ----------------------------------------------------------------------------
# POST /billings/mark_unpaid  body: {cust_id, month, year, user_id?}
# ----------------------------------------------------------------------------
@billingsAPI.post("/mark_unpaid")
def billings_mark_unpaid(payload: BillingMark = Body(), cursor=Depends(GET_DB)):
    try:
        logger.info(f"MARK UNPAID: cust={payload.cust_id} {payload.month}/{payload.year}")
        cursor.execute(
            "call schema_billings.mark_customer_unpaid(%s, %s, %s, %s)",
            (payload.cust_id, payload.month, payload.year, payload.user_id or 0),
        )
        logger.success("MARK UNPAID OK.")
        return Response(status=True, message="Marked as unpaid.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e


# ----------------------------------------------------------------------------
# POST /billings/send_all     body: {month, year, user_id?}
# Snapshots a bill row for every customer with pending account sales for
# the given month. Idempotent — re-clicking does nothing on top.
# ----------------------------------------------------------------------------
@billingsAPI.post("/send_all")
def billings_send_all(payload: BillingSendAll = Body(), cursor=Depends(GET_DB)):
    try:
        logger.info(f"SEND BILLS for {payload.month}/{payload.year}")
        cursor.execute(
            "select schema_billings.send_bills_for_month(%s, %s, %s)",
            (payload.month, payload.year, payload.user_id or 0),
        )
        created = cursor.fetchone()[0]
        msg = (f"Generated {created} new bill(s)."
               if created > 0 else
               "All bills for this month were already generated.")
        logger.success(msg)
        return Response(status=True, message=msg)
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e
