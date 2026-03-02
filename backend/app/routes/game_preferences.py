"""
API routes for game preferences management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from app.database import database
from app.auth import get_current_user
from app.schemas import GamePreferencesRequest, APIResponse, GameStatistics
from app.services.game_preferences_service import GamePreferencesService
from asyncpg import PostgresError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["game_preferences"])


@router.post("/users/game-preferences", response_model=APIResponse)
async def save_game_preferences(
    request: GamePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save user game preferences
    
    Requires authentication. Saves the selected games to the user's profile.
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        async with database.get_connection() as conn:
            await GamePreferencesService.save_preferences(
                conn,
                user_id,
                request.preferences
            )
        
        return APIResponse(
            status="success",
            message="Game preferences saved successfully"
        )
        
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Validation failed", "details": e.errors()}
        )
    except ValueError as e:
        logger.error(f"Value error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid data", "message": str(e)}
        )
    except PostgresError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.put("/users/game-preferences", response_model=APIResponse)
async def update_game_preferences(
    request: GamePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user game preferences
    
    Requires authentication. Updates the selected games in the user's profile.
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        async with database.get_connection() as conn:
            await GamePreferencesService.update_preferences(
                conn,
                user_id,
                request.preferences
            )
        
        return APIResponse(
            status="success",
            message="Game preferences updated successfully"
        )
        
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Validation failed", "details": e.errors()}
        )
    except ValueError as e:
        logger.error(f"Value error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid data", "message": str(e)}
        )
    except PostgresError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post("/users/game-preferences/skip", response_model=APIResponse)
async def skip_game_preferences(
    current_user: dict = Depends(get_current_user)
):
    """
    Skip game preferences survey
    
    Requires authentication. Sets game_preferences to empty array to prevent modal from showing again.
    """
    try:
        user_id = current_user.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in token"
            )
        
        async with database.get_connection() as conn:
            await GamePreferencesService.skip_preferences(conn, user_id)
        
        return APIResponse(
            status="success",
            message="Game preferences survey skipped"
        )
        
    except PostgresError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get("/games/statistics", response_model=GameStatistics)
async def get_game_statistics():
    """
    Get game statistics (public endpoint)
    
    Returns the count of players for each game category.
    No authentication required.
    """
    try:
        async with database.get_connection() as conn:
            stats = await GamePreferencesService.get_game_statistics(conn)
        
        return GameStatistics(
            CS2=stats.get("CS2", 0),
            DOTA_2=stats.get("DOTA 2", 0),
            VALORANT=stats.get("VALORANT", 0),
            OTHER=stats.get("ДРУГИЕ", 0)
        )
        
    except PostgresError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
