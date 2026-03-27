from itertools import count

from fastapi import APIRouter
from fastapi import Depends,Body
from psycopg2 import Error
from database import GET_DB
from validation import Response,DateRange,Sales,Update_Sales,DispatchBatch
from loguru import logger
import json

salesAPI = APIRouter()


@salesAPI.get('/dispatch_customers')
def dispatch_customers(cursor = Depends(GET_DB)):
     logger.info(f"FETCHING CUSTOMERS TO DISPATCH...")

     cursor.execute("select * from utils.dispatch_customers()")
     count  = cursor.rowcount
     res = cursor.fetchall()

     if count != 0:
        logger.success(f"FETCHED CUSTOMERS TO DISPATCH...")
        return Response(status=True,data=res,message=f"GOT THE CUSTOMERS TO DISPATCH...")
     else:
        logger.success(f"NO CUSTOMERS TO DISPATCH...")
        return Response(status=True,message=f"NO CUSTOMERS TO DISPATCH...")


@salesAPI.get('/dispatch_today')
def dispatch_today(cursor = Depends(GET_DB)):
     logger.info(f"FETCHING TODAY'S DISPATCH STATUS...")

     cursor.execute("select * from utils.dispatch_today()")
     res = cursor.fetchone()[0]

     logger.success(f"FETCHED TODAY'S DISPATCH STATUS...")
     logger.info(f"DISPATCH STATUS: {res}")
     return Response( status=  res,message=f"TODAY BATCH IS ALREADY DISPATCHED...")
    

@salesAPI.post('/dispatch')
def dispatch(reqBody : DispatchBatch = Body(), cursor = Depends(GET_DB)):
     logger.info(reqBody.model_dump_json())
     logger.info(f"FETCHING CUSTOMERS TO DISPATCH...")
     JSON = {"dispatched_by": reqBody.dispatched_by}
     jsonStr = json.dumps(JSON)
     
     cursor.execute("call utils.dispatch(%s)",(jsonStr,))

     try:
       for sale in reqBody.sales_list:
          logger.info(f"SALE: {sale.model_dump_json()}")
          cursor.execute("call schema_sales.add_sales(%s)",(sale.model_dump_json(),))
       logger.success(f"DISPATCHED THE CUSTOMERS...")
       return Response(status=True,message=f"DISPATCHED THE CUSTOMERS...")
     except Error as e:
       
        if e.pgcode == 'P0001':
          cursor.connection.rollback()
          logger.warning(e.diag.message_primary)
          return Response(status=False,message=e.diag.message_primary)
        else: 
           raise e   


@salesAPI.post("/add")
def add_sales(Payload:Sales, cursor = Depends(GET_DB)):
    try:
        logger.info(f"ADDING THE SALES")
        cursor.execute("call schema_sales.add_sales(%s)",(Payload.model_dump_json(),))
        logger.success(f"ADDED THE SALES ...")
        return Response(status=True,message="ADDED THE SALES")
    except Error as e:
       
       if e.pgcode == 'P0001':
         cursor.connection.rollback()
         logger.warning(e.diag.message_primary)
         return Response(status=False,message=e.diag.message_primary)
       else: 
          raise e



@salesAPI.get('/flush')
def flush_sales(cursor = Depends(GET_DB)):
    
     logger.info(f"FLUSHING ALL SALES...")

     cursor.execute("delete from schema_sales.sales")
     logger.success(f"FLUSHED ALL SALES...")
     return Response(status=True,message=f"FLUSHED ALL SALES...")
        

@salesAPI.get('/flushCust')
def flush_customers(cursor = Depends(GET_DB)):
  
     logger.info(f"FLUSHING ALL CUSTOMERS...")

     cursor.execute("delete from schema_customers.customers")
     logger.success(f"FLUSHED ALL CUSTOMERS...")
     return Response(status=True,message=f"FLUSHED ALL CUSTOMERS...")



@salesAPI.put("/filter")
def filter_sales(q: str = None, date: DateRange = None, cursor = Depends(GET_DB)):
        logger.info(f"FETCHING FILTERED SALES...")

        query = None
        if q == None or q  == "id-asc":
            query = "select * from schema_sales.sales_filter_by_id_asc(%s)"
           
        elif q  == "price-desc":
            query = "select * from schema_sales.sales_filter_by_price_desc(%s)"
           
           
        elif q == "status":
            query = "select * from schema_sales.sales_filter_by_status(%s)"
         
        logger.info(f"EXECUTING QUERY: {query}")
           

        cursor.execute(query, (date.model_dump_json(),))
        count = cursor.rowcount
        res = cursor.fetchall()
        
        if(count) != 0:
            logger.success(f"FETCHED {q} FILTERED SALES...")
            return Response(status=True,data= res,message="filtered the sales.")
        logger.success(f"NO SALES SO FILTERED SALES FETCHED...")
        return Response(status=True,message="there is no sale in records")



@salesAPI.get("/stats")  
def display_all_sales_stats(cursor = Depends(GET_DB)):
     logger.info("FETCHING SALES STATS...")
     
     cursor.execute("select * from schema_sales.display_sales_stats()")
     res = cursor.fetchone()

     if res[0]  != 0: #res[0] is total customers count
        logger.success("FETCHED SALES STATS...")
        return Response(status= True,data = res,message="fetched all sales stats.")
     logger.success("NO SALES SO NO STATS FETCHED...")
     return Response(status= True,message="there is no sale to show stats.")

@salesAPI.get('/search')
def search_sales( q:str, cursor =     Depends(GET_DB)):

     logger.info(f"SEARCHING SALES: {q}...")

     cursor.execute("select * from schema_sales.search_sales(%s)",(q,))
     count  = cursor.rowcount
     res = cursor.fetchall()

     if count != 0:
        logger.success(f"FETCHED SALES: {q}")
        return Response(status=True,data=res,message=f"GOT THE SALES WITH {q}...")
     else:
        logger.success(f"NO SALES WITH q: {q}")
        return Response(status=True,message=f"NO SALES WITH {q}...")





@salesAPI.get('/search_customer/{q}')
def search_customer( q:str, cursor =     Depends(GET_DB)):

     logger.info(f"SEARCHING CUSTOMER: {q}...")

     cursor.execute("select * from schema_sales.search_customer(%s)",(q,))
     count  = cursor.rowcount
     res = cursor.fetchall()

     if count != 0:
        logger.success(f"FETCHED CUSTOMER: {q}")
        return Response(status=True,data=res,message=f"GOT THE CUSTOMER WITH {q}...")
     else:
        logger.success(f"NO CUSTOMER WITH q: {q}")
        return Response(status=True,message=f"NO CUSTOMER WITH {q}...")





@salesAPI.put("/update")
def update_sales(Payload : Update_Sales, cursor = Depends(GET_DB)):
    try:
        logger.info(f"UPDATING THE SALES STATUS WITH ID: {id}")
        cursor.execute("call schema_sales.update_sales_status(%s)",(Payload.model_dump_json(),))
        logger.success(f"UPDATE THE SALES WITH ID {id} ...")
        return Response(status=True,message=f"UPDATED THE SALES WITH ID {Payload.sales_id}")
    except Error as e:
       
       if e.pgcode == 'P0001':
         cursor.connection.rollback()
         logger.warning(e.diag.message_primary)
         return Response(status=False,message=e.diag.message_primary)
       else: 
          raise e




@salesAPI.post("/add")
def add_sales(Payload:Sales, cursor = Depends(GET_DB)):
    try:
        logger.info(f"ADDING THE SALES")
        cursor.execute("call schema_sales.add_sales(%s)",(Payload.model_dump_json(),))
        logger.success(f"ADDED THE SALES ...")
        return Response(status=True,message="ADDED THE SALES")
    except Error as e:
       
       if e.pgcode == 'P0001':
         cursor.connection.rollback()
         logger.warning(e.diag.message_primary)
         return Response(status=False,message=e.diag.message_primary)
       else: 
          raise e
@salesAPI.put('/all')
def get_all_sales(date_range:DateRange , cursor = Depends(GET_DB)):

    logger.info("GETTING ALL SALES....")
    
    cursor.execute("select * from schema_sales.display_all_sales(%s)",(date_range.model_dump_json(),))
    count = cursor.rowcount
    res = cursor.fetchall()

    if count != 0:
        logger.success("FETCHED ALL SALES...")
        return Response(status=True,data=res,message="fetched all sales.")   
    else:
        logger.success("NO SALES FETCH...")
        return Response(status=True,data=res,message="there is no sales.")



@salesAPI.get('/{id}')
def get_sales( id:int, cursor = Depends(GET_DB)):

    try:
     logger.info(f"GETTING SALES OF ID: {id}...")

     cursor.execute("select * from schema_sales.display_sales(%s)",(id,))
     count  = cursor.rowcount
     res = cursor.fetchall()

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


