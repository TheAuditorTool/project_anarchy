"""
Module A - Part of circular dependency chain
Phase 14: Graph Analysis - Spaghetti Code
ERROR 249: Circular import - module_a imports module_b
"""

# ERROR 249: Start of circular dependency chain
from . import module_b

class ServiceA:
    """Service A that depends on B."""
    
    def __init__(self):
        self.name = "Service A"
        self.service_b = None
        
    def initialize(self):
        """Initialize with circular reference to B."""
        self.service_b = module_b.ServiceB()
        self.service_b.set_parent(self)
        
    def process(self, data):
        """Process data using service B."""
        if self.service_b:
            return self.service_b.transform(data)
        return data
    
    def get_status(self):
        """Get status from both services."""
        status = {
            'service_a': 'active',
            'service_b': self.service_b.get_status() if self.service_b else 'not initialized'
        }
        return status

# Global instance
service_a_instance = ServiceA()

def function_a():
    """Function that uses module_b functionality."""
    result = module_b.function_b()
    return f"Function A calling B: {result}"