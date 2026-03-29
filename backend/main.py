from fastapi import FastAPI,Response
from customer_module.customer import customersAPI
from fastapi import HTTPException,Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from logger_config import setup_logger
from sales_module.sales import salesAPI
from validation import Credentials, Response as ValidationResponse
from auth import authenticate_user

setup_logger()

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail
            }
        },
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "INVALID DATA.",
            }
        },
    )


@app.post("/login")
def login(payload : Credentials):
    authPayload = authenticate_user(payload); 
    if authPayload != None and authPayload["status"]  :
        return ValidationResponse(status=True,data=authPayload["payload"]["user_id"],message="Login successful")
    return ValidationResponse(status=False,message="Invalid credentials")
        
    
app.include_router(customersAPI,prefix="/customer",tags=["CUSTOMER MANAGMENT"])
app.include_router(salesAPI,prefix="/sales",tags=["SALES MANAGMENT"])
