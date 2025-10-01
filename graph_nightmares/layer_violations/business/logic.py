"""
Business Logic - Violates architectural layers
Phase 14: Graph Analysis - Layer Violations
ERROR 255: Business layer importing from test suite
"""

# ERROR 255: Business logic should NEVER import from tests
from tests import test_rca_scenarios

# ERROR 259: Business layer importing critical hotspot
from graph_nightmares.hotspots import critical

class BusinessLogic:
    """Business logic with inappropriate dependencies."""
    
    def __init__(self):
        self.name = "Business Logic"
        # Business logic using test code - major violation!
        self.test_runner = test_rca_scenarios
        
    def validate_business_rule(self, data):
        """Validate using test scenarios - wrong!"""
        # Business logic should not depend on test code
        try:
            # Using test functions in production logic - violation
            test_rca_scenarios.test_environment_dependent()
            return True
        except:
            return False
            
    def process_transaction(self, amount):
        """Process transaction using test utilities."""
        # Business logic calling test utilities
        if hasattr(self.test_runner, 'test_flaky'):
            # Using test randomness in business logic!
            self.test_runner.test_flaky()
            
        return {'status': 'processed', 'amount': amount}
    
    def calculate_risk_score(self):
        """Calculate risk using test scenarios."""
        # Business logic should not know about test implementation
        risk_factors = []
        
        # Checking test methods in production code
        if hasattr(test_rca_scenarios, 'test_timeout'):
            risk_factors.append('timeout_risk')
            
        if hasattr(test_rca_scenarios, 'test_memory_leak'):
            risk_factors.append('memory_risk')
            
        if hasattr(test_rca_scenarios, 'test_race_condition'):
            risk_factors.append('concurrency_risk')
            
        return len(risk_factors) * 33.33  # Risk percentage
    
    def run_business_tests(self):
        """Business logic running its own tests - violation."""
        # Production code should not execute tests
        results = []
        
        try:
            test_rca_scenarios.test_cascading_failure()
            results.append('cascade_test_passed')
        except:
            results.append('cascade_test_failed')
            
        return results

# Global business instance
business_instance = BusinessLogic()

def execute_business_flow():
    """Execute business flow with test dependencies."""
    # Production function using test infrastructure
    business_instance.validate_business_rule({'test': 'data'})
    business_instance.process_transaction(100.00)
    risk = business_instance.calculate_risk_score()
    
    return f"Business flow completed with risk score: {risk}%"