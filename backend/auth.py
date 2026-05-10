from passlib.context import CryptContext
from validation import Credentials
from database import DB_CONFIG          # single source of truth
from psycopg2 import connect
from loguru import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def verify_password(password, hashed_password):
    return pwd_context.verify(password, hashed_password)
def get_password_hash(password):
    return pwd_context.hash(password)


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

   
