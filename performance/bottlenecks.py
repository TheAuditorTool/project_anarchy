"""
Performance Bottlenecks
Phase 16: Performance Anti-Patterns
Contains functions with well-known performance problems for TheAuditor validation
Errors 263-265
"""

import time
from typing import List, Any

# ERROR 263: O(n²) complexity algorithm
def n_squared_algorithm(items: List[Any]) -> int:
    """Nested loop creating O(n²) time complexity."""
    result = 0
    n = len(items)
    
    # Outer loop: O(n)
    for i in range(n):
        # Inner loop: O(n) - creates O(n²) total
        for j in range(n):
            # Dummy process operation
            result += process(items[i], items[j])
            
            # Even worse: triple nested loop section
            if i == j:
                for k in range(n):
                    result += process(items[k], items[i])
    
    return result

def process(i: Any, j: Any) -> int:
    """Dummy processing function."""
    # Simulate some work
    return hash(str(i) + str(j)) % 100

# ERROR 264: Exponential time complexity (recursive fibonacci)
def recursive_fibonacci(n: int) -> int:
    """Highly inefficient recursive Fibonacci - O(2^n) complexity."""
    # Base cases
    if n <= 1:
        return n
    
    # Exponential recursion - recalculates same values many times
    return recursive_fibonacci(n - 1) + recursive_fibonacci(n - 2)

# ERROR 265: Inefficient string concatenation in loop
def string_concatenation_loop(n: int) -> str:
    """Building string with += in loop - O(n²) in Python."""
    result = ""
    
    # Each concatenation creates a new string object
    # Total complexity: O(n²) for n concatenations
    for i in range(n):
        # This is O(n) operation each time (string copy)
        result += f"Item {i}, "
        
        # Even worse: nested string building
        if i % 10 == 0:
            temp = ""
            for j in range(100):
                temp += str(j)  # Another O(n²) pattern
            result += temp
    
    return result

# Additional performance anti-patterns

def bubble_sort(arr: List[int]) -> List[int]:
    """Inefficient bubble sort - O(n²)."""
    n = len(arr)
    arr = arr.copy()
    
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    
    return arr

def unnecessary_list_operations(data: List[int]) -> List[int]:
    """Multiple inefficient list operations."""
    result = []
    
    # Inefficient: using append in loop instead of list comprehension
    for item in data:
        result.append(item * 2)
    
    # Inefficient: repeatedly checking membership in list (O(n) each)
    filtered = []
    for item in result:
        if item not in filtered:  # O(n) operation
            filtered.append(item)
    
    # Inefficient: multiple passes when one would suffice
    squared = []
    for item in filtered:
        squared.append(item ** 2)
    
    sorted_result = []
    for item in squared:
        sorted_result.append(item)
    
    # Inefficient sort (should use built-in)
    return bubble_sort(sorted_result)

def inefficient_dictionary_operations(n: int) -> dict:
    """Inefficient dictionary building and access."""
    result = {}
    
    # Building dictionary with repeated key checks
    for i in range(n):
        key = f"key_{i}"
        
        # Inefficient: checking and setting separately
        if key not in result:
            result[key] = []
        
        # Inefficient: repeated dictionary access
        for j in range(100):
            result[key].append(j)
            # Multiple lookups of same key
            if len(result[key]) > 50:
                result[key] = result[key][:50]
    
    # Inefficient: iterating over keys then accessing values
    for key in result.keys():
        value = result[key]  # Could use .items()
        result[key] = sum(value)
    
    return result

def memory_intensive_operation(n: int) -> List[List[int]]:
    """Creates unnecessary large data structures."""
    # Creating huge matrix when not needed
    matrix = [[0 for _ in range(n)] for _ in range(n)]
    
    # Filling matrix inefficiently
    for i in range(n):
        for j in range(n):
            # Creating temporary lists repeatedly
            temp_list = list(range(1000))
            matrix[i][j] = sum(temp_list)
    
    # Creating multiple copies
    copy1 = [row[:] for row in matrix]
    copy2 = [row[:] for row in copy1]
    copy3 = [row[:] for row in copy2]
    
    return copy3

def inefficient_file_operations(filename: str, data: List[str]):
    """Multiple inefficient file operations."""
    # Opening and closing file repeatedly
    for line in data:
        with open(filename, 'a') as f:
            f.write(line + '\n')
    
    # Reading entire file multiple times
    for _ in range(10):
        with open(filename, 'r') as f:
            content = f.read()
            lines = content.split('\n')
            # Process lines inefficiently
            for line in lines:
                if line:
                    _ = line.upper().lower().strip()

def polynomial_complexity(n: int) -> int:
    """O(n³) algorithm - polynomial time complexity."""
    result = 0
    
    # Triple nested loops - O(n³)
    for i in range(n):
        for j in range(n):
            for k in range(n):
                # Even worse: another loop inside
                for m in range(10):
                    result += i * j * k * m
    
    return result

def factorial_complexity(n: int) -> int:
    """Recursive factorial with unnecessary recalculation."""
    if n <= 1:
        return 1
    
    # Recalculating factorial multiple times
    result = n * factorial_complexity(n - 1)
    
    # Unnecessary: recalculating for validation
    check = 1
    for i in range(1, n + 1):
        check *= i
    
    if result != check:
        # This should never happen but adds complexity
        return factorial_complexity(n - 1) * n
    
    return result

class InefficientCache:
    """Cache implementation with performance issues."""
    
    def __init__(self):
        self.cache = []  # Using list instead of dict!
    
    def get(self, key):
        """O(n) lookup in list-based cache."""
        for item in self.cache:
            if item[0] == key:
                return item[1]
        return None
    
    def set(self, key, value):
        """O(n) check before insert."""
        # Check if exists (O(n))
        for i, item in enumerate(self.cache):
            if item[0] == key:
                self.cache[i] = (key, value)
                return
        
        # Append new item
        self.cache.append((key, value))
        
        # "Clean up" by recreating list (inefficient)
        if len(self.cache) > 100:
            self.cache = self.cache[-50:]

def benchmark_bottlenecks():
    """Benchmark the performance bottlenecks."""
    print("Benchmarking performance bottlenecks...")
    print("=" * 50)
    
    # Test O(n²) algorithm
    start = time.time()
    result = n_squared_algorithm(list(range(100)))
    print(f"O(n²) algorithm (n=100): {time.time() - start:.4f}s")
    
    # Test exponential fibonacci
    start = time.time()
    result = recursive_fibonacci(30)
    print(f"Recursive Fibonacci (n=30): {time.time() - start:.4f}s")
    
    # Test string concatenation
    start = time.time()
    result = string_concatenation_loop(1000)
    print(f"String concatenation (n=1000): {time.time() - start:.4f}s")
    
    # Test polynomial complexity
    start = time.time()
    result = polynomial_complexity(50)
    print(f"O(n³) algorithm (n=50): {time.time() - start:.4f}s")
    
    print("\nAll bottlenecks are intentional for TheAuditor testing!")

if __name__ == "__main__":
    benchmark_bottlenecks()