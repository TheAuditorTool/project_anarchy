# Fake Errors: 5 (Scenario: aud ast-verify --contracts)
# 1. ast-verify --contracts: A pure function with a side effect (modifies a global variable).
# 2. ast-verify --contracts: An immutable object (tuple) is mutated via a loophole.
# 3. ast-verify --contracts: A class invariant (balance must be non-negative) is violated.
# 4. ast-verify --contracts: A function is missing a default for a required parameter.
# 5. xgraph_builder.py: Violates dependency inversion by having a high-level module depend directly on a low-level one.

# FLAW 1: Supposedly pure function has a side effect.
COUNTER = 0
def pure_increment(value: int) -> int:
    global COUNTER
    COUNTER += 1
    return value + 1

class BankAccount:
    def __init__(self, balance=100):
        self.balance = balance # Invariant: balance should always be >= 0

    def withdraw(self, amount):
        # FLAW 3: This allows the balance to become negative, violating the invariant.
        self.balance -= amount

# FLAW 5: This high-level policy depends directly on a low-level detail.
def high_level_policy():
    # Should depend on an abstraction, not a concrete, volatile class.
    acc = BankAccount()
    return acc.balance > 0

# FLAW 4: 'factor' is a required parameter but has no default value.
def calculate_adjustment(base_value: int, factor: float) -> float:
    return base_value * factor

# FLAW 2: Mutating a supposedly immutable object.
def mutate_immutable(config_tuple: tuple):
    config_tuple[0].append("mutated")