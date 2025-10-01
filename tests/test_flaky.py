# Fake Errors: 5 (Scenario: aud rca on flaky tests)
# 1. aud rca: A test that fails due to timing issues (a race condition with a short sleep).
# 2. aud rca: A test that fails due to locale-dependent string sorting.
# 3. aud rca: A test that fails due to platform-specific path separators.
# 4. aud detect-patterns: Uses magic numbers (e.g., 0.1) instead of named constants.
# 5. aud workset --diff: This test covers a deprecated module (`os.path`) that might be modified.

import os
import time
import locale

def test_timing_issue():
    # FLAW 1: This test is flaky. It will fail if the sleep takes slightly longer than 0.1s.
    start = time.time()
    time.sleep(0.1) # FLAW 4: Magic number 0.1
    duration = time.time() - start
    assert duration < 0.105

def test_locale_issue():
    # FLAW 2: This test's success depends on the system's locale for sorting.
    # In a German locale ('de_DE'), 'ä' comes after 'z'. In others, it might not.
    locale.setlocale(locale.LC_ALL, '')
    items = ['z', 'ä']
    items.sort()
    assert items == ['z', 'ä'] # This will fail in many locales.

def test_platform_path_issue():
    # FLAW 3: This test hardcodes a Unix path separator and will fail on Windows.
    # FLAW 5: This uses the os.path module, which is often considered for deprecation in favor of pathlib.
    path = os.path.join("a", "b", "c")
    assert path == "a/b/c"