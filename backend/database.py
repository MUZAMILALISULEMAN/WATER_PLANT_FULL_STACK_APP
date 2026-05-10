from fastapi import HTTPException
from psycopg2 import connect, OperationalError
from fastapi.exceptions import RequestValidationError
from loguru import logger

DB_CONFIG = {
    "host":     "localhost",
    "port":     "5432",
    "database": "tulip-db",
    "user":     "postgres",
    "password": "newpassword123",
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
        
      
