"""
Race Condition Scenario
Phase 15: Flow Analysis Scenarios
ERROR 261: Non-atomic operation on shared variable
Tests TheAuditor's ability to detect race conditions through data-flow analysis
"""

import asyncio
import threading
import time
from typing import List

# ERROR 261: Shared counter without synchronization
shared_counter = 0
shared_list: List[int] = []

async def unsafe_increment():
    """Async function with race condition - non-atomic read-modify-write."""
    global shared_counter
    
    # Race condition: read
    current_value = shared_counter
    
    # Simulate async work (increases chance of race condition)
    await asyncio.sleep(0.001)
    
    # Race condition: write (based on stale read)
    shared_counter = current_value + 1
    
    return shared_counter

async def create_async_race_condition():
    """Create race condition with multiple async tasks."""
    # Create 100 tasks that all try to increment the counter
    tasks = [unsafe_increment() for _ in range(100)]
    
    # Run all tasks concurrently
    results = await asyncio.gather(*tasks)
    
    # Counter should be 100, but will likely be less due to race condition
    print(f"Final counter value: {shared_counter}")
    print(f"Expected: 100, Got: {shared_counter}")
    
    if shared_counter != 100:
        print("RACE CONDITION DETECTED!")
        return False
    
    return True

# Threading race condition
def unsafe_append(n: int):
    """Thread function with race condition on list operations."""
    global shared_list
    
    for i in range(n):
        # Race condition: check-then-act pattern
        current_length = len(shared_list)
        
        # Simulate processing (increases race condition probability)
        time.sleep(0.0001)
        
        # Append based on stale length check
        if current_length < 1000:  # Arbitrary limit check
            shared_list.append(current_length)

def create_threading_race_condition():
    """Create race condition with multiple threads."""
    global shared_list
    shared_list = []
    
    # Create 10 threads, each appending 100 items
    threads = []
    for _ in range(10):
        thread = threading.Thread(target=unsafe_append, args=(100,))
        threads.append(thread)
        thread.start()
    
    # Wait for all threads
    for thread in threads:
        thread.join()
    
    # Check for duplicates (indicates race condition)
    unique_values = set(shared_list)
    if len(unique_values) != len(shared_list):
        print(f"RACE CONDITION: Found {len(shared_list) - len(unique_values)} duplicate values!")
        return False
    
    return True

# Dictionary race condition
shared_dict = {}

def unsafe_dict_operation(key: str, value: int):
    """Dictionary operation with race condition."""
    global shared_dict
    
    # Race condition: check-then-set
    if key not in shared_dict:
        time.sleep(0.0001)  # Simulate processing
        shared_dict[key] = value
    else:
        # Race condition: read-modify-write
        current = shared_dict[key]
        time.sleep(0.0001)
        shared_dict[key] = current + value

def create_dict_race_condition():
    """Create race condition with dictionary operations."""
    global shared_dict
    shared_dict = {}
    
    def worker(worker_id: int):
        for i in range(100):
            key = f"key_{i % 10}"
            unsafe_dict_operation(key, worker_id)
    
    threads = []
    for i in range(5):
        thread = threading.Thread(target=worker, args=(i,))
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    # Check for inconsistencies
    expected_keys = {f"key_{i}" for i in range(10)}
    actual_keys = set(shared_dict.keys())
    
    if expected_keys != actual_keys:
        print(f"RACE CONDITION: Missing keys: {expected_keys - actual_keys}")
        return False
    
    return True

# File-based race condition
def unsafe_file_write(filename: str, thread_id: int):
    """File operation with race condition."""
    for i in range(10):
        # Race condition: multiple threads writing to same file
        with open(filename, 'a') as f:
            # No file locking!
            current_content = f.tell()
            time.sleep(0.001)
            f.write(f"Thread {thread_id}: Line {i}\n")

def create_file_race_condition():
    """Create race condition with file operations."""
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
        filename = tmp.name
    
    threads = []
    for i in range(5):
        thread = threading.Thread(target=unsafe_file_write, args=(filename, i))
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    # Check file for corrupted/interleaved writes
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    os.unlink(filename)
    
    # Should have exactly 50 lines (5 threads * 10 lines each)
    if len(lines) != 50:
        print(f"RACE CONDITION: Expected 50 lines, got {len(lines)}")
        return False
    
    return True

if __name__ == "__main__":
    print("Testing race condition scenarios...")
    print("=" * 50)
    
    print("\n1. Testing async counter race condition:")
    asyncio.run(create_async_race_condition())
    
    print("\n2. Testing threading list race condition:")
    if not create_threading_race_condition():
        print("   ✗ Race condition detected (expected)")
    
    print("\n3. Testing dictionary race condition:")
    if not create_dict_race_condition():
        print("   ✗ Race condition detected (expected)")
    
    print("\n4. Testing file write race condition:")
    if not create_file_race_condition():
        print("   ✗ Race condition detected (expected)")
    
    print("\nRace condition testing complete - failures are expected!")