/**
 * Distributed Lock Service with Deadlock and Livelock Issues
 * DO NOT SHIP: Can cause system-wide deadlocks and resource starvation
 */

interface Lock {
    id: string;
    resource: string;
    owner: string;
    acquiredAt: number;
    ttl?: number;
    waitQueue?: string[];
}

// Global lock registry - single point of failure
const locks = new Map<string, Lock>();
const lockWaiters = new Map<string, Set<string>>();
const ownerLocks = new Map<string, Set<string>>();

export const distributedLockService = {
    /**
     * ERROR 388: DISTRIBUTED DEADLOCK - Circular Lock Dependencies
     * 
     * This implementation allows processes to acquire multiple locks
     * in different orders, creating deadlock scenarios.
     * 
     * Example deadlock:
     * - Process A: locks Resource1, waits for Resource2
     * - Process B: locks Resource2, waits for Resource1
     * Result: Both processes wait forever
     * 
     * Problems:
     * - No lock ordering protocol
     * - No deadlock detection
     * - No timeout on lock acquisition
     * - No deadlock recovery
     * - Can bring down entire system
     */
    acquireLock: async (resource: string, owner: string): Promise<boolean> => {
        const existingLock = locks.get(resource);
        
        if (existingLock && existingLock.owner !== owner) {
            // ERROR 388: Infinite wait without timeout
            // Add to wait queue without checking for circular dependencies
            
            let waiters = lockWaiters.get(resource);
            if (!waiters) {
                waiters = new Set();
                lockWaiters.set(resource, waiters);
            }
            waiters.add(owner);
            
            // Check if this creates a deadlock (but don't prevent it!)
            if (detectDeadlock(owner, resource)) {
                console.log(`DEADLOCK DETECTED: ${owner} waiting for ${resource}`);
                // But we still let it happen!
            }
            
            // Busy wait - burns CPU
            while (locks.get(resource)?.owner !== owner) {
                await new Promise(resolve => setTimeout(resolve, 10));
                
                // No timeout - waits forever
                // No yield mechanism - starves other processes
            }
        }
        
        // Acquire the lock
        const lock: Lock = {
            id: Math.random().toString(36),
            resource,
            owner,
            acquiredAt: Date.now(),
            // No TTL - lock can be held forever
        };
        
        locks.set(resource, lock);
        
        // Track owner's locks for deadlock detection
        let ownerLockSet = ownerLocks.get(owner);
        if (!ownerLockSet) {
            ownerLockSet = new Set();
            ownerLocks.set(owner, ownerLockSet);
        }
        ownerLockSet.add(resource);
        
        return true;
    },
    
    /**
     * ERROR 389: LIVELOCK PATTERN - Processes Keep Yielding to Each Other
     * 
     * This "polite" locking mechanism causes livelock where processes
     * keep releasing locks for others, but no one makes progress.
     * 
     * Problems:
     * - Constant lock release/reacquire
     * - No priority mechanism
     * - Starvation of all processes
     * - High CPU usage with no progress
     * - System appears active but does nothing
     */
    acquireLockPolite: async (resource: string, owner: string): Promise<boolean> => {
        let attempts = 0;
        
        while (attempts < 1000) { // Will retry many times
            const existingLock = locks.get(resource);
            
            if (!existingLock) {
                // Try to acquire
                const lock: Lock = {
                    id: Math.random().toString(36),
                    resource,
                    owner,
                    acquiredAt: Date.now(),
                    ttl: 100, // Very short TTL
                };
                
                locks.set(resource, lock);
                
                // ERROR 389: Immediately check if someone else wants it
                const waiters = lockWaiters.get(resource);
                if (waiters && waiters.size > 0) {
                    // Be "polite" and release immediately
                    locks.delete(resource);
                    
                    // Wait a bit
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                    
                    attempts++;
                    continue; // Try again (livelock!)
                }
                
                return true;
            } else {
                // Someone has it, be polite and wait
                await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                attempts++;
                
                // If we own it but someone else wants it, release it (too polite!)
                if (existingLock.owner === owner) {
                    const waiters = lockWaiters.get(resource);
                    if (waiters && waiters.size > 0) {
                        locks.delete(resource);
                        // Now we'll compete again (livelock!)
                    }
                }
            }
        }
        
        return false; // Failed after many attempts
    },
    
    /**
     * Two-phase locking with rollback issues
     */
    acquireMultipleLocks: async (resources: string[], owner: string): Promise<boolean> => {
        const acquired: string[] = [];
        
        try {
            // Try to acquire all locks (no ordering!)
            for (const resource of resources) {
                // This can cause deadlock if another process acquires in different order
                const success = await distributedLockService.acquireLock(resource, owner);
                
                if (success) {
                    acquired.push(resource);
                } else {
                    // Partial acquisition - system in inconsistent state
                    throw new Error(`Failed to acquire ${resource}`);
                }
            }
            
            return true;
        } catch (error) {
            // Rollback - but might fail!
            for (const resource of acquired) {
                // Release might fail, leaving orphaned locks
                distributedLockService.releaseLock(resource, owner);
            }
            
            return false;
        }
    },
    
    /**
     * Release lock without verification
     */
    releaseLock: (resource: string, owner: string): boolean => {
        const lock = locks.get(resource);
        
        // No ownership verification!
        // Any process can release any lock (chaos!)
        locks.delete(resource);
        
        // Clean up owner tracking
        const ownerLockSet = ownerLocks.get(owner);
        if (ownerLockSet) {
            ownerLockSet.delete(resource);
        }
        
        // Wake up one waiter (might cause thundering herd)
        const waiters = lockWaiters.get(resource);
        if (waiters && waiters.size > 0) {
            const firstWaiter = waiters.values().next().value;
            waiters.delete(firstWaiter);
            
            // Automatically give lock to waiter (might not want it anymore!)
            const newLock: Lock = {
                id: Math.random().toString(36),
                resource,
                owner: firstWaiter,
                acquiredAt: Date.now(),
            };
            locks.set(resource, newLock);
        }
        
        return true;
    },
    
    /**
     * Orphaned lock cleanup (makes things worse)
     */
    cleanupOrphanedLocks: async () => {
        const now = Date.now();
        
        for (const [resource, lock] of locks.entries()) {
            // Arbitrarily remove "old" locks
            if (now - lock.acquiredAt > 60000) { // 1 minute
                // Force release without notifying owner!
                locks.delete(resource);
                // Owner still thinks they have the lock (split-brain)
            }
        }
    }
};

/**
 * Deadlock detection that detects but doesn't prevent
 */
function detectDeadlock(owner: string, requestedResource: string): boolean {
    const visited = new Set<string>();
    const stack = [owner];
    
    while (stack.length > 0) {
        const current = stack.pop()!;
        
        if (visited.has(current)) {
            return true; // Cycle detected!
        }
        
        visited.add(current);
        
        // Check what this owner is waiting for
        for (const [resource, waiters] of lockWaiters.entries()) {
            if (waiters.has(current)) {
                const lockOwner = locks.get(resource)?.owner;
                if (lockOwner) {
                    stack.push(lockOwner);
                }
            }
        }
    }
    
    return false;
}

/**
 * Lock statistics showing the chaos
 */
export const lockStats = {
    getStats: () => {
        const stats = {
            activeLocks: locks.size,
            waitingProcesses: Array.from(lockWaiters.values())
                .reduce((sum, set) => sum + set.size, 0),
            potentialDeadlocks: 0,
            orphanedLocks: 0,
        };
        
        // Count potential deadlocks
        for (const [owner] of ownerLocks) {
            for (const [resource] of locks) {
                if (detectDeadlock(owner, resource)) {
                    stats.potentialDeadlocks++;
                }
            }
        }
        
        // Count orphaned locks
        const now = Date.now();
        for (const lock of locks.values()) {
            if (now - lock.acquiredAt > 60000) {
                stats.orphanedLocks++;
            }
        }
        
        return stats;
    }
};

/**
 * The correct implementation would:
 * 1. Use a distributed lock manager (Redis, Zookeeper, etcd)
 * 2. Implement lock ordering to prevent deadlocks
 * 3. Add lock timeouts and automatic release
 * 4. Use lock-free algorithms where possible
 * 5. Implement deadlock detection and recovery
 * 6. Add lock priority and fairness
 * 7. Use optimistic locking for read-heavy workloads
 * 8. Implement proper lock ownership verification
 */