"""
Утилиты для пагинации
"""
from typing import TypeVar, Generic, List
from pydantic import BaseModel, Field

T = TypeVar('T')

class PaginationParams(BaseModel):
    """Параметры пагинации"""
    page: int = Field(default=1, ge=1, description="Номер страницы (начиная с 1)")
    limit: int = Field(default=50, ge=1, le=100, description="Количество элементов на странице (макс 100)")
    
    @property
    def offset(self) -> int:
        """Вычислить offset для SQL запроса"""
        return (self.page - 1) * self.limit


class PaginatedResponse(BaseModel, Generic[T]):
    """Ответ с пагинацией"""
    items: List[T]
    total: int = Field(description="Общее количество элементов")
    page: int = Field(description="Текущая страница")
    limit: int = Field(description="Элементов на странице")
    pages: int = Field(description="Всего страниц")
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, limit: int):
        """Создать paginated response"""
        pages = (total + limit - 1) // limit if total > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )
