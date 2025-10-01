/**
 * Event Sourcing Service with Split-Brain and Consistency Issues
 * DO NOT SHIP: Can cause divergent state, lost events, and data corruption
 */

interface Event {
    id: string;
    aggregateId: string;
    type: string;
    payload: any;
    version: number;
    timestamp: number;
    nodeId?: string;
}

interface Snapshot {
    aggregateId: string;
    version: number;
    state: any;
    timestamp: number;
}

// Multiple event stores without consensus (split-brain waiting to happen)
const eventStore1: Event[] = [];
const eventStore2: Event[] = [];
const localEventBuffer: Event[] = [];

// Snapshots without consistency
const snapshots = new Map<string, Snapshot>();

// Aggregate versions tracked separately (will diverge)
const aggregateVersions = new Map<string, number>();

export const eventSourcingService = {
    /**
     * ERROR 390: SPLIT-BRAIN SCENARIO - Multiple Masters Writing Events
     * 
     * This implementation allows multiple nodes to write events
     * simultaneously without consensus, causing split-brain where
     * different parts of the system have different event histories.
     * 
     * Problems:
     * - No consensus protocol (Raft/Paxos)
     * - No vector clocks for ordering
     * - No conflict resolution
     * - Multiple sources of truth
     * - Divergent aggregate states
     * 
     * Real-world impact:
     * - Different nodes see different account balances
     * - Orders processed multiple times
     * - Inventory counts become meaningless
     * - Audit trail is contradictory
     * - System state is irrecoverable
     */
    appendEvent: async (aggregateId: string, type: string, payload: any) => {
        // Get current version (but which one is correct?)
        let version = aggregateVersions.get(aggregateId) || 0;
        version++;
        
        const event: Event = {
            id: Math.random().toString(36),
            aggregateId,
            type,
            payload,
            version, // ERROR 390: Version might conflict with other nodes
            timestamp: Date.now(),
            nodeId: Math.random() > 0.5 ? 'node1' : 'node2',
        };
        
        // Write to different stores based on "load balancing"
        if (Math.random() > 0.5) {
            eventStore1.push(event);
        } else {
            eventStore2.push(event);
        }
        // Now the stores diverge!
        
        // Also buffer locally (third source of truth!)
        localEventBuffer.push(event);
        
        // Update version tracker (but only locally)
        aggregateVersions.set(aggregateId, version);
        
        // Async replication that might fail
        setTimeout(() => {
            replicateEvent(event); // Fire and forget
        }, Math.random() * 1000);
        
        return { eventId: event.id, version };
    },
    
    /**
     * ERROR 391: EVENTUAL CONSISTENCY WITHOUT CONVERGENCE - State Never Converges
     * 
     * This implementation promises eventual consistency but lacks
     * the mechanisms to actually achieve it. Different replicas
     * will diverge and never converge to the same state.
     * 
     * Problems:
     * - No conflict resolution strategy
     * - No causal ordering
     * - No anti-entropy protocol
     * - No read repair
     * - Snapshots at different points
     */
    getAggregateState: async (aggregateId: string) => {
        // Check snapshot first (might be stale or wrong)
        const snapshot = snapshots.get(aggregateId);
        let state = snapshot?.state || {};
        let fromVersion = snapshot?.version || 0;
        
        // ERROR 391: Read from random event store
        const eventStore = Math.random() > 0.5 ? eventStore1 : eventStore2;
        
        // Apply events from snapshot version (but which events?)
        const events = eventStore
            .filter(e => e.aggregateId === aggregateId && e.version > fromVersion)
            .sort((a, b) => a.version - b.version); // Might have gaps!
        
        // Apply events to rebuild state
        for (const event of events) {
            // No validation that events are in correct order
            // No check for missing events
            state = applyEvent(state, event);
        }
        
        // Different nodes will return different states!
        return { 
            state, 
            version: events[events.length - 1]?.version || fromVersion,
            consistent: false // Always false!
        };
    },
    
    /**
     * Concurrent event appending without synchronization
     */
    appendConcurrentEvents: async (aggregateId: string, events: Array<{type: string, payload: any}>) => {
        // Multiple events appended in parallel without coordination
        const promises = events.map(async (evt) => {
            // Each gets its own version number - will conflict!
            return eventSourcingService.appendEvent(aggregateId, evt.type, evt.payload);
        });
        
        const results = await Promise.all(promises);
        
        // Results will have conflicting version numbers
        return results;
    },
    
    /**
     * Snapshot creation without synchronization
     */
    createSnapshot: async (aggregateId: string) => {
        // Get state from one store
        const state = await eventSourcingService.getAggregateState(aggregateId);
        
        // Create snapshot
        const snapshot: Snapshot = {
            aggregateId,
            version: state.version,
            state: state.state,
            timestamp: Date.now(),
        };
        
        // Save snapshot (but events might be added meanwhile)
        snapshots.set(aggregateId, snapshot);
        
        // Snapshot might already be outdated!
        return snapshot;
    },
    
    /**
     * Event replay with missing events
     */
    replayEvents: async (aggregateId: string, fromVersion: number = 0) => {
        // Combine events from all stores (will have duplicates and gaps)
        const allEvents = [...eventStore1, ...eventStore2, ...localEventBuffer]
            .filter(e => e.aggregateId === aggregateId && e.version > fromVersion);
        
        // Sort by version (but might have same version number!)
        allEvents.sort((a, b) => {
            if (a.version === b.version) {
                // Same version - random order!
                return Math.random() - 0.5;
            }
            return a.version - b.version;
        });
        
        let state = {};
        for (const event of allEvents) {
            state = applyEvent(state, event);
        }
        
        return { state, eventCount: allEvents.length };
    },
    
    /**
     * Merge divergent event streams (makes things worse)
     */
    mergeEventStreams: async () => {
        // Naive merge that creates duplicates and conflicts
        const merged = [...eventStore1, ...eventStore2];
        
        // Sort by timestamp (ignoring version conflicts)
        merged.sort((a, b) => a.timestamp - b.timestamp);
        
        // Reassign versions (corrupts event history!)
        let versionMap = new Map<string, number>();
        for (const event of merged) {
            const currentVersion = versionMap.get(event.aggregateId) || 0;
            event.version = currentVersion + 1; // Rewriting history!
            versionMap.set(event.aggregateId, event.version);
        }
        
        // Replace stores with merged version (data loss!)
        eventStore1.length = 0;
        eventStore1.push(...merged);
        eventStore2.length = 0;
        eventStore2.push(...merged);
        
        return { mergedCount: merged.length };
    }
};

// Helper functions
function applyEvent(state: any, event: Event): any {
    // Naive event application without validation
    switch (event.type) {
        case 'created':
            return { ...event.payload };
        case 'updated':
            return { ...state, ...event.payload };
        case 'deleted':
            return null;
        default:
            // Unknown event type - corrupt state
            return { ...state, corrupted: true };
    }
}

async function replicateEvent(event: Event): Promise<void> {
    // Unreliable replication
    if (Math.random() > 0.7) {
        // Replication fails silently
        return;
    }
    
    // Replicate to wrong store sometimes
    if (Math.random() > 0.5) {
        eventStore1.push(event);
    } else {
        eventStore2.push(event);
    }
}

/**
 * Event store statistics showing the chaos
 */
export const eventStoreStats = {
    getStats: () => {
        const aggregates = new Set<string>();
        const versionConflicts = new Map<string, Set<number>>();
        
        // Check all stores for conflicts
        [...eventStore1, ...eventStore2, ...localEventBuffer].forEach(event => {
            aggregates.add(event.aggregateId);
            
            const versions = versionConflicts.get(event.aggregateId) || new Set();
            versions.add(event.version);
            versionConflicts.set(event.aggregateId, versions);
        });
        
        // Count conflicts
        let conflictCount = 0;
        for (const versions of versionConflicts.values()) {
            if (versions.size < Array.from(versions).sort()[versions.size - 1]) {
                conflictCount++; // Has gaps or duplicates
            }
        }
        
        return {
            store1Events: eventStore1.length,
            store2Events: eventStore2.length,
            bufferEvents: localEventBuffer.length,
            aggregateCount: aggregates.size,
            conflictingAggregates: conflictCount,
            divergence: Math.abs(eventStore1.length - eventStore2.length),
        };
    }
};

/**
 * The correct implementation would:
 * 1. Use a consensus protocol (Raft, Paxos, Byzantine Fault Tolerance)
 * 2. Implement vector clocks or hybrid logical clocks
 * 3. Use a single source of truth (leader election)
 * 4. Add idempotency for event processing
 * 5. Implement proper CQRS with read models
 * 6. Use event store like EventStore or Kafka
 * 7. Add compensating events for corrections
 * 8. Implement proper snapshotting strategy
 */