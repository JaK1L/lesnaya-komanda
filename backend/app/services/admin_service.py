"""
Service for managing admin role checks and status updates
"""
import asyncpg
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class AdminService:
    """Service for checking and managing admin roles based on Discord role"""
    
    def __init__(self, db: asyncpg.Connection):
        self.db = db
        self.admin_role_name = "🐓ПИТУХ🐓"
    
    async def check_admin_role(self, discord_id: int) -> bool:
        """
        Check if user has admin role in discord_presence
        
        Args:
            discord_id: Discord ID of the user
            
        Returns:
            True if user has role "🐓ПИТУХ🐓", False otherwise
        """
        try:
            # Get roles from discord_presence
            roles_data = await self.db.fetchval(
                "SELECT roles FROM discord_presence WHERE discord_id = $1",
                discord_id
            )
            
            # Handle NULL or missing data
            if roles_data is None:
                logger.debug(f"No discord_presence data for user {discord_id}")
                return False
            
            # Parse JSONB roles array
            try:
                if isinstance(roles_data, str):
                    roles = json.loads(roles_data)
                else:
                    roles = roles_data
                
                if not isinstance(roles, list):
                    logger.warning(f"Invalid roles format for user {discord_id}: expected list, got {type(roles)}")
                    return False
                
                # Check for admin role (case-insensitive)
                for role in roles:
                    if isinstance(role, dict) and 'name' in role:
                        role_name = role['name']
                        if isinstance(role_name, str) and role_name.lower() == self.admin_role_name.lower():
                            return True
                
                return False
                
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(f"Failed to parse roles JSON for user {discord_id}: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking admin role for user {discord_id}: {e}")
            return False
    
    async def update_admin_status(self, user_id: int, is_admin: bool) -> None:
        """
        Update admin status in users table
        
        Args:
            user_id: ID of user in users table
            is_admin: New admin status
        """
        try:
            await self.db.execute(
                "UPDATE users SET is_admin = $1 WHERE id = $2",
                is_admin, user_id
            )
            logger.debug(f"Updated is_admin={is_admin} for user_id={user_id}")
        except Exception as e:
            logger.error(f"Failed to update admin status for user_id={user_id}: {e}")
            raise
    
    async def sync_admin_status_on_login(self, discord_id: int) -> bool:
        """
        Synchronize admin status during OAuth login
        
        Checks discord_presence for admin role and updates users.is_admin accordingly.
        Logs admin status changes.
        
        Args:
            discord_id: Discord ID of the user
            
        Returns:
            New is_admin status
        """
        try:
            # Check if user has admin role
            has_admin_role = await self.check_admin_role(discord_id)
            
            # Get current is_admin status and user_id
            user_data = await self.db.fetchrow(
                "SELECT id, is_admin FROM users WHERE discord_id = $1",
                discord_id
            )
            
            if user_data is None:
                logger.warning(f"User with discord_id={discord_id} not found in users table")
                return False
            
            user_id = user_data['id']
            current_is_admin = user_data['is_admin']
            
            # Update if status changed
            if current_is_admin != has_admin_role:
                await self.update_admin_status(user_id, has_admin_role)
                
                # Log status change
                if has_admin_role:
                    logger.info(
                        f"Admin rights granted to user_id={user_id} discord_id={discord_id} "
                        f"(role '{self.admin_role_name}' found in discord_presence)"
                    )
                else:
                    logger.warning(
                        f"Admin rights revoked from user_id={user_id} discord_id={discord_id} "
                        f"(role '{self.admin_role_name}' not found in discord_presence)"
                    )
            
            return has_admin_role
            
        except Exception as e:
            logger.error(f"Error syncing admin status for discord_id={discord_id}: {e}")
            # Don't raise - allow OAuth to continue even if admin sync fails
            return False
