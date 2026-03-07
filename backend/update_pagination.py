"""
Скрипт для добавления пагинации в оставшиеся эндпоинты
"""

# Читаем файл
with open('backend/app/routes/admin.py', 'r', encoding='utf-8') as f:
    content = f.read()

# list_news
content = content.replace(
    '''@router.get("/news", response_model=List[NewsOut])
async def list_news(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех новостей (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, title, content, image_url, author_id, published, created_at, updated_at
        FROM news
        ORDER BY created_at DESC, id DESC
        """
    )
    return [NewsOut(**dict(row)) for row in rows]''',
    '''@router.get("/news")
async def list_news(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех новостей с пагинацией (для админки)."""
    offset = (page - 1) * limit
    
    rows = await db.fetch(
        """
        SELECT id, title, content, image_url, author_id, published, created_at, updated_at
        FROM news
        ORDER BY created_at DESC, id DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset
    )
    
    total = await db.fetchval("SELECT COUNT(*) FROM news")
    
    return PaginatedResponse.create(
        items=[NewsOut(**dict(row)) for row in rows],
        total=total,
        page=page,
        limit=limit
    )'''
)

# list_streamers
content = content.replace(
    '''@router.get("/streamers", response_model=List[StreamerOut])
async def list_streamers(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех стримеров (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, name, game, avatar_url, platform, stream_url, schedule, is_active, display_order, created_at, updated_at
        FROM streamers
        ORDER BY display_order ASC, id DESC
        """
    )
    return [StreamerOut(**dict(row)) for row in rows]''',
    '''@router.get("/streamers")
async def list_streamers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех стримеров с пагинацией (для админки)."""
    offset = (page - 1) * limit
    
    rows = await db.fetch(
        """
        SELECT id, name, game, avatar_url, platform, stream_url, schedule, is_active, display_order, created_at, updated_at
        FROM streamers
        ORDER BY display_order ASC, id DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset
    )
    
    total = await db.fetchval("SELECT COUNT(*) FROM streamers")
    
    return PaginatedResponse.create(
        items=[StreamerOut(**dict(row)) for row in rows],
        total=total,
        page=page,
        limit=limit
    )'''
)

# list_merch
content = content.replace(
    '''@router.get("/merch", response_model=List[MerchOut])
async def list_merch(
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех товаров (для админки)."""
    rows = await db.fetch(
        """
        SELECT id, name, description, price, image_url, category, sizes, in_stock, display_order, created_at, updated_at
        FROM merch
        ORDER BY display_order ASC, id DESC
        """
    )
    return [MerchOut(**dict(row)) for row in rows]''',
    '''@router.get("/merch")
async def list_merch(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Список всех товаров с пагинацией (для админки)."""
    offset = (page - 1) * limit
    
    rows = await db.fetch(
        """
        SELECT id, name, description, price, image_url, category, sizes, in_stock, display_order, created_at, updated_at
        FROM merch
        ORDER BY display_order ASC, id DESC
        LIMIT $1 OFFSET $2
        """,
        limit, offset
    )
    
    total = await db.fetchval("SELECT COUNT(*) FROM merch")
    
    return PaginatedResponse.create(
        items=[MerchOut(**dict(row)) for row in rows],
        total=total,
        page=page,
        limit=limit
    )'''
)

# Записываем обратно
with open('backend/app/routes/admin.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Пагинация добавлена в list_news, list_streamers, list_merch")
