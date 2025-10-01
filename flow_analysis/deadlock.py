"""
Deadlock Scenario
Phase 15: Flow Analysis Scenarios
ERROR 260: Classic two-thread, two-lock deadlock
Tests TheAuditor's ability to detect potential deadlocks through CFG analysis
"""

import threading
import time
import logging

logging.basicConfig(level=logging.DEBUG, format='%(threadName)s: %(message)s')

# ERROR 260: Two locks that will cause deadlock
lock_a = threading.Lock()
lock_b = threading.Lock()

# Shared resources
resource_a = {'value': 0}
resource_b = {'value': 0}

def thread_1_function():
    """Thread 1: Acquires lock_a then lock_b."""
    logging.debug("Thread 1 starting...")
    
    # Acquire first lock
    logging.debug("Thread 1 acquiring lock_a...")
    with lock_a:
        logging.debug("Thread 1 acquired lock_a")
        resource_a['value'] += 1
        
        # Simulate some work
        time.sleep(0.1)
        
        # Try to acquire second lock - DEADLOCK POINT
        logging.debug("Thread 1 waiting for lock_b...")
        with lock_b:
            logging.debug("Thread 1 acquired lock_b")
            resource_b['value'] += 1
            
    logging.debug("Thread 1 completed")

def thread_2_function():
    """Thread 2: Acquires lock_b then lock_a - opposite order!"""
    logging.debug("Thread 2 starting...")
    
    # Acquire first lock (different order than thread 1)
    logging.debug("Thread 2 acquiring lock_b...")
    with lock_b:
        logging.debug("Thread 2 acquired lock_b")
        resource_b['value'] += 10
        
        # Simulate some work
        time.sleep(0.1)
        
        # Try to acquire second lock - DEADLOCK POINT
        logging.debug("Thread 2 waiting for lock_a...")
        with lock_a:
            logging.debug("Thread 2 acquired lock_a")
            resource_a['value'] += 10
            
    logging.debug("Thread 2 completed")

def create_deadlock():
    """Create and start threads that will deadlock."""
    thread_1 = threading.Thread(target=thread_1_function, name="Thread-1")
    thread_2 = threading.Thread(target=thread_2_function, name="Thread-2")
    
    # Start both threads
    thread_1.start()
    thread_2.start()
    
    # Wait for threads (will hang forever due to deadlock)
    thread_1.join(timeout=5)
    thread_2.join(timeout=5)
    
    # Check if threads are still alive (indicates deadlock)
    if thread_1.is_alive() or thread_2.is_alive():
        logging.error("DEADLOCK DETECTED! Threads are stuck.")
        return False
    
    return True

# More complex deadlock scenario with multiple locks
class BankAccount:
    """Bank account with potential for deadlock in transfers."""
    
    def __init__(self, account_id, balance=1000):
        self.account_id = account_id
        self.balance = balance
        self.lock = threading.Lock()
    
    def transfer_to(self, other_account, amount):
        """Transfer money - acquires locks in arbitrary order (deadlock prone)."""
        # This is the wrong way - no lock ordering!
        with self.lock:
            time.sleep(0.01)  # Simulate processing
            with other_account.lock:  # Potential deadlock!
                if self.balance >= amount:
                    self.balance -= amount
                    other_account.balance += amount
                    return True
        return False

def create_transfer_deadlock():
    """Create deadlock scenario with bank transfers."""
    account_a = BankAccount("A", 1000)
    account_b = BankAccount("B", 1000)
    
    def transfer_a_to_b():
        for _ in range(10):
            account_a.transfer_to(account_b, 100)
            
    def transfer_b_to_a():
        for _ in range(10):
            account_b.transfer_to(account_a, 100)
    
    thread_a = threading.Thread(target=transfer_a_to_b)
    thread_b = threading.Thread(target=transfer_b_to_a)
    
    thread_a.start()
    thread_b.start()
    
    thread_a.join(timeout=5)
    thread_b.join(timeout=5)
    
    if thread_a.is_alive() or thread_b.is_alive():
        logging.error("DEADLOCK in bank transfers!")
        return False
    
    return True

if __name__ == "__main__":
    print("Testing deadlock scenarios...")
    print("=" * 50)
    
    print("\n1. Testing basic two-lock deadlock:")
    if not create_deadlock():
        print("   ✗ Deadlock occurred (as expected for testing)")
    else:
        print("   ✓ No deadlock (unexpected)")
    
    print("\n2. Testing bank transfer deadlock:")
    if not create_transfer_deadlock():
        print("   ✗ Deadlock occurred (as expected for testing)")
    else:
        print("   ✓ No deadlock (unexpected)")
    
    print("\nDeadlock testing complete - failures are expected!")