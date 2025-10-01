# Fake Errors: 5 (Scenario: Memory Leak in Event System)
# 1. universal_detector.py: Event listeners are registered but never removed, causing a memory leak.
# 2. flow_analyzer.py: A callback is potentially called twice, violating expectations.
# 3. ml.py: A team-specific coding violation (e.g., using a global event bus instead of dependency injection).
# 4. RCA Scenario (Memory Leak): A closure holds a reference to a large object, preventing garbage collection.
# 5. RCA Scenario (Memory Leak): The global event bus list grows unbounded with every call.

# FLAW 3 & 5: Global event bus grows unbounded; a team-specific violation.
EVENT_LISTENERS = []

class EventManager:
    def __init__(self):
        # FLAW 4: This closure will hold a reference to a potentially large 'self' object.
        large_data_structure = [b'X'] * (10**6) # 1MB object
        
        def on_event(data):
            print(f"Processing event with large data: {len(large_data_structure)}")
            # FLAW 2: This callback could be invoked multiple times if not managed properly.
            if "double_fire" in data:
                print("Callback fired twice!")

        # FLAW 1: The listener is appended to the global list and never removed.
        EVENT_LISTENERS.append(on_event)

    def trigger(self, data):
        for listener in EVENT_LISTENERS:
            listener(data)
            if "double_fire" in data:
                listener(data) # Intentionally fire twice