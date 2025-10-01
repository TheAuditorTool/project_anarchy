"""
Module D - Consumer of tangled modules
Phase 14: Graph Analysis - Spaghetti Code
ERROR 252: Imports all circular dependency modules
"""

# ERROR 252: Consumer importing all tangled modules
from . import module_a
from . import module_b  
from . import module_c

# ERROR 258: Spaghetti module importing critical hotspot
from graph_nightmares.hotspots import critical

class OrchestratorD:
    """Orchestrator that tries to use all tangled services."""
    
    def __init__(self):
        self.name = "Orchestrator D"
        # Trying to use all services from the circular mess
        self.service_a = module_a.ServiceA()
        self.service_b = module_b.ServiceB()
        self.service_c = module_c.ServiceC()
        
    def initialize_all(self):
        """Initialize all services - risky with circular deps."""
        try:
            self.service_a.initialize()
            self.service_b.initialize()
            # This completes the circular reference chain
            self.service_c.configure(self.service_b)
        except RecursionError as e:
            print(f"Caught recursion error: {e}")
            
    def orchestrate(self, data):
        """Try to orchestrate across all services."""
        results = []
        
        # Each call might trigger circular dependencies
        try:
            results.append(('A', self.service_a.process(data)))
        except:
            results.append(('A', 'Failed due to circular dependency'))
            
        try:
            results.append(('B', self.service_b.transform(data)))
        except:
            results.append(('B', 'Failed due to circular dependency'))
            
        try:
            results.append(('C', self.service_c.process_data(data)))
        except:
            results.append(('C', 'Failed due to circular dependency'))
            
        return results
    
    def test_functions(self):
        """Test all module functions - will likely fail."""
        results = []
        
        try:
            results.append(module_a.function_a())
        except:
            results.append("function_a failed")
            
        try:
            results.append(module_b.function_b())
        except:
            results.append("function_b failed")
            
        try:
            results.append(module_c.function_c())
        except:
            results.append("function_c failed")
            
        return results

# Global orchestrator
orchestrator = OrchestratorD()

def main():
    """Entry point demonstrating the spaghetti code problems."""
    print("Initializing tangled services...")
    orchestrator.initialize_all()
    
    print("Testing orchestration...")
    results = orchestrator.orchestrate("test data")
    for service, result in results:
        print(f"{service}: {result}")
    
    print("Testing functions...")
    function_results = orchestrator.test_functions()
    for result in function_results:
        print(f"Function result: {result}")

if __name__ == "__main__":
    # This will likely fail or cause issues due to circular imports
    main()