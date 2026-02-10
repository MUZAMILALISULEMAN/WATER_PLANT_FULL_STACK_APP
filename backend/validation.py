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


