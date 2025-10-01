"""
UI Component - Violates architectural layers
Phase 14: Graph Analysis - Layer Violations
ERROR 253: UI layer directly importing from database layer
"""

# ERROR 253: UI should never directly access database layer
from graph_nightmares.layer_violations.database import db_model

class UIComponent:
    """UI component that violates layer separation."""
    
    def __init__(self):
        self.name = "UI Component"
        # UI directly creating database connection - violation!
        self.db_connection = db_model.DatabaseConnection()
        self.cached_data = None
        
    def render_user_list(self):
        """UI directly querying database - major violation."""
        # UI should go through business/service layer, not direct to DB
        users = self.db_connection.execute_query("SELECT * FROM users")
        
        html = "<ul>"
        for user in users:
            # UI directly accessing database schema knowledge
            html += f"<li>{user['username']} - {user['email']}</li>"
        html += "</ul>"
        
        return html
    
    def save_user_input(self, username, password):
        """UI directly writing to database - violation."""
        # UI should never have SQL knowledge
        query = f"INSERT INTO users (username, password) VALUES ('{username}', '{password}')"
        self.db_connection.execute_query(query)
        
        # UI managing database transactions - wrong!
        self.db_connection.commit()
        
    def delete_user(self, user_id):
        """UI performing database operations."""
        # Direct database manipulation from UI
        query = f"DELETE FROM users WHERE id = {user_id}"
        self.db_connection.execute_query(query)
        
    def get_database_stats(self):
        """UI accessing database internals."""
        # UI should not know about database implementation
        return {
            'connection_status': self.db_connection.is_connected(),
            'database_type': self.db_connection.db_type,
            'tables': self.db_connection.get_tables()
        }

# Global UI instance - another anti-pattern
ui_instance = UIComponent()