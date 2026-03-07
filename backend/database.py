from fastapi import HTTPException
from psycopg2 import connect,OperationalError
from fastapi.exceptions import RequestValidationError
from loguru import logger

DB_CONFIG ={"host":"localhost",       # or "127.0.0.1"
            "port":"5432",            # Default Postgres port
            "database":"RO-PLANT-DB",    # Your database name
            "user":"postgres",        # Your username (default is usually 'postgres')
            "password":"muzzy"} # Your password
        

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
        raise HTTPException(status_code=500, detail="Server Internal Error")
    
    finally:
    
        if (connection):
            connection.close()
        if cursor: 
            cursor.close()
        
      