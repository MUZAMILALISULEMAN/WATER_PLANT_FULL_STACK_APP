from passlib.context import CryptContext
from validation import Credentials
from database import GET_DB
from psycopg2 import connect
from loguru import logger
import os
# DB_CONFIG = {
#     "host": "localhost",
#     # CHANGE 1: Use Port 6543 for the Pooler (Transaction Mode)
#     "port": "5432", 
#     "database": "tulip-db", # READ NOTE BELOW
#     # CHANGE 2: The username must match exactly what Supabase provides
#     "user": "postgres", # CHANGE 2: Use the correct username provided by Supabase
#     "password": "muzzy" # CHANGE 3: Use the correct password provided by Supabase
# }   

DB_CONFIG = {
   
    "host": os.getenv("host"),
    # CHANGE 1: Use Port 6543 for the Pooler (Transaction Mode)
    "port": "5432", 
    "database": os.getenv("db"), # READ NOTE BELOW
    # CHANGE 2: The username must match exactly what Supabase provides
    "user": os.getenv("user"), # CHANGE 2: Use the correct username provided by Supabase
    "password": os.getenv("pwd") # CHANGE 3: Use the correct password provided by Supabase
}   
print(DB_CONFIG)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def verify_password(password, hashed_password):
    return pwd_context.verify(password, hashed_password)
def get_password_hash(password):
    return pwd_context.hash(password)

if __name__ == "__main__": 
 print("tulip","tulip1234")
 print("muzzy","muzzy2006")
 print("system","system1234")
 print("system",get_password_hash("system1234"))

def authenticate_user(credientials: Credentials):


    connection = None
    cursor = None
    try:
     connection = connect(**DB_CONFIG)
     cursor = connection.cursor()
     cursor.execute("SELECT user_id, user_name, password, role FROM schema_users.users WHERE user_name = %s", (credientials.username,))
     user = cursor.fetchone()
     logger.info(f"USER AUTHENTICATION ATTEMPT FOR USERNAME => {user}")
     connection.commit()
     if user is None:
        return {"status": False}
     if not verify_password(credientials.password, user[2]):
        return {"status": False}
     return {"status": True, "payload": {"user_id": user[0], "username": user[1], "role": user[3]}}
    
    except Exception as e:
     
     if (connection):
      connection.rollback()
     logger.error(f"ERROR OCCURED DURING USER AUTHENTICATION => {e}")

    finally:
    
     if (connection):
       connection.close()
     if cursor: 
       cursor.close()

   
