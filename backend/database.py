from fastapi import HTTPException
from psycopg2 import connect,OperationalError
from fastapi.exceptions import RequestValidationError
from loguru import logger
import os

# DB_CONFIG = {
#    "host": os.getenv("host"),
#     # CHANGE 1: Use Port 6543 for the Pooler (Transaction Mode)
#     "port": os.getenv("port"), 
#     "database": os.getenv("db"), # READ NOTE BELOW
#     # CHANGE 2: The username must match exactly what Supabase provides
#     "user": os.getenv("user"), # CHANGE 2: Use the correct username provided by Supabase
#     "password": os.getenv("pwd") # CHANGE 3: Use the correct password provided by Supabase
# }   
DB_CONFIG = {
    "host": "localhost",
    "port": "5432", 
    "database": "tulip-db",
    "user": "postgres", 
    "password": "&MU77Y1023" 
}   

def GET_DB():
    connection = None
    cursor = None
    try:
            connection = connect(**DB_CONFIG)
            cursor = connection.cursor()
            yield cursor
            connection.commit()

    except OperationalError as e:

        try:
            if connection:
                connection.rollback()
        except:
            pass

        logger.critical(f"DATABASE SERVER IS DEAD AND CONNECTION LOST DURING TRANSCATION... {e}")
        raise HTTPException(status_code=503, detail="Database Server Auth/Connection Failed")
    
    except RequestValidationError as e:
       
        try:
            if connection:
                connection.rollback()
        except:
            pass

        logger.error(f"API REQUEST DATA VALIDATION IS VIOLATED => {e}")
        raise e
    
    except Exception as e:
        
        try:
            if connection:
                connection.rollback()
        except:
            pass

        logger.error(f"LOGIC ERROR OR BACKEND ERROR => {e}")
        raise HTTPException(status_code=500, detail="Server has encountered an error while processing the request")
    
    finally:
    
        if (connection):
            connection.close()
        if cursor: 
            cursor.close()
        
      
