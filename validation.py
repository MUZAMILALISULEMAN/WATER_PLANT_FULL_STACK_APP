from pydantic import BaseModel
from typing import Optional,Any
from pydantic import AfterValidator
from typing import Annotated


class Response(BaseModel):
    status : bool
    data : Optional[Any] = None
    message : Optional[str] = None



