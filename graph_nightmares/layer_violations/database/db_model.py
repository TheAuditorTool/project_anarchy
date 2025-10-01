"""
Database Model - Violates architectural layers
Phase 14: Graph Analysis - Layer Violations
ERROR 254: Database layer importing from UI layer (reverse dependency)
"""

# ERROR 254: Database should NEVER import from UI layer
from graph_nightmares.layer_violations.ui import ui_component

class DatabaseConnection:
    """Database connection that violates layer separation."""
    
    def __init__(self):
        self.db_type = "PostgreSQL"
        self.connected = False
        self.tables = ['users', 'products', 'orders']
        # Database referencing UI - massive violation!
        self.ui_notifier = None
        
    def connect(self):
        """Connect to database with UI notification - violation."""
        self.connected = True
        
        # Database directly updating UI - wrong direction!
        if hasattr(ui_component, 'ui_instance'):
            ui_component.ui_instance.show_notification("Database connected")
            
    def execute_query(self, query):
        """Execute query with UI updates - violation."""
        # Simulate query execution
        results = []
        
        if "SELECT" in query:
            results = [
                {'id': 1, 'username': 'user1', 'email': 'user1@example.com'},
                {'id': 2, 'username': 'user2', 'email': 'user2@example.com'}
            ]
            
        # Database updating UI progress - wrong!
        if self.ui_notifier:
            self.ui_notifier.update_progress(50)
            
        return results
    
    def commit(self):
        """Commit transaction with UI feedback."""
        # Database layer shouldn't know about UI
        if hasattr(ui_component, 'ui_instance'):
            ui_component.ui_instance.flash_message("Changes saved!")
            
    def is_connected(self):
        """Check connection status."""
        return self.connected
    
    def get_tables(self):
        """Get list of tables."""
        return self.tables
    
    def refresh_ui_cache(self):
        """Database telling UI to refresh - violation."""
        # Database should not control UI behavior
        if hasattr(ui_component, 'ui_instance'):
            ui_component.ui_instance.cached_data = None
            
class UserModel:
    """User model with UI dependencies."""
    
    def __init__(self):
        self.db = DatabaseConnection()
        
    def create_user(self, data):
        """Create user with UI updates."""
        # Model directly manipulating UI - violation
        if hasattr(ui_component, 'ui_instance'):
            ui_component.ui_instance.show_loading_spinner()
            
        # Simulate user creation
        query = f"INSERT INTO users VALUES ({data})"
        self.db.execute_query(query)
        
        # Model hiding UI elements - wrong!
        if hasattr(ui_component, 'ui_instance'):
            ui_component.ui_instance.hide_loading_spinner()

# Global model instance
user_model = UserModel()