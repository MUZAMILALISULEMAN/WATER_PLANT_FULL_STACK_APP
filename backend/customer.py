# customer.py
from fastapi import APIRouter
from fastapi import Depends,Body,HTTPException,Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from psycopg2 import Error
from database import GET_DB
from validation import Response,User
import json

customersAPI = APIRouter()

@customersAPI.get("/")  
def display_all_customers(cursor = Depends(GET_DB)):
     
     cursor.execute("select * from display_all_customers()")
     count = cursor.rowcount
     res = cursor.fetchall()
     if count != 0:
        return Response(status= True,data = res,message="fetched all customers.")
     return Response(status= True,message="there is no customer in records.")

@customersAPI.get("/stats")  
def display_all_customers(cursor = Depends(GET_DB)):
     
     cursor.execute("select * from display_customer_stats()")
     res = cursor.fetchone()
     if res[0]  != 0: #res[0] is total customers count
        return Response(status= True,data = res,message="fetched all customers stats.")
     return Response(status= True,message="there is no customer to show stats.")

@customersAPI.get("/filter")
def filter_customers(q: str = None, cursor = Depends(GET_DB)):

        query = None
        if q == None or q  == "id-asc":
            query = "select * from customer_filter_by_id_asc()"
        elif q  == "name-asc":
            query = "select * from customer_filter_by_name_asc()"
        elif q == "name-desc":
            query = "select * from customer_filter_by_name_desc()"
        elif q == "active":
            query = "select * from customer_filter_by_active()"

        cursor.execute(query)
        count = cursor.rowcount
        res = cursor.fetchall()
        
        if(count) != 0:
            return Response(status=True,data= res,message="filtered the customers.")
        return Response(status=True,message="there is no customer in records")

@customersAPI.get("/search")
def search_customer(q :str  = "", cursor = Depends(GET_DB)):
     
     try:
        cursor.execute("select * from search_customer(%s)",(q,))
        count = cursor.rowcount
        res = cursor.fetchall()
        if(count) != 0:
            return Response(status=True,data= res,message=f"searched the customers with {q}.")
        return Response(status=True,  message=f"there is no matching customer #{q}")
        
     except Error as e: 
         cursor.connection.rollback()
         return Response(status=False,message=e.diag.message_primary)
    

@customersAPI.put("/update/{id}")
def update_customer(id : int ,requestBody: User , cursor = Depends(GET_DB)):
    try:
        requestBody = requestBody.model_dump(exclude_none=True)
        cursor.execute("CALL update_customer(%s,%s)",(id,json.dumps(requestBody),))
        return Response(status=True,message=f"updated the customer #{id}")
      
    except Error as e:
        
        print(requestBody)
        cursor.connection.rollback()
        
        return Response(status=False,message=e.diag.message_primary)

@customersAPI.post("/add") #proc called
def add_customer(requestBody: User , cursor = Depends(GET_DB)):
    try:
        cursor.execute("CALL add_customer(%s,%s,%s,%s,%s,%s)",(requestBody.name,requestBody.cell_phone,requestBody.unit_price,requestBody.address,requestBody.is_active,requestBody.advance_money))
        return Response(status=True,message=f"added the customer.")
      
    except Error as e:

        cursor.connection.rollback()
        return Response(status=False,message=e.diag.message_primary)


@customersAPI.get("/{id}")
def display_customer(id: int, cursor = Depends(GET_DB)):


    try:
    
     cursor.execute(f"select * from display_customer({id})")
     count = cursor.rowcount 
     res = cursor.fetchone()
    
     if count != 0:
        return Response(data = res , status = True,message=f"Found Customer #{id}.")    
     return Response(status=True, message=f'No Customer Found #{id}.')
        
    except Error as e:
        cursor.connection.rollback()
        return Response(status=False,message=e.diag.message_primary)


@customersAPI.post("/set_advance/{id}")
def set_advance_money(id: int,advance_money : int = Body(),cursor = Depends(GET_DB)):

    try:
        cursor.execute("CALL set_advance_money(%s,%s)",(id,advance_money))
        return Response(status=True,message=f"Updated the dvance money.")
      
    except Error as e:

        cursor.connection.rollback()
        return Response(status=False,message=e.diag.message_primary)


@customersAPI.post("/activate_customer/{id}")
def activate_customer(id: int,cursor = Depends(GET_DB)):

    try:
        cursor.execute("CALL activate_customer(%s)",(id,))
        return Response(status=True,message=f"activated the customer with id {id}.")
      
    except Error as e:

        cursor.connection.rollback()
        return Response(status=False,message=e.diag.message_primary)
    
@customersAPI.post("/deactivate_customer/{id}")
def activate_customer(id: int,cursor = Depends(GET_DB)):

    try:
        cursor.execute("CALL deactivate_customer(%s)",(id,))
        return Response(status=True,message=f"deactivated the customer with id {id}.")
      
    except Error as e:

        cursor.connection.rollback()
        return Response(status=False,message=e.diag.message_primary)



if __name__ == "__main__":
    print("customer.py")
    
    