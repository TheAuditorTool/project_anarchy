"""
Resource Leak Scenario
Phase 15: Flow Analysis Scenarios
ERROR 262: File resources not closed on all execution paths
Tests TheAuditor's ability to detect resource leaks through control-flow analysis
"""

import os
import socket
import sqlite3
import tempfile

# Make the leak path active
condition = True

# ERROR 262: File not closed on early return path
def leaky_function(filename: str):
    """Function where file is not closed on all paths."""
    f = open(filename, 'r')
    
    # Early return without closing file - LEAK!
    if condition:
        data = f.read(100)
        return data  # File handle leaks here!
    
    # This close is never reached when condition is True
    data = f.read()
    f.close()
    return data

def leaky_exception_handling(filename: str):
    """File leak due to poor exception handling."""
    f = open(filename, 'w')
    
    try:
        f.write("Some data")
        # Potential exception here
        result = 10 / 0  # Will raise ZeroDivisionError
        f.write("More data")
    except ZeroDivisionError:
        # Forgot to close file in exception path!
        return None
    
    # Close only happens in success path
    f.close()
    return True

def multiple_resource_leaks():
    """Multiple resources that can leak."""
    # Open multiple resources
    file1 = open('temp1.txt', 'w')
    file2 = open('temp2.txt', 'w')
    file3 = open('temp3.txt', 'w')
    
    # Complex logic with multiple exit points
    if condition:
        file1.write("data")
        # Leak: file2 and file3 not closed
        file1.close()
        return "early exit"
    
    file1.write("data")
    file2.write("data")
    
    if not condition:
        # Leak: file3 not closed
        file1.close()
        file2.close()
        return "mid exit"
    
    # Only this path closes all files
    file1.close()
    file2.close()
    file3.close()
    return "complete"

def database_connection_leak():
    """Database connection not closed properly."""
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    cursor.execute('CREATE TABLE users (id INTEGER, name TEXT)')
    
    # Early return without closing connection
    if condition:
        cursor.execute('SELECT * FROM users')
        results = cursor.fetchall()
        # Connection and cursor leak here!
        return results
    
    cursor.close()
    conn.close()
    return []

def socket_resource_leak(host: str, port: int):
    """Socket not closed on error paths."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        sock.connect((host, port))
        sock.send(b"Hello")
        response = sock.recv(1024)
        
        if not response:
            # Socket leaks on this return path
            return None
            
    except socket.error:
        # Socket leaks on exception
        return None
    
    # Only closed on success path
    sock.close()
    return response

def nested_resource_leaks():
    """Nested resources with complex leak patterns."""
    outer_file = open('outer.txt', 'w')
    
    for i in range(10):
        inner_file = open(f'inner_{i}.txt', 'w')
        
        if i == 5:
            # Both files leak here
            return "leaked at 5"
        
        if i == 7:
            inner_file.close()
            # Outer file leaks here
            return "leaked outer at 7"
        
        inner_file.write(f"Data {i}")
        # Inner file leaks if not i == 7
        if i != 7:
            pass  # Forgot to close inner_file
    
    outer_file.close()
    return "completed"

class ResourceManager:
    """Class that doesn't properly manage resources."""
    
    def __init__(self):
        # Resource opened in __init__
        self.file = open('class_resource.txt', 'w')
        self.connections = []
    
    def add_connection(self):
        """Add connection without tracking properly."""
        conn = sqlite3.connect(':memory:')
        self.connections.append(conn)
        # No cleanup mechanism!
    
    def process(self):
        """Process without cleanup."""
        self.file.write("Processing")
        
        if condition:
            # Object abandoned with open file
            return "abandoned"
        
        return "processed"
    
    # Missing __del__ or close method to clean up resources!

def generator_resource_leak():
    """Generator that leaks resources."""
    def leaky_generator():
        f = open('generator.txt', 'r')
        
        for line in f:
            if 'stop' in line:
                # Generator exits without closing file
                return
            yield line
        
        # Only closed if generator completes normally
        f.close()
    
    gen = leaky_generator()
    # If generator is abandoned, file leaks
    return gen

def context_manager_misuse():
    """Incorrect context manager usage leading to leaks."""
    # Storing file handle outside context manager
    f = None
    
    with open('context.txt', 'w') as file:
        f = file  # Capturing reference
        f.write("Data")
    
    # File is "closed" but we still have reference
    # This is bad practice and can lead to issues
    try:
        f.write("More data")  # File is closed!
    except ValueError:
        pass
    
    return f  # Returning closed file handle

def demonstrate_leaks():
    """Demonstrate various resource leak scenarios."""
    print("Demonstrating resource leaks...")
    
    # Create temporary files for testing
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
        tmp.write("Test data for leak detection")
        temp_filename = tmp.name
    
    # 1. Basic file leak
    try:
        data = leaky_function(temp_filename)
        print(f"1. Leaked file handle in leaky_function")
    except:
        pass
    
    # 2. Exception handling leak
    try:
        result = leaky_exception_handling(temp_filename)
        print(f"2. Leaked file handle in exception path")
    except:
        pass
    
    # 3. Database leak
    try:
        results = database_connection_leak()
        print(f"3. Leaked database connection")
    except:
        pass
    
    # 4. Socket leak
    try:
        response = socket_resource_leak('localhost', 8080)
        print(f"4. Leaked socket connection")
    except:
        pass
    
    # 5. Class-based leak
    try:
        manager = ResourceManager()
        manager.process()
        print(f"5. Leaked resources in class")
    except:
        pass
    
    # Clean up
    os.unlink(temp_filename)

if __name__ == "__main__":
    print("Testing resource leak scenarios...")
    print("=" * 50)
    
    demonstrate_leaks()
    
    print("\nResource leak testing complete - leaks are intentional!")