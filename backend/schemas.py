from typing import List
from pydantic import BaseModel


class TrendItem(BaseModel):
    id: str
    source: str
    title: str
    url: str
    score: int
    comments: int
    category: str
    timestamp: str


class TrendsResponse(BaseModel):
    items: List[TrendItem]
    fetched_at: str
