"""
Ruff Linter Violations Test File
Phase 10: Contains 8 intentional Ruff violations for TheAuditor validation
Errors 189-196
"""

# ERROR 189: Line too long (>88 characters) - E501
def process_user_data_with_extremely_long_function_name_that_exceeds_eighty_eight_characters_limit(user_id, user_name, user_email):
    return {"processed": True}

# ERROR 190: Import order violation - I001
# Standard library should come first, then third-party, then local
import pandas as pd
import os
import sys
from ..utils import helper_function

# ERROR 191: Unused import - F401
import json  # This import is never used in the file

# ERROR 192: Missing docstring in public function - D103
def calculate_total(items):
    return sum(item.get('price', 0) for item in items)

# ERROR 193: F-string in logging - G004
import logging
def log_user_action(user_id, action):
    logging.info(f"User {user_id} performed {action}")  # Should use % formatting in logging

# ERROR 194: Mutable default argument - B006
def add_item_to_list(item, target_list=[]):
    target_list.append(item)
    return target_list

# ERROR 195: Missing type hints - ANN101, ANN401
def process_data(data, config):  # Missing type hints for arguments and return
    result = {}
    for key, value in data.items():
        if key in config:
            result[key] = value * config[key]
    return result

# ERROR 196: Assert in production code - S101
def validate_input(value):
    assert value > 0, "Value must be positive"  # Assert should not be used in production
    return value * 2

# Additional function to make imports valid
def helper_function():
    """Helper function to avoid import errors."""
    return True

class DataProcessor:
    """Class to demonstrate various Ruff violations."""
    
    def __init__(self):
        self.data = []
    
    def process(self):
        """Process data with various violations."""
        # Using the functions defined above
        result = calculate_total([{"price": 10}, {"price": 20}])
        log_user_action("user123", "purchase")
        items = add_item_to_list("new_item")
        processed = process_data({"a": 1}, {"a": 2})
        validated = validate_input(5)
        return {
            "total": result,
            "items": items,
            "processed": processed,
            "validated": validated
        }