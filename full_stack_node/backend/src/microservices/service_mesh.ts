/**
 * Service Mesh Communication with Chatty Anti-Patterns
 * DO NOT SHIP: Creates service communication storms
 */

interface ServiceCall {
    service: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    headers?: Record<string, string>;
}

interface ServiceResponse {
    status: number;
    data: any;
    headers: Record<string, string>;
    latency: number;
}

// Track all service calls (for demonstrating the problem)
const callMetrics = {
    totalCalls: 0,
    callsByService: new Map<string, number>(),
    callsByEndpoint: new Map<string, number>(),
    totalLatency: 0,
    failedCalls: 0
};

/**
 * ERROR 400: CHATTY SERVICE CALLS - Microservice Communication Storm
 * 
 * This implementation makes many small, granular service calls instead
 * of batching or aggregating requests, creating a communication storm
 * that overwhelms the service mesh.
 * 
 * Problems:
 * - No request batching
 * - No query aggregation
 * - Excessive round trips
 * - Network saturation
 * - Service mesh overload
 * 
 * Real-world impact:
 * - 100x more network calls than necessary
 * - Latency multiplied by number of calls
 * - Service mesh proxy CPU at 100%
 * - Network bandwidth exhaustion
 * - Cascading timeouts across services
 */
export const chattyServiceClient = {
    /**
     * Get user with all details - makes MANY separate calls
     */
    getUserComplete: async (userId: string) => {
        const calls: ServiceResponse[] = [];
        
        // ERROR 400: Separate call for basic user info
        const userCall = await makeServiceCall({
            service: 'user-service',
            endpoint: `/users/${userId}`,
            method: 'GET'
        });
        calls.push(userCall);
        
        // ERROR 400: Separate call for user profile
        const profileCall = await makeServiceCall({
            service: 'user-service',
            endpoint: `/users/${userId}/profile`,
            method: 'GET'
        });
        calls.push(profileCall);
        
        // ERROR 400: Separate call for user settings
        const settingsCall = await makeServiceCall({
            service: 'user-service',
            endpoint: `/users/${userId}/settings`,
            method: 'GET'
        });
        calls.push(settingsCall);
        
        // ERROR 400: Separate call for user preferences
        const prefsCall = await makeServiceCall({
            service: 'user-service',
            endpoint: `/users/${userId}/preferences`,
            method: 'GET'
        });
        calls.push(prefsCall);
        
        // ERROR 400: Separate call for user permissions
        const permsCall = await makeServiceCall({
            service: 'auth-service',
            endpoint: `/permissions/${userId}`,
            method: 'GET'
        });
        calls.push(permsCall);
        
        // ERROR 400: Separate call for user roles
        const rolesCall = await makeServiceCall({
            service: 'auth-service',
            endpoint: `/roles/${userId}`,
            method: 'GET'
        });
        calls.push(rolesCall);
        
        // ERROR 400: Separate call for user groups
        const groupsCall = await makeServiceCall({
            service: 'auth-service',
            endpoint: `/groups/${userId}`,
            method: 'GET'
        });
        calls.push(groupsCall);
        
        // ERROR 400: Separate call for user notifications
        const notifCall = await makeServiceCall({
            service: 'notification-service',
            endpoint: `/users/${userId}/settings`,
            method: 'GET'
        });
        calls.push(notifCall);
        
        // ERROR 400: Separate call for user billing
        const billingCall = await makeServiceCall({
            service: 'billing-service',
            endpoint: `/users/${userId}/account`,
            method: 'GET'
        });
        calls.push(billingCall);
        
        // ERROR 400: Separate call for user subscription
        const subCall = await makeServiceCall({
            service: 'billing-service',
            endpoint: `/users/${userId}/subscription`,
            method: 'GET'
        });
        calls.push(subCall);
        
        // Aggregate all the data (after 10 separate calls!)
        return {
            user: userCall.data,
            profile: profileCall.data,
            settings: settingsCall.data,
            preferences: prefsCall.data,
            permissions: permsCall.data,
            roles: rolesCall.data,
            groups: groupsCall.data,
            notifications: notifCall.data,
            billing: billingCall.data,
            subscription: subCall.data,
            totalCalls: calls.length,
            totalLatency: calls.reduce((sum, c) => sum + c.latency, 0)
        };
    },
    
    /**
     * Update user - makes separate calls for each field
     */
    updateUser: async (userId: string, updates: any) => {
        const calls: Promise<ServiceResponse>[] = [];
        
        // ERROR 400: Separate call for EACH field update
        if (updates.name) {
            calls.push(makeServiceCall({
                service: 'user-service',
                endpoint: `/users/${userId}/name`,
                method: 'PUT',
                payload: { name: updates.name }
            }));
        }
        
        if (updates.email) {
            calls.push(makeServiceCall({
                service: 'user-service',
                endpoint: `/users/${userId}/email`,
                method: 'PUT',
                payload: { email: updates.email }
            }));
        }
        
        if (updates.phone) {
            calls.push(makeServiceCall({
                service: 'user-service',
                endpoint: `/users/${userId}/phone`,
                method: 'PUT',
                payload: { phone: updates.phone }
            }));
        }
        
        if (updates.address) {
            calls.push(makeServiceCall({
                service: 'user-service',
                endpoint: `/users/${userId}/address`,
                method: 'PUT',
                payload: { address: updates.address }
            }));
        }
        
        if (updates.bio) {
            calls.push(makeServiceCall({
                service: 'user-service',
                endpoint: `/users/${userId}/bio`,
                method: 'PUT',
                payload: { bio: updates.bio }
            }));
        }
        
        // Wait for all calls (could be 5+ parallel calls!)
        const results = await Promise.all(calls);
        
        return {
            success: results.every(r => r.status === 200),
            callsMade: results.length,
            totalLatency: results.reduce((sum, r) => sum + r.latency, 0)
        };
    },
    
    /**
     * Get list of items with details - N+1 service calls!
     */
    getItemsWithDetails: async (itemIds: string[]) => {
        const items = [];
        
        // ERROR 400: Loop making individual calls
        for (const itemId of itemIds) {
            // Call for item
            const itemCall = await makeServiceCall({
                service: 'inventory-service',
                endpoint: `/items/${itemId}`,
                method: 'GET'
            });
            
            // Call for item stock
            const stockCall = await makeServiceCall({
                service: 'inventory-service',
                endpoint: `/items/${itemId}/stock`,
                method: 'GET'
            });
            
            // Call for item price
            const priceCall = await makeServiceCall({
                service: 'pricing-service',
                endpoint: `/items/${itemId}/price`,
                method: 'GET'
            });
            
            // Call for item reviews
            const reviewCall = await makeServiceCall({
                service: 'review-service',
                endpoint: `/items/${itemId}/summary`,
                method: 'GET'
            });
            
            items.push({
                ...itemCall.data,
                stock: stockCall.data,
                price: priceCall.data,
                reviews: reviewCall.data
            });
        }
        
        // If itemIds has 100 items, this makes 400 service calls!
        return items;
    }
};

/**
 * ERROR 401: NO REQUEST COALESCING - Duplicate Requests Galore
 * 
 * This implementation doesn't coalesce or deduplicate requests,
 * leading to the same data being fetched multiple times.
 * 
 * Problems:
 * - No request deduplication
 * - No caching between calls
 * - No request coalescing
 * - Redundant data fetching
 * - Wasted bandwidth
 */
export const duplicateRequestClient = {
    /**
     * Build dashboard - fetches same data multiple times
     */
    buildDashboard: async (userId: string) => {
        const sections = [];
        
        // ERROR 401: Each section fetches user data independently
        
        // Header section
        const headerData = await buildHeaderSection(userId);
        sections.push(headerData);
        
        // Profile section
        const profileData = await buildProfileSection(userId);
        sections.push(profileData);
        
        // Activity section
        const activityData = await buildActivitySection(userId);
        sections.push(activityData);
        
        // Stats section
        const statsData = await buildStatsSection(userId);
        sections.push(statsData);
        
        // Each section made the SAME user data calls!
        return {
            sections,
            metrics: callMetrics
        };
    },
    
    /**
     * Parallel requests without deduplication
     */
    parallelFetch: async (userIds: string[]) => {
        // ERROR 401: No deduplication of duplicate IDs
        const promises = userIds.map(id => 
            makeServiceCall({
                service: 'user-service',
                endpoint: `/users/${id}`,
                method: 'GET'
            })
        );
        
        // If userIds = [1, 2, 1, 3, 1, 2]
        // Makes 6 calls instead of 3!
        return Promise.all(promises);
    }
};

/**
 * Helper functions that demonstrate the problems
 */
async function buildHeaderSection(userId: string) {
    // ERROR 401: Fetches user data
    const user = await makeServiceCall({
        service: 'user-service',
        endpoint: `/users/${userId}`,
        method: 'GET'
    });
    
    const notifications = await makeServiceCall({
        service: 'notification-service',
        endpoint: `/users/${userId}/unread`,
        method: 'GET'
    });
    
    return { user: user.data, notifications: notifications.data };
}

async function buildProfileSection(userId: string) {
    // ERROR 401: Fetches user data AGAIN
    const user = await makeServiceCall({
        service: 'user-service',
        endpoint: `/users/${userId}`,
        method: 'GET'
    });
    
    const profile = await makeServiceCall({
        service: 'user-service',
        endpoint: `/users/${userId}/profile`,
        method: 'GET'
    });
    
    return { user: user.data, profile: profile.data };
}

async function buildActivitySection(userId: string) {
    // ERROR 401: Fetches user data YET AGAIN
    const user = await makeServiceCall({
        service: 'user-service',
        endpoint: `/users/${userId}`,
        method: 'GET'
    });
    
    const activity = await makeServiceCall({
        service: 'activity-service',
        endpoint: `/users/${userId}/recent`,
        method: 'GET'
    });
    
    return { user: user.data, activity: activity.data };
}

async function buildStatsSection(userId: string) {
    // ERROR 401: Fetches user data ONCE MORE
    const user = await makeServiceCall({
        service: 'user-service',
        endpoint: `/users/${userId}`,
        method: 'GET'
    });
    
    const stats = await makeServiceCall({
        service: 'analytics-service',
        endpoint: `/users/${userId}/stats`,
        method: 'GET'
    });
    
    return { user: user.data, stats: stats.data };
}

/**
 * Mock service call implementation
 */
async function makeServiceCall(call: ServiceCall): Promise<ServiceResponse> {
    // Track metrics
    callMetrics.totalCalls++;
    callMetrics.callsByService.set(
        call.service,
        (callMetrics.callsByService.get(call.service) || 0) + 1
    );
    callMetrics.callsByEndpoint.set(
        call.endpoint,
        (callMetrics.callsByEndpoint.get(call.endpoint) || 0) + 1
    );
    
    // Simulate network latency
    const latency = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, latency));
    
    callMetrics.totalLatency += latency;
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
        callMetrics.failedCalls++;
        throw new Error(`Service call failed: ${call.service}${call.endpoint}`);
    }
    
    return {
        status: 200,
        data: { mock: 'data', service: call.service, endpoint: call.endpoint },
        headers: { 'x-service': call.service },
        latency
    };
}

/**
 * Service mesh monitoring
 */
export const serviceMeshMonitor = {
    getMetrics: () => ({
        ...callMetrics,
        avgLatency: callMetrics.totalLatency / callMetrics.totalCalls,
        failureRate: (callMetrics.failedCalls / callMetrics.totalCalls * 100).toFixed(2) + '%',
        topServices: Array.from(callMetrics.callsByService.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5),
        topEndpoints: Array.from(callMetrics.callsByEndpoint.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
    }),
    
    reset: () => {
        callMetrics.totalCalls = 0;
        callMetrics.callsByService.clear();
        callMetrics.callsByEndpoint.clear();
        callMetrics.totalLatency = 0;
        callMetrics.failedCalls = 0;
    },
    
    simulateTraffic: async () => {
        // Simulate typical usage patterns that expose the problems
        const results = [];
        
        // Chatty service calls
        for (let i = 0; i < 10; i++) {
            try {
                const result = await chattyServiceClient.getUserComplete(`user${i}`);
                results.push({
                    type: 'getUserComplete',
                    userId: `user${i}`,
                    callCount: result.totalCalls,
                    latency: result.totalLatency
                });
            } catch (error) {
                results.push({ type: 'getUserComplete', error: true });
            }
        }
        
        // Duplicate requests
        const duplicateIds = ['user1', 'user2', 'user1', 'user3', 'user1'];
        await duplicateRequestClient.parallelFetch(duplicateIds);
        
        // Dashboard with redundant calls
        await duplicateRequestClient.buildDashboard('user1');
        
        return {
            results,
            finalMetrics: serviceMeshMonitor.getMetrics()
        };
    }
};

/**
 * Request aggregator that SHOULD be used but isn't
 */
export const properAggregator = {
    /**
     * This is how it SHOULD be done - single aggregated call
     */
    getUserComplete: async (userId: string) => {
        // One call with all needed fields
        return makeServiceCall({
            service: 'api-gateway',
            endpoint: `/users/${userId}/complete`,
            method: 'GET'
        });
    },
    
    /**
     * Batch request handler
     */
    batchGetUsers: async (userIds: string[]) => {
        // Deduplicate
        const uniqueIds = [...new Set(userIds)];
        
        // Single batch call
        return makeServiceCall({
            service: 'user-service',
            endpoint: '/users/batch',
            method: 'POST',
            payload: { ids: uniqueIds }
        });
    }
};

/**
 * The correct implementation would:
 * 1. Use request batching and aggregation
 * 2. Implement request coalescing and deduplication
 * 3. Use caching layers between services
 * 4. Implement GraphQL or similar for field selection
 * 5. Use service mesh features like retries and circuit breakers
 * 6. Implement request/response compression
 * 7. Use async messaging for non-critical updates
 * 8. Implement proper service boundaries
 * 9. Use CDN and edge caching where appropriate
 * 10. Monitor and alert on excessive service calls
 */