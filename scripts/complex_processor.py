# Fake Errors: 5
# 1. rca.py: An off-by-one error in a loop will cause an IndexError.
# 2. rca.py: A deliberate integer overflow for 8-bit signed integers.
# 3. ast_verify.py: The function 'process_record' has an unused parameter 'context'.
# 4. risk_scorer.py: The function 'calculate_risk' has a very high cyclomatic complexity.
# 5. ast_verify.py: The function 'get_status' returns inconsistent types (string or boolean).

def process_items(items):
    # FLAW 1: Off-by-one error. Loop goes one item too far.
    for i in range(len(items)):
        print(items[i+1]) # Will raise IndexError on the last iteration.

def increment_counter(val: int):
    # FLAW 2: Integer overflow. If val is 127, this will wrap around in some systems.
    # Simulating for detection.
    if val > 126:
        return -128
    return val + 1

def process_record(record, context): # FLAW 3: 'context' is an unused parameter.
    return record['id']

def get_status(record): # FLAW 5: Inconsistent return types.
    if record.get("is_active"):
        return "ACTIVE"
    return False

def calculate_risk(p1, p2, p3, p4, p5): # FLAW 4: High cyclomatic complexity.
    if p1 and p2 > 50:
        if p3 in ['high', 'critical']: return 100
        elif p3 == 'medium': return 75
        else: return 50
    elif p2 <= 50 and (p4 or p5):
        if p3 == 'high': return 80
        else: return 60
    elif p1 is False:
        if p4 and not p5: return 20
        elif p5: return 30
        else: return 10
    else:
        return 0