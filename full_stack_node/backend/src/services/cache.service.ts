/**
 * Cache Service with Critical Coherency Issues
 * DO NOT SHIP: Causes stale reads, cache stampedes, and data inconsistency
 */

interface CacheEntry {
    key: string;
    value: any;
    timestamp: number;
    ttl?: number;
    version?: number;
}

// Multiple cache layers without synchronization
const l1Cache = new Map<string, CacheEntry>(); // In-memory
const l2Cache = new Map<string, CacheEntry>(); // Simulated Redis
const writeBuffer = new Map<string, any>();     // Write-behind buffer

export const cacheService = {
    /**
     * ERROR 386: CACHE-ASIDE WITH NO INVALIDATION - Stale Data Forever
     * 
     * This implementation uses cache-aside pattern but NEVER invalidates
     * the cache when the underlying data changes. Once cached, data stays
     * stale until TTL expires (if ever).
     * 
     * Problems:
     * - No cache invalidation on updates
     * - No version checking
     * - No event-based invalidation
     * - TTL might be infinite
     * - No cache warming strategy
     * 
     * Real-world impact:
     * - Users see outdated prices for hours/days
     * - Deleted items still appear available
     * - Security changes don't propagate
     * - Configuration updates ignored
     */
    get: async (key: string) => {
        // Check L1 cache first
        const l1Entry = l1Cache.get(key);
        if (l1Entry) {
            // ERROR 386: No staleness check, no version validation
            // Returns stale data indefinitely
            return l1Entry.value;
        }
        
        // Check L2 cache
        const l2Entry = l2Cache.get(key);
        if (l2Entry) {
            // Promote to L1 (spreading staleness)
            l1Cache.set(key, l2Entry);
            return l2Entry.value;
        }
        
        // Fetch from database (simulated)
        const dbValue = await fetchFromDatabase(key);
        
        // Cache with no expiration strategy
        const entry: CacheEntry = {
            key,
            value: dbValue,
            timestamp: Date.now(),
            // ttl: undefined, // No TTL = cached forever!
        };
        
        // Write to both caches
        l1Cache.set(key, entry);
        l2Cache.set(key, entry);
        
        return dbValue;
    },
    
    /**
     * ERROR 387: WRITE-BEHIND CACHE WITH DATA LOSS - Writes Can Disappear
     * 
     * This implementation buffers writes and flushes them later.
     * If the service crashes, all buffered writes are lost.
     * Even worse, reads might return data that was never persisted.
     * 
     * Problems:
     * - Buffered writes lost on crash
     * - No write-ahead log (WAL)
     * - No acknowledgment to client
     * - Reads see uncommitted data
     * - No transaction boundaries
     */
    set: async (key: string, value: any) => {
        // Update caches immediately (before persisting!)
        const entry: CacheEntry = {
            key,
            value,
            timestamp: Date.now(),
        };
        
        // ERROR 387: Update cache before database
        l1Cache.set(key, entry);
        l2Cache.set(key, entry);
        
        // Buffer the write (might never reach database)
        writeBuffer.set(key, value);
        
        // Async flush - fire and forget
        if (writeBuffer.size > 10) {
            // Flush in background without waiting
            setTimeout(() => {
                flushWriteBuffer(); // Might fail silently
            }, 0);
        }
        
        // Return success even though data isn't persisted
        return { success: true, cached: true, persisted: false };
    },
    
    /**
     * Cache stampede vulnerability - thundering herd problem
     */
    getWithStampede: async (key: string) => {
        const cached = l1Cache.get(key);
        
        // If expired, EVERYONE tries to refresh simultaneously
        if (!cached || isExpired(cached)) {
            // No lock, no single-flight pattern
            // 1000 concurrent requests = 1000 database calls
            const value = await fetchFromDatabase(key);
            
            const entry: CacheEntry = {
                key,
                value,
                timestamp: Date.now(),
                ttl: 60000, // 1 minute
            };
            
            l1Cache.set(key, entry);
            return value;
        }
        
        return cached.value;
    },
    
    /**
     * Inconsistent multi-cache updates
     */
    updateMultiple: async (updates: Record<string, any>) => {
        // Updates caches one by one - can fail partially
        for (const [key, value] of Object.entries(updates)) {
            const entry: CacheEntry = {
                key,
                value,
                timestamp: Date.now(),
            };
            
            // Might succeed in L1 but fail in L2
            l1Cache.set(key, entry);
            
            if (Math.random() > 0.1) { // Random failure
                l2Cache.set(key, entry);
            }
            // Now L1 and L2 are inconsistent!
        }
        
        return { updated: Object.keys(updates).length };
    },
    
    /**
     * Delete with inconsistent cache state
     */
    delete: async (key: string) => {
        // Delete from L1 only
        l1Cache.delete(key);
        
        // L2 still has the data! (cache inconsistency)
        // Next get() will restore deleted data from L2
        
        // Database delete is async and might fail
        setTimeout(() => {
            deleteFromDatabase(key);
        }, 1000);
        
        return { deleted: true };
    },
    
    /**
     * Cache warming with race conditions
     */
    warmCache: async (keys: string[]) => {
        // Parallel warming without coordination
        const promises = keys.map(async (key) => {
            const value = await fetchFromDatabase(key);
            
            // Multiple warmers might write different versions
            const entry: CacheEntry = {
                key,
                value,
                timestamp: Date.now(),
                version: Math.floor(Math.random() * 100), // Random version!
            };
            
            l1Cache.set(key, entry);
            l2Cache.set(key, entry);
        });
        
        // No error handling
        await Promise.all(promises);
        
        return { warmed: keys.length };
    }
};

// Helper functions
async function fetchFromDatabase(key: string): Promise<any> {
    // Simulate database fetch
    await new Promise(resolve => setTimeout(resolve, 100));
    return { 
        data: `db_value_${key}`, 
        version: Date.now(),
        metadata: 'fresh from database'
    };
}

async function deleteFromDatabase(key: string): Promise<void> {
    // Simulate database delete that might fail
    if (Math.random() > 0.5) {
        throw new Error('Database delete failed');
    }
}

function isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false; // No TTL = never expires (bad!)
    return Date.now() - entry.timestamp > entry.ttl;
}

async function flushWriteBuffer(): Promise<void> {
    // Flush writes to database - might fail and lose data
    const writes = Array.from(writeBuffer.entries());
    writeBuffer.clear(); // Clear before writing - data loss if write fails!
    
    for (const [key, value] of writes) {
        try {
            // Simulate database write
            await new Promise(resolve => setTimeout(resolve, 50));
            if (Math.random() > 0.8) {
                throw new Error('Write failed');
                // Write is lost forever - not returned to buffer
            }
        } catch (error) {
            console.error(`Lost write for key ${key}`);
            // No retry, no dead letter queue
        }
    }
}

/**
 * The correct implementation would:
 * 1. Use cache invalidation on updates
 * 2. Implement cache versioning
 * 3. Use distributed locks for cache refresh
 * 4. Implement write-through or write-around patterns
 * 5. Add circuit breakers for database calls
 * 6. Use cache tags for group invalidation
 * 7. Implement cache hierarchy properly
 * 8. Add monitoring for cache hit rates
 */