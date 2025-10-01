/**
 * Message Queue Service with Critical Reliability Issues
 * DO NOT SHIP: Messages can be lost, duplicated, or processed out of order
 */

interface Message {
    id: string;
    payload: any;
    timestamp: number;
    retryCount?: number;
}

// Mock queue storage (in-memory = data loss on restart)
const messageQueue: Message[] = [];
const processingQueue: Map<string, Message> = new Map();

export const messageQueueService = {
    /**
     * ERROR 384: FIRE-AND-FORGET MESSAGE PATTERN - No Acknowledgment
     * 
     * This function sends messages without waiting for confirmation.
     * If the consumer fails or the network drops, the message is lost forever.
     * 
     * Problems:
     * - No delivery guarantee
     * - No retry mechanism
     * - No persistence
     * - No dead letter queue
     * - Silent failures
     * 
     * Real-world impact:
     * - Critical business events lost (orders, payments, notifications)
     * - No audit trail of failures
     * - Customers don't receive important updates
     * - Financial transactions disappear
     */
    sendMessage: async (payload: any) => {
        const message: Message = {
            id: Math.random().toString(36),
            payload,
            timestamp: Date.now()
        };
        
        // ERROR 384: Push to in-memory queue - lost on crash
        messageQueue.push(message);
        
        // Simulate async processing with potential failure
        setTimeout(() => {
            // Random failure - message just disappears
            if (Math.random() > 0.8) {
                const index = messageQueue.indexOf(message);
                if (index > -1) {
                    messageQueue.splice(index, 1); // Message lost!
                }
                console.log(`Message ${message.id} lost in the void`);
                return; // No error handling, no retry
            }
            
            // Process message (might fail silently)
            processMessage(message);
        }, Math.random() * 1000);
        
        // Returns immediately - caller thinks it succeeded
        return { messageId: message.id, status: 'sent' };
    },
    
    /**
     * ERROR 385: AT-MOST-ONCE DELIVERY - Message Loss on Failure
     * 
     * This consumer removes messages from the queue BEFORE processing.
     * If processing fails, the message is permanently lost.
     * 
     * Correct pattern: Remove only AFTER successful processing (at-least-once)
     */
    consumeMessage: async () => {
        // ERROR 385: Remove from queue before processing
        const message = messageQueue.shift(); // Removed immediately!
        
        if (!message) {
            return null;
        }
        
        // Move to processing (but already removed from main queue)
        processingQueue.set(message.id, message);
        
        try {
            // Simulate processing that might fail
            if (Math.random() > 0.7) {
                throw new Error('Processing failed');
            }
            
            // Process the message
            await processMessageAsync(message);
            
            // Remove from processing queue
            processingQueue.delete(message.id);
            
            return { success: true, messageId: message.id };
        } catch (error) {
            // MESSAGE IS LOST! It's not in messageQueue anymore
            // and we don't put it back or retry
            processingQueue.delete(message.id);
            
            console.error(`Message ${message.id} lost due to processing error`);
            return { success: false, messageId: message.id, error: 'Lost forever' };
        }
    },
    
    /**
     * Batch processing with partial failures - some messages lost
     */
    processBatch: async (batchSize: number = 10) => {
        const results = [];
        
        for (let i = 0; i < batchSize; i++) {
            const result = await messageQueueService.consumeMessage();
            if (result) {
                results.push(result);
                
                // If one fails, stop processing rest of batch
                if (!result.success) {
                    // Remaining messages in batch are abandoned
                    break;
                }
            }
        }
        
        return results;
    },
    
    /**
     * Duplicate message sender - no idempotency
     */
    sendDuplicateVulnerable: async (payload: any) => {
        // No deduplication - same message can be sent multiple times
        const message1 = await messageQueueService.sendMessage(payload);
        
        // Network retry might cause duplicate
        if (Math.random() > 0.5) {
            const message2 = await messageQueueService.sendMessage(payload);
            // Same payload sent twice with different IDs!
            return [message1, message2];
        }
        
        return [message1];
    },
    
    /**
     * Out-of-order processing - no sequence guarantee
     */
    sendPriority: async (payload: any, priority: number) => {
        const message: Message = {
            id: Math.random().toString(36),
            payload: { ...payload, priority },
            timestamp: Date.now()
        };
        
        // Just adds to end regardless of priority
        messageQueue.push(message);
        
        // Messages process in random order
        setTimeout(() => {
            processMessage(message);
        }, Math.random() * 2000); // Random delay breaks ordering
        
        return { messageId: message.id };
    }
};

// Helper functions
function processMessage(message: Message) {
    console.log(`Processing message ${message.id}`);
    // Processing logic with potential failures
}

async function processMessageAsync(message: Message) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Async processing message ${message.id}`);
}

/**
 * Queue stats showing the problem
 */
export const queueStats = {
    getStats: () => {
        return {
            queued: messageQueue.length,
            processing: processingQueue.size,
            // No tracking of:
            // - Lost messages
            // - Failed messages  
            // - Retry counts
            // - Dead letter queue size
        };
    }
};

/**
 * The correct implementation would:
 * 1. Use persistent storage (Redis, RabbitMQ, Kafka)
 * 2. Implement at-least-once delivery
 * 3. Add message acknowledgment
 * 4. Include retry logic with exponential backoff
 * 5. Maintain dead letter queue
 * 6. Ensure message ordering when required
 * 7. Implement idempotency keys
 * 8. Add monitoring and alerting
 */