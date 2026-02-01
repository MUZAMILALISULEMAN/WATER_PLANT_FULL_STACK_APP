# customer.py
from fastapi import APIRouter
from fastapi import Depends,HTTPException,Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from psycopg2 import Error
from database import GET_DB
from validation import Response

customersAPI = APIRouter()

@customersAPI.get("/")

def display_all_customers(cursor = Depends(GET_DB)):
     

     cursor.execute("select * from display_all_customers()")
     count = cursor.rowcount
     res = cursor.fetchall()
     if count != 0:
        return Response(status= True,data = res,message="fetched all customers.")
     return Response(status= True,message="there is no customer in records.")

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
        print("TRIED")
        if(count) != 0:
            return Response(status=True,data= res,message=f"searched the customers with {q}.")
        return Response(status=True,  message=f"there is no matching customer with {q}")
        
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
        return Response(data = res , status = True,message=f"Found Customer With ID {id}.")
     
     return Response(status=True, message=f'No Customer Found With ID {id}.')
        
    except Error as e:
        cursor.connection.rollback()
        return Response(status=False,message=e.diag.message_primary)








if __name__ == "__main__":
    print("customer.py")
    
    