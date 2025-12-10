# Testing Documentation
# INTENTIONAL ERRORS: #286-287 for TheAuditor testing

## Test Strategy

This document describes Project Anarchy's testing approach.

---

## ERROR #286: Documented test coverage is false

### Coverage Claims

**DOCUMENTED:**
> - Unit test coverage: 85%
> - Integration test coverage: 70%
> - E2E test coverage: 50%
> - All critical paths have tests

**ACTUAL (from .coveragerc):**
```ini
[run]
omit =
    */tests/*
    */test_*
    */__pycache__/*
    */migrations/*
    */security/*        # Excludes security code!
    */vulnerable/*      # Excludes vulnerable code!
    */api/db.py         # Excludes database code!
    */api/auth*.py      # Excludes auth code!
```

**REAL COVERAGE:** ~15% (most critical code is excluded)

### Test Quality

**DOCUMENTED:**
> All tests follow best practices:
> - Isolated
> - Deterministic
> - Fast
> - Self-documenting

**ACTUAL (from tests/):**
- `test_flaky.py`: Tests that randomly fail
- `test_timing.py`: Tests that depend on timing
- `test_environment.py`: Tests that depend on environment
- `test_mock_everything.py`: Tests that mock the thing being tested
- `test_tautology.py`: Tests that always pass (assert True)

---

## ERROR #287: Test anti-patterns not documented

### Known Test Issues (Undocumented)

| File | Anti-Pattern | Description |
|------|--------------|-------------|
| test_flaky.py | Flaky test | Random failures due to race conditions |
| test_timing.py | Timing dependency | Uses `sleep()` and `time.time()` |
| test_environment.py | Env dependency | Requires specific env vars |
| test_mock_everything.py | Mock abuse | Mocks the SUT itself |
| test_tautology.py | Tautological | `assert True`, `assert 1 == 1` |
| test_wrong_scale.py | Wrong scale | Unit tests that hit real DB |
| api.spec.js | No assertions | Tests with no actual checks |

### Missing Test Documentation

The following are NOT documented:
1. How to run tests locally
2. Required test environment setup
3. Test data seeding process
4. CI/CD test configuration
5. Test failure triage process

---

## Current Test Structure

```
tests/
├── test_flaky.py           # Intentionally flaky
├── test_timing.py          # Timing-dependent
├── test_environment.py     # Environment-dependent
├── test_mock_everything.py # Over-mocked
├── test_tautology.py       # Meaningless assertions
├── test_wrong_scale.py     # Wrong isolation level
└── api.spec.js             # No real assertions
```

---

## Running Tests

### Documented Command
```bash
pytest --cov=. --cov-report=html
```

### Actual Issues
- Tests require specific environment variables
- Some tests require running services
- Coverage report excludes critical code
- No test isolation (tests affect each other)

---

## Test Data

**DOCUMENTED:**
> Test data is generated fresh for each test run.

**ACTUAL:**
- Tests use hardcoded data
- Some tests modify shared fixtures
- No cleanup between tests
- Production data in test fixtures

---

## CI/CD Testing

**DOCUMENTED:**
> All PRs must pass test suite before merge.

**ACTUAL:**
- Many tests marked as `@pytest.mark.skip`
- CI config allows test failures
- No branch protection requiring tests
