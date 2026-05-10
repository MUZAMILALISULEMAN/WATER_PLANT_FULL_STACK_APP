from fastapi import APIRouter, Depends
from psycopg2 import Error
from database import GET_DB
from validation import Response
from loguru import logger

statsAPI = APIRouter()


# ----------------------------------------------------------------------------
# Helpers — turn cursor rows into JSON-friendly dicts.
# PG functions return columns prefixed with f_; strip it for the frontend.
# ----------------------------------------------------------------------------
def _strip(col: str) -> str:
    return col[2:] if col.startswith("f_") else col


def _row_to_dict(cursor):
    """fetchone() -> dict (or None if no row)."""
    row = cursor.fetchone()
    if row is None:
        return None
    cols = [_strip(d[0]) for d in cursor.description]
    return dict(zip(cols, row))


def _rows_to_list(cursor):
    """fetchall() -> list[dict]."""
    rows = cursor.fetchall()
    cols = [_strip(d[0]) for d in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


# ----------------------------------------------------------------------------
# GET /stats/pulse  — single object: revenue split + total bottles + litres
# ----------------------------------------------------------------------------
@statsAPI.get("/pulse")
def stats_pulse(cursor=Depends(GET_DB)):
    try:
        logger.info("FETCHING STATS PULSE...")
        cursor.execute("select * from schema_stats.current_month_pulse()")
        data = _row_to_dict(cursor)
        logger.success("FETCHED STATS PULSE.")
        return Response(status=True, data=data, message="fetched current month pulse.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e


# ----------------------------------------------------------------------------
# GET /stats/vip  — list of top 7 customers this month
# ----------------------------------------------------------------------------
@statsAPI.get("/vip")
def stats_vip(cursor=Depends(GET_DB)):
    try:
        logger.info("FETCHING VIP CUSTOMERS...")
        cursor.execute("select * from schema_stats.vip_customers_current_month()")
        data = _rows_to_list(cursor)
        logger.success(f"FETCHED {len(data)} VIP CUSTOMERS.")
        return Response(status=True, data=data, message="fetched VIP customers.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e


# ----------------------------------------------------------------------------
# GET /stats/trend  — last 6 months, oldest first, revenue split by type
# ----------------------------------------------------------------------------
@statsAPI.get("/trend")
def stats_trend(cursor=Depends(GET_DB)):
    try:
        logger.info("FETCHING 6-MONTH TREND...")
        cursor.execute("select * from schema_stats.sales_trend_6months()")
        data = _rows_to_list(cursor)
        logger.success("FETCHED 6-MONTH TREND.")
        return Response(status=True, data=data, message="fetched 6-month sales trend.")
    except Error as e:
        if e.pgcode == "P0001":
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False, message=e.diag.message_primary)
        raise e
