# Fake Errors: 5 (Scenario: aud graph build --exclude-self)
# 1. aud graph build: A dynamic import using importlib breaks static analysis.
# 2. aud graph build: A high-level module (this one) directly imports from a test utility, a layering violation.
# 3. aud graph build: A hidden dependency is introduced by modifying a global state in another module.
# 4. aud graph build: A cross-boundary import from `tests` into `api` source.
# 5. framework_detector.py: A framework (e.g., Flask) is installed but never directly used in the app.

import importlib
from api import utils
# FLAW 118 (Layering Violation): High-level importing from test utility
from tests.test_flaky import test_locale_dependent
# FLAW 119 (Cross-boundary): Another cross-boundary import
from tests.test_logic import test_counter 

def load_module_dynamically(module_name):
    # FLAW 117: Dynamic import that static analysis cannot follow.
    module = importlib.import_module(module_name)
    return module

def update_global_cache():
    # FLAW 120: Hidden dependency. This function changes behavior in the `utils` module without an explicit return.
    utils.cache['dynamic_loader_ran'] = True

def check_flask_install():
    # FLAW 121: This function confirms Flask is installed, but the app uses FastAPI, triggering "framework installed but not used".
    try:
        import flask
        return "Flask is installed."
    except ImportError:
        return "Flask is not installed."