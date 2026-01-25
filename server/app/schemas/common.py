from pydantic import BaseModel, Field
from typing import Optional, TypeVar, Generic

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool = Field(..., description="Indicates if the API call was successful")
    data: Optional[T] = Field(None, description="The data returned by the API call")
    message: Optional[str] = Field(None, description="A message providing additional information about the API call")
    token: Optional[str] = Field(None, description="Authentication token if applicable")


