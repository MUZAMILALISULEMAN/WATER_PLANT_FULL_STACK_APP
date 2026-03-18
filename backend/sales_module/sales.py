from fastapi import APIRouter
from fastapi import Depends,Body
from psycopg2 import Error
from database import GET_DB
from validation import Response,DateRange,Sales,Update_Sales
from loguru import logger
import json

salesAPI = APIRouter()

@salesAPI.post('/')
def get_all_sales(date_range:DateRange , cursor = Depends(GET_DB)):

    logger.info("GETTING ALL SALES....")
    
    cursor.execute("select * from display_all_sales(%s)",(date_range.model_dump_json(),))
    count = cursor.rowcount
    res = cursor.fetchall()

    if count != 0:
        logger.success("FETCHED ALL SALES...")
        return Response(status=True,data=res,message="fetched all sales.")   
    else:
        logger.success("NO SALES FETCH...")
        return Response(status=True,data=res,message="there is no sales.")


@salesAPI.post('/{id}')
def get_sales( id:int, cursor = Depends(GET_DB)):

    try:
     logger.info(f"GETTING SALES OF ID: {id}...")

     cursor.execute("select * from display_sales(%s)",(id,))
     count  = cursor.rowcount
     res = cursor.fetchone()

     if count != 0:
        logger.success(f"FETCHED SALES WITH ID: {id}")
        return Response(status=True,data=res,message=f"GOT THE SALES WITH ID {id}...")
     else:
        logger.success(f"NO SALES WITH ID: {id}")
        return Response(status=True,message=f"NO SALES WITH ID {id}...")
        

    except Error as e:
       if e.pgcode == 'P0001':
          cursor.connection.rollback()
          logger.warning(e.diag.message_primary)
          return Response(status=False,message=e.diag.message_primary)
       else:
          raise e


@salesAPI.put("/update_sales/")
def update_sales(Payload : Update_Sales, cursor = Depends(GET_DB)):
    try:
        logger.info(f"UPDATING THE SALES STATUS WITH ID: {id}")
        cursor.execute("call update_sales_status(%s)",(Payload.model_dump_json(),))
        logger.success(f"UPDATE THE SALES WITH ID {id} ...")
        return Response(status=True,message=f"UPDATED THE SALES WITH ID {Payload.sales_id}")
    except Error as e:
       
       if e.pgcode == 'P0001':
         cursor.connection.rollback()
         logger.warning(e.diag.message_primary)
         return Response(status=False,message=e.diag.message_primary)
       else: 
          raise e

@salesAPI.put("/add")
def add_sales(Payload:Sales, cursor = Depends(GET_DB)):
    try:
        logger.info(f"ADDING THE SALES")
        cursor.execute("call add_sales(%s)",(Payload.model_dump_json(),))
        logger.success(f"ADDED THE SALES ...")
        return Response(status=True,message="ADDED THE SALES")
    except Error as e:
       
       if e.pgcode == 'P0001':
         cursor.connection.rollback()
         logger.warning(e.diag.message_primary)
         return Response(status=False,message=e.diag.message_primary)
       else: 
          raise e

