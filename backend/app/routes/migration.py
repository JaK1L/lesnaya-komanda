"""
Temporary endpoint for applying database migrations
This endpoint should be removed after migrations are applied
"""
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..auth import get_current_admin_user
import asyncpg
import logging
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/admin/apply-migration")
async def apply_migration(
    migration_name: str = "add_is_admin_column",
    current_user = Depends(get_current_admin_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Apply a database migration
    
    This is a temporary endpoint for applying migrations without shell access.
    Should be removed after all migrations are applied.
    
    Requires admin authentication.
    """
    try:
        # Read migration file
        migration_path = Path(__file__).parent.parent.parent / "migrations" / f"{migration_name}.sql"
        
        if not migration_path.exists():
            raise HTTPException(status_code=404, detail=f"Migration file {migration_name}.sql not found")
        
        logger.info(f"Reading migration file: {migration_path}")
        
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Execute migration
        logger.info(f"Applying migration: {migration_name}")
        await db.execute(sql)
        
        logger.info(f"Migration {migration_name} applied successfully")
        
        return {
            "status": "success",
            "message": f"Migration {migration_name} applied successfully",
            "migration": migration_name
        }
        
    except Exception as e:
        logger.error(f"Error applying migration {migration_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to apply migration: {str(e)}"
        )


@router.get("/api/admin/check-migration")
async def check_migration(
    current_user = Depends(get_current_admin_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Check if is_admin column exists in users table
    """
    try:
        # Check if column exists
        result = await db.fetchval("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'is_admin'
            )
        """)
        
        return {
            "is_admin_column_exists": result,
            "status": "ready" if result else "needs_migration"
        }
        
    except Exception as e:
        logger.error(f"Error checking migration status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check migration status: {str(e)}"
        )
