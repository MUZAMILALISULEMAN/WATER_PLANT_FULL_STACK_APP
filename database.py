from fastapi import HTTPException
from psycopg2 import connect,OperationalError
from fastapi.exceptions import RequestValidationError

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
            print("CONNECTION ESTABLISHED...")
            yield cursor
            connection.commit()

    except OperationalError as e:
        if connection:
            connection.rollback()
        raise HTTPException(status_code=503, detail="Database Server Auth/Connection Failed")
    
    except RequestValidationError as e:
        if connection:
            connection.rollback()
        raise e

    
    # except Exception as e:
    #     if connection:
    #         connection.rollback()
    #     raise HTTPException(status_code=500, detail="Server Internal Error")
    
    finally:
    
        if (connection):
            connection.close()
        if cursor: 
            cursor.close()
        
        print("PostgreSQL CONNECTION CLOSED...")