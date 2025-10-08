"""
Simple Auth Service using demo accounts from JSON file
"""
import json
import os
from typing import Optional, Dict, Any
from pathlib import Path

class AuthService:
    """Authentication service using demo accounts"""
    
    def __init__(self):
        """Load demo accounts from JSON file"""
        self.accounts_file = Path("data/demo_accounts.json")
        self.users = self._load_accounts()
    
    def _load_accounts(self) -> Dict[str, Dict[str, Any]]:
        """Load accounts from JSON file"""
        if not self.accounts_file.exists():
            raise FileNotFoundError(f"Demo accounts file not found: {self.accounts_file}")
        
        with open(self.accounts_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Convert list to dict with username as key
        users_dict = {}
        for user in data.get('users', []):
            users_dict[user['username']] = user
        
        return users_dict
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with username and password
        
        Args:
            username: Username
            password: Plain text password
            
        Returns:
            User data if authenticated, None otherwise
        """
        user = self.users.get(username)
        
        if not user:
            return None
        
        # Simple password check (plain text for demo)
        if user['password'] != password:
            return None
        
        # Return user data without password
        user_data = {
            "id": user['id'],
            "username": user['username'],
            "full_name": user['full_name'],
            "email": user['email'],
            "role": user['role'],
            "portal": user['portal']  # Important for frontend routing
        }
        
        # Add optional fields based on role
        if user['role'] == 'admin':
            user_data['department'] = user.get('department')
        elif user['role'] == 'lecturer':
            user_data['department'] = user.get('department')
            user_data['courses'] = user.get('courses', [])
        elif user['role'] == 'student':
            user_data['student_id'] = user.get('student_id')
            user_data['class'] = user.get('class')
            user_data['year'] = user.get('year')
        
        return user_data
    
    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user data by username (without password)
        
        Args:
            username: Username
            
        Returns:
            User data without password
        """
        user = self.users.get(username)
        
        if not user:
            return None
        
        # Return user data without password
        user_data = user.copy()
        user_data.pop('password', None)
        
        return user_data
    
    def reload_accounts(self):
        """Reload accounts from file (useful for development)"""
        self.users = self._load_accounts()

# Global instance
auth_service = AuthService()
