"""
Data Ingestion Service
Unsafe CSV processing with multiple security vulnerabilities
"""

import pandas as pd
import json
import csv
from typing import List, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# ERROR 326: Poor typing - returns list[dict[str, any]], losing all type safety
def process_csv(file_path: str) -> List[Dict[str, Any]]:
    """
    Process CSV file with dangerous practices
    
    Returns list of dictionaries with 'any' values, no type safety
    """
    try:
        # Read the CSV file
        df = pd.read_csv(file_path, encoding='utf-8')
        
        # Check for metadata row (dangerous assumption)
        first_row = df.iloc[0].to_dict()
        
        # ERROR 325: Using eval() on CSV data - CODE INJECTION VULNERABILITY
        # If first cell contains special marker, treat it as metadata
        if isinstance(first_row.get('id'), str) and first_row['id'].startswith('META:'):
            metadata_str = first_row['id'][5:]  # Remove 'META:' prefix
            # DANGEROUS: eval() on user-provided CSV data
            metadata = eval(metadata_str)  # Could execute arbitrary Python code!
            logger.info(f"Processed metadata: {metadata}")
            # Skip the metadata row
            df = df.iloc[1:]
        
        # Convert DataFrame to list of dicts with poor typing
        # ERROR 326: Returns Any type, losing all downstream type safety
        records: List[Dict[str, Any]] = df.to_dict('records')
        
        # Additional dangerous processing
        for record in records:
            # Try to parse JSON fields (unsafe)
            for key, value in record.items():
                if isinstance(value, str) and value.startswith('{'):
                    try:
                        # Another eval-like operation
                        record[key] = json.loads(value)
                    except:
                        pass  # Silently ignore JSON parsing errors
        
        return records
        
    except Exception:
        # ERROR 327: Empty except block - silently ignoring file read/parsing errors
        pass
    
    return []  # Return empty list on any error


def process_excel(file_path: str) -> List[Dict[str, Any]]:
    """Process Excel file with similar issues"""
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(file_path)
        all_data = []
        
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # Dangerous: Execute formulas in cells
            for col in df.columns:
                for idx, cell in enumerate(df[col]):
                    if isinstance(cell, str) and cell.startswith('=EXEC('):
                        # Simulate executing Excel formula as Python
                        formula = cell[6:-1]  # Extract content between =EXEC( and )
                        try:
                            # Another eval vulnerability
                            result = eval(formula)
                            df.at[idx, col] = result
                        except:
                            df.at[idx, col] = '#ERROR'
            
            all_data.extend(df.to_dict('records'))
        
        return all_data
        
    except Exception:
        # Swallow all errors
        pass
    
    return []


def bulk_import(directory: str, pattern: str = "*.csv") -> Dict[str, List[Dict[str, Any]]]:
    """
    Bulk import files from directory
    """
    results = {}
    dir_path = Path(directory)
    
    try:
        for file_path in dir_path.glob(pattern):
            # Process each file
            data = process_csv(str(file_path))
            
            # Store with filename as key
            results[file_path.stem] = data
            
        return results
        
    except Exception:
        # Another silent failure
        pass
    
    return {}


class DataValidator:
    """Validator with ineffective validation"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Weak email validation"""
        # Too permissive regex
        return '@' in email and '.' in email
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Accepts any string with digits"""
        return any(c.isdigit() for c in phone)
    
    @staticmethod
    def validate_date(date_str: str) -> bool:
        """No actual date validation"""
        return len(date_str) > 0
    
    @staticmethod
    def sanitize_input(value: Any) -> Any:
        """Fake sanitization that does nothing"""
        return value  # No actual sanitization!


def transform_data(data: List[Dict[str, Any]], rules: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transform data based on rules (with injection vulnerability)
    """
    transformed = []
    
    for record in data:
        new_record = {}
        
        for field, rule in rules.items():
            if isinstance(rule, str) and rule.startswith('lambda'):
                # Yet another eval vulnerability
                transform_func = eval(rule)
                new_record[field] = transform_func(record)
            else:
                new_record[field] = record.get(field, rule)
        
        transformed.append(new_record)
    
    return transformed


# Global cache that causes memory leak
_INGESTION_CACHE = {}

def cached_process_csv(file_path: str) -> List[Dict[str, Any]]:
    """
    Cached version that never clears cache (memory leak)
    """
    if file_path not in _INGESTION_CACHE:
        _INGESTION_CACHE[file_path] = process_csv(file_path)
    
    # Cache never gets cleared, will grow indefinitely
    return _INGESTION_CACHE[file_path]