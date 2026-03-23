# customer.py
from fastapi import APIRouter
from fastapi import Depends,Body,HTTPException,Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from psycopg2 import Error
from database import GET_DB
from validation import Response,User
from loguru import logger
import json

customersAPI = APIRouter()

@customersAPI.get("/")  
def display_all_customers(cursor = Depends(GET_DB)):
     logger.info("FETCHING ALL CUSTOMERS...")
     cursor.execute("select * from schema_customers.display_all_customers()")
     count = cursor.rowcount
     res = cursor.fetchall()

     if count != 0:
        logger.success("FETCHED ALL CUSTOMERS...")
        return Response(status= True,data = res,message="fetched all customers.")
     logger.success("NO CUSTOMERS TO FETCH...")
     return Response(status= True,message="there is no customer in records.")



@customersAPI.get("/stats")  
def display_all_customers_stats(cursor = Depends(GET_DB)):
     logger.info("FETCHING CUSTOMERS STATS...")
     
     cursor.execute("select * from schema_customers.display_customer_stats()")
     res = cursor.fetchone()

     if res[0]  != 0: #res[0] is total customers count
        logger.success("FETCHED CUSTOMERS STATS...")
        return Response(status= True,data = res,message="fetched all customers stats.")
     logger.success("NO CUSTOMERS SO NO STATS FETCHED...")
     return Response(status= True,message="there is no customer to show stats.")

@customersAPI.get("/filter")
def filter_customers(q: str = None, cursor = Depends(GET_DB)):
        logger.info(f"FETCHING FILTERED CUSTOMERS...")

        query = None
        if q == None or q  == "id-asc":
            query = "select * from schema_customers.customer_filter_by_id_asc()"
           
        elif q  == "name-asc":
            query = "select * from schema_customers.customer_filter_by_name_asc()"
           
        elif q == "name-desc":
            query = "select * from schema_customers.customer_filter_by_name_desc()"
           
        elif q == "active":
            query = "select * from schema_customers.customer_filter_by_active()"
           

        cursor.execute(query)
        count = cursor.rowcount
        res = cursor.fetchall()
        
        if(count) != 0:
            logger.success(f"FETCHED {q} FILTERED CUSTOMERS...")
            return Response(status=True,data= res,message="filtered the customers.")
        logger.success(f"NO CUSTOMERS SO FILTERED CUSTOMERS FETCHED...")
        return Response(status=True,message="there is no customer in records")

@customersAPI.get("/search")
def search_customer(q :str  = "", cursor = Depends(GET_DB)):
     logger.info(f"SEARCHING CUSTOMER {q} ...")
     try:
        cursor.execute("select * from schema_customers.search_customer(%s)",(q,))
        count = cursor.rowcount
        res = cursor.fetchall()

        if(count) != 0:
            logger.success(f"SEARCHED CUSTOMER {q} ...")
            return Response(status=True,data= res,message=f"searched the customers with {q}.")
        logger.success(f"SEARCHED NO CUSTOMER {q} ...")
        return Response(status=True,  message=f"there is no matching customer #{q}")
        
     except Error as e: 
         if e.pgcode == 'P0001':
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False,message=e.diag.message_primary)
         else:
             raise e
         
    

@customersAPI.put("/update/{id}")
def update_customer(id : int ,requestBody: User , cursor = Depends(GET_DB)):

    try:
        requestBody = requestBody.model_dump(exclude_none=True)

        logger.info(f"UPDATING THE CUSTOMER {id} => {requestBody} ..")
        
        cursor.execute("CALL schema_customers.update_customer(%s,%s)",(id,json.dumps(requestBody),))
        logger.success(f"UPDATED THE CUSTOMER {id} ...")
        return Response(status=True,message=f"updated the customer #{id}")
      
    except Error as e:
        if e.pgcode == 'P0001':
             logger.warning(e.diag.message_primary)
             cursor.connection.rollback()   
             return Response(status=False,message=e.diag.message_primary)
        else:
            raise e
        

@customersAPI.post("/add") #proc called
def add_customer(requestBody: User , cursor = Depends(GET_DB)):
    logger.info(f"ADDING THE CUSTOMER {requestBody} ...")
    try:
        cursor.execute("CALL schema_customers.add_customer(%s)",(requestBody.model_dump_json(),))
      
        logger.success(f"ADDED THE CUSTOMER...")
      
        return Response(status=True,message=f"added the customer.")
      
    except Error as e:
        if e.pgcode == 'P0001':
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False,message=e.diag.message_primary)
        else :
             raise e


@customersAPI.get("/{id}")
def display_customer(id: int, cursor = Depends(GET_DB)):
    logger.info(f"GETTING THE CUSTOMER {id} ...")

    try:
    
     cursor.execute(f"select * from schema_customers.display_customer({id})")
     count = cursor.rowcount 
     res = cursor.fetchall()
    
     if count != 0:
        logger.success(f"GOT THE CUSTOMER {id} ...")
        return Response(data = res , status = True,message=f"Found Customer #{id}.")
     logger.success(f"GOT NO CUSTOMER WITH {id} ...")    
     return Response(status=True, message=f'No Customer Found #{id}.')
        
    except Error as e:
        if e.pgcode == 'P0001':
            cursor.connection.rollback()
            logger.warning(e.diag.message_primary)
            return Response(status=False,message=e.diag.message_primary)
        else :
             raise e


if __name__ == "__main__":
    print("customer.py")
    
    