"""
Module B - Part of circular dependency chain
Phase 14: Graph Analysis - Spaghetti Code
ERROR 250: Circular import - module_b imports module_c
"""

# ERROR 250: Continuing circular dependency chain
from . import module_c

class ServiceB:
    """Service B that depends on C."""
    
    def __init__(self):
        self.name = "Service B"
        self.parent = None
        self.service_c = None
        
    def set_parent(self, parent):
        """Set parent service (creates circular reference)."""
        self.parent = parent
        
    def initialize(self):
        """Initialize with reference to C."""
        self.service_c = module_c.ServiceC()
        self.service_c.configure(self)
        
    def transform(self, data):
        """Transform data using service C."""
        if self.service_c:
            processed = self.service_c.process_data(data)
            return f"B transformed: {processed}"
        return f"B: {data}"
    
    def get_status(self):
        """Get status from service C."""
        if self.service_c:
            return self.service_c.get_status()
        return 'inactive'

# Global instance
service_b_instance = ServiceB()

def function_b():
    """Function that uses module_c functionality."""
    result = module_c.function_c()
    return f"Function B calling C: {result}"