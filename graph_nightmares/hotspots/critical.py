"""
Critical Module - Code Hotspot
Phase 14: Graph Analysis - Hotspot Detection
ERROR 256: Critical module that becomes a dangerous hotspot
This module is imported by many others, making it fragile and high-impact
"""

# ERROR 256: This module becomes a hotspot of dependencies
import logging
import time
from datetime import datetime

# Global state that many modules depend on - dangerous!
GLOBAL_CONFIG = {
    'debug': True,
    'timeout': 30,
    'max_retries': 3,
    'api_key': 'critical_api_key_12345',
    'database_url': 'postgresql://localhost/critical_db'
}

# Mutable global state - even worse!
GLOBAL_CACHE = {}
GLOBAL_COUNTER = 0

def an_important_function():
    """Critical function that many modules depend on."""
    global GLOBAL_COUNTER
    GLOBAL_COUNTER += 1
    
    # Side effects that affect all importers
    if GLOBAL_COUNTER > 100:
        raise RuntimeError("Critical function called too many times!")
    
    return f"Critical operation #{GLOBAL_COUNTER}"

def get_critical_config(key):
    """Get configuration that many modules need."""
    if key not in GLOBAL_CONFIG:
        raise KeyError(f"Critical config key '{key}' not found!")
    return GLOBAL_CONFIG[key]

def set_critical_config(key, value):
    """Set configuration - affects all modules!"""
    global GLOBAL_CONFIG
    GLOBAL_CONFIG[key] = value
    # Side effect: log all config changes
    logging.warning(f"Critical config changed: {key} = {value}")

def critical_initialization():
    """Initialization that must happen before anything else."""
    global GLOBAL_CACHE
    GLOBAL_CACHE = {
        'initialized': True,
        'timestamp': datetime.now(),
        'version': '1.0.0'
    }
    
    # Simulate expensive initialization
    time.sleep(0.1)
    
    return GLOBAL_CACHE

def critical_validation(data):
    """Validation used by multiple modules."""
    if not GLOBAL_CACHE.get('initialized'):
        raise RuntimeError("Critical module not initialized!")
    
    if not data:
        raise ValueError("Critical validation failed: empty data")
    
    return True

def critical_transformation(data):
    """Data transformation used across the codebase."""
    # Transformation with side effects
    result = str(data).upper()
    
    # Cache the transformation (memory leak potential)
    GLOBAL_CACHE[data] = result
    
    return result

def critical_cleanup():
    """Cleanup that affects all dependent modules."""
    global GLOBAL_CACHE, GLOBAL_COUNTER
    
    # Reset everything - will break dependent modules!
    GLOBAL_CACHE.clear()
    GLOBAL_COUNTER = 0
    GLOBAL_CONFIG['debug'] = False
    
    logging.warning("Critical cleanup performed - all modules affected!")

class CriticalSingleton:
    """Singleton pattern - another hotspot anti-pattern."""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.initialized = False
        return cls._instance
    
    def initialize(self):
        """Initialize the singleton."""
        if not self.initialized:
            self.data = critical_initialization()
            self.initialized = True
            
    def get_instance_data(self):
        """Get singleton data."""
        if not self.initialized:
            raise RuntimeError("CriticalSingleton not initialized!")
        return self.data

# Global singleton instance - used everywhere
CRITICAL_SINGLETON = CriticalSingleton()

# Module-level initialization that runs on import - dangerous!
print(f"Critical module imported at {datetime.now()}")
critical_initialization()