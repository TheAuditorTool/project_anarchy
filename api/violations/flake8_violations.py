"""
Flake8 Linter Violations Test File
Phase 10: Contains 6 intentional Flake8-specific violations for TheAuditor validation
Errors 197-202
"""

import re  # ERROR 202: F401 - Unused import (re-verifying for Flake8)

# ERROR 197: E501 - Line longer than 79 characters but less than 88 (Flake8's default)
def calculate_statistics_for_user_data_processing_with_moderate_length_name(data, config):
    return sum(data)

# ERROR 198: W503 - Line break before binary operator (against PEP 8 style)
def calculate_complex_formula(a, b, c, d):
    result = (a + b
              + c + d  # Line break before + operator
              * 2)
    return result

# ERROR 199: C901 - Function with cyclomatic complexity > 10
def overly_complex_function(data):
    result = 0
    if data:
        if data.get('type') == 'A':
            if data.get('subtype') == '1':
                for item in data.get('items', []):
                    if item > 10:
                        if item < 100:
                            result += item
                        elif item < 1000:
                            result += item * 2
                        else:
                            result += item * 3
            elif data.get('subtype') == '2':
                for item in data.get('items', []):
                    if item % 2 == 0:
                        result += item
                    else:
                        result -= item
        elif data.get('type') == 'B':
            if data.get('status') == 'active':
                result = sum(data.get('values', []))
            else:
                result = -1
    return result

# ERROR 200: B008 - Function call as default argument
def process_with_default(data, timestamp=get_current_timestamp()):
    return {"data": data, "time": timestamp}

# ERROR 201: E302 - Expected 2 blank lines, found 1
# Only one blank line before this function (should be 2)
def another_function():
    return True

def get_current_timestamp():
    """Helper function for B008 violation."""
    import time
    return time.time()

class ComplexClass:
    """Class to add more complexity."""
    
    def __init__(self):
        self.data = []
    
    def process(self):
        """Process data using the complex functions."""
        stats = calculate_statistics_for_user_data_processing_with_moderate_length_name([1, 2, 3], {})
        formula = calculate_complex_formula(1, 2, 3, 4)
        complex_result = overly_complex_function({'type': 'A', 'subtype': '1', 'items': [15, 150, 1500]})
        processed = process_with_default({"key": "value"})
        other = another_function()
        
        return {
            "stats": stats,
            "formula": formula,
            "complex": complex_result,
            "processed": processed,
            "other": other
        }