"""
Module C - Completes the circular dependency chain
Phase 14: Graph Analysis - Spaghetti Code  
ERROR 251: Circular import - module_c imports module_a (completing the circle)
"""

# ERROR 251: Completing circular dependency A -> B -> C -> A
from . import module_a

class ServiceC:
    """Service C that depends back on A."""
    
    def __init__(self):
        self.name = "Service C"
        self.parent_b = None
        self.service_a = None
        
    def configure(self, parent_b):
        """Configure with parent B service."""
        self.parent_b = parent_b
        # This creates the full circular reference
        self.service_a = module_a.service_a_instance
        
    def process_data(self, data):
        """Process data potentially using service A."""
        # Risky: might cause infinite recursion
        if isinstance(data, str) and self.service_a:
            # Could trigger A -> B -> C -> A loop
            return self.service_a.process(f"C->{data}")
        return f"C processed: {data}"
    
    def get_status(self):
        """Get combined status."""
        status = {
            'service_c': 'active',
            'has_parent_b': self.parent_b is not None,
            'has_service_a': self.service_a is not None
        }
        return status
    
    def trigger_cycle(self):
        """Method that could trigger infinite recursion."""
        if self.service_a:
            # This call path: C -> A -> B -> C -> A...
            return self.service_a.get_status()
        return None

# Global instance
service_c_instance = ServiceC()

def function_c():
    """Function that uses module_a functionality."""
    # Circular function call
    result = module_a.function_a()
    return f"Function C calling A: {result}"