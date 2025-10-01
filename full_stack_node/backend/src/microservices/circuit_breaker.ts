/**
 * Circuit Breaker Implementation with Critical Flaws
 * DO NOT SHIP: Circuit breaker that makes service reliability worse
 */

interface CircuitState {
    isOpen: boolean;
    failures: number;
    lastFailureTime: number;
    successCount: number;
    totalRequests: number;
}

// Circuit states for different services (all broken)
const circuits = new Map<string, CircuitState>();

export const circuitBreaker = {
    /**
     * ERROR 398: ALWAYS-OPEN CIRCUIT BREAKER - Service Never Recovers
     * 
     * This circuit breaker opens on the first failure and NEVER closes again,
     * permanently blocking access to services that had even a single transient error.
     * 
     * Problems:
     * - No automatic recovery mechanism
     * - No half-open state for testing
     * - Single failure triggers permanent block
     * - No manual reset capability
     * - No exponential backoff
     * 
     * Real-world impact:
     * - One network hiccup blocks service forever
     * - Services marked "dead" never recover
     * - Requires manual restart to fix
     * - Cascading permanent failures
     * - System becomes progressively more broken
     */
    call: async (serviceName: string, request: () => Promise<any>) => {
        let circuit = circuits.get(serviceName);
        
        if (!circuit) {
            circuit = {
                isOpen: false,
                failures: 0,
                lastFailureTime: 0,
                successCount: 0,
                totalRequests: 0
            };
            circuits.set(serviceName, circuit);
        }
        
        circuit.totalRequests++;
        
        // ERROR 398: Once open, never closes!
        if (circuit.isOpen) {
            // No check for recovery time
            // No half-open state
            // No retry logic
            throw new Error(`Circuit breaker OPEN for ${serviceName} - PERMANENTLY BLOCKED`);
        }
        
        try {
            const result = await request();
            circuit.successCount++;
            
            // Success doesn't reset failure count!
            // Circuit can still trip on old failures
            
            return result;
        } catch (error) {
            circuit.failures++;
            circuit.lastFailureTime = Date.now();
            
            // ERROR 398: Opens on FIRST failure!
            if (circuit.failures >= 1) { // Should be higher threshold
                circuit.isOpen = true;
                // No recovery mechanism - stays open forever!
                console.log(`Circuit breaker opened for ${serviceName} - NO RECOVERY POSSIBLE`);
            }
            
            throw error;
        }
    },
    
    /**
     * ERROR 399: PREMATURE CIRCUIT CLOSING - Opens and Closes Rapidly
     * 
     * This implementation has a "recovery" mechanism that closes the circuit
     * too quickly, causing rapid oscillation between open and closed states,
     * hammering already struggling services.
     * 
     * Problems:
     * - Closes too quickly after opening
     * - No gradual recovery testing
     * - Thundering herd on recovery
     * - No request rate limiting
     * - Amplifies problems instead of solving them
     */
    callWithBadRecovery: async (serviceName: string, request: () => Promise<any>) => {
        let circuit = circuits.get(serviceName);
        
        if (!circuit) {
            circuit = {
                isOpen: false,
                failures: 0,
                lastFailureTime: 0,
                successCount: 0,
                totalRequests: 0
            };
            circuits.set(serviceName, circuit);
        }
        
        // ERROR 399: Closes after just 100ms!
        if (circuit.isOpen && Date.now() - circuit.lastFailureTime > 100) {
            // Immediately fully closes (no half-open state)
            circuit.isOpen = false;
            circuit.failures = 0; // Reset everything
            console.log(`Circuit breaker FULLY CLOSED for ${serviceName} after 100ms`);
            // All waiting requests will now hammer the service!
        }
        
        if (circuit.isOpen) {
            throw new Error(`Circuit breaker open for ${serviceName}`);
        }
        
        try {
            const result = await request();
            return result;
        } catch (error) {
            circuit.failures++;
            circuit.lastFailureTime = Date.now();
            
            // Opens after 3 failures
            if (circuit.failures >= 3) {
                circuit.isOpen = true;
                // Will close again in just 100ms!
                // This creates rapid open/close cycles
            }
            
            throw error;
        }
    },
    
    /**
     * Broken circuit breaker statistics
     */
    getStats: (serviceName: string) => {
        const circuit = circuits.get(serviceName);
        if (!circuit) {
            return { status: 'unknown' };
        }
        
        return {
            status: circuit.isOpen ? 'PERMANENTLY BROKEN' : 'working',
            failures: circuit.failures,
            successCount: circuit.successCount,
            totalRequests: circuit.totalRequests,
            failureRate: circuit.totalRequests > 0 
                ? (circuit.failures / circuit.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            timeSinceLastFailure: circuit.lastFailureTime 
                ? `${Date.now() - circuit.lastFailureTime}ms ago`
                : 'never',
            willRecover: circuit.isOpen ? 'NEVER' : 'n/a'
        };
    },
    
    /**
     * No manual reset function!
     * Once a circuit is open, it stays open until service restart
     */
    
    /**
     * Cascade failure simulator
     */
    simulateCascade: async () => {
        // One service failure triggers all others
        const services = ['auth', 'payment', 'inventory', 'notification'];
        
        for (const service of services) {
            try {
                await circuitBreaker.call(service, async () => {
                    // Simulate random failures
                    if (Math.random() > 0.7) {
                        throw new Error(`${service} failed`);
                    }
                    return { success: true };
                });
            } catch (error) {
                console.log(`Service ${service} failed, circuit probably open forever`);
            }
        }
        
        // Check cascade effect
        const allStats = services.map(s => ({
            service: s,
            ...circuitBreaker.getStats(s)
        }));
        
        return allStats;
    }
};

/**
 * Broken fallback mechanism
 */
export const fallbackHandler = {
    /**
     * Fallback that makes things worse
     */
    handleWithFallback: async (
        serviceName: string,
        request: () => Promise<any>,
        fallback: () => Promise<any>
    ) => {
        try {
            return await circuitBreaker.call(serviceName, request);
        } catch (error) {
            // Fallback also uses circuit breaker (creates dependency loop!)
            return await circuitBreaker.call(`${serviceName}-fallback`, fallback);
            // If fallback fails once, it's also permanently broken!
        }
    },
    
    /**
     * Retry with exponential backoff (but implemented wrong)
     */
    retryWithBackoff: async (
        serviceName: string,
        request: () => Promise<any>,
        maxRetries: number = 3
    ) => {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await circuitBreaker.call(serviceName, request);
            } catch (error) {
                lastError = error;
                
                // "Exponential" backoff that's actually linear
                await new Promise(resolve => setTimeout(resolve, i * 100));
                // Should be Math.pow(2, i) * 100 or similar
            }
        }
        
        throw lastError;
    }
};

/**
 * Service health checker that lies
 */
export const healthChecker = {
    checkHealth: async (serviceName: string) => {
        const circuit = circuits.get(serviceName);
        
        if (!circuit) {
            // Reports healthy for unknown services!
            return { healthy: true, status: 'unknown service assumed healthy' };
        }
        
        if (circuit.isOpen) {
            // Reports unhealthy forever once opened
            return { 
                healthy: false, 
                status: 'permanently dead',
                message: 'Circuit breaker is open and will never recover'
            };
        }
        
        // Reports healthy even with high failure rate
        if (circuit.failures > circuit.successCount) {
            return { 
                healthy: true, // Wrong!
                status: 'healthy',
                message: `Only ${circuit.failures} failures vs ${circuit.successCount} successes`
            };
        }
        
        return { healthy: true, status: 'healthy' };
    },
    
    /**
     * Health check that triggers circuit breaker (makes service unhealthy)
     */
    activeHealthCheck: async (serviceName: string) => {
        // Health check itself can trip the circuit breaker!
        try {
            await circuitBreaker.call(serviceName, async () => {
                // Simulate health check
                const healthy = Math.random() > 0.3;
                if (!healthy) {
                    throw new Error('Health check failed');
                }
                return { healthy: true };
            });
            
            return { healthy: true };
        } catch (error) {
            // Health check failure opens circuit breaker!
            return { 
                healthy: false,
                message: 'Health check tripped the circuit breaker'
            };
        }
    }
};

/**
 * The correct implementation would:
 * 1. Implement three states: closed, open, half-open
 * 2. Use configurable thresholds and timeouts
 * 3. Implement gradual recovery with half-open state
 * 4. Add request rate limiting during recovery
 * 5. Use sliding window for failure tracking
 * 6. Implement manual reset capability
 * 7. Add proper exponential backoff
 * 8. Separate health checks from circuit breaker
 * 9. Implement bulkhead pattern for isolation
 * 10. Add metrics and monitoring
 */