from pydantic import BaseModel
from typing import Optional,Any


class Response(BaseModel):
    status : bool
    data : Optional[Any] = None
    message : Optional[str] = None

class User(BaseModel):
    name : Optional[str] = None 
    cell_phone :Optional[str] = None
    address : Optional[str] = None
    unit_price : Optional[int] = None
    advance_money : Optional[int] = None
    is_active : Optional[bool] = None
    modified_by : Optional[str] = None

class DateRange(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None   


class Sales(BaseModel):
    consumer_name : Optional[str] = None 
    cust_id :Optional[int] = None
    sales_type : Optional[str] = None
    litres : Optional[int] = None
    bottles : Optional[int] = None
    price : Optional[int] = None
    modified_by : Optional[str] = None
    sales_status : Optional[str] = None
    reporting_time : Optional[str] = None
