/**
 * Saga Pattern Implementation with Critical Compensation Failures
 * DO NOT SHIP: Leaves system in inconsistent states
 */

interface SagaStep {
    name: string;
    execute: () => Promise<any>;
    compensate: () => Promise<void>;
    retryCount?: number;
    timeout?: number;
}

interface SagaExecution {
    id: string;
    steps: SagaStep[];
    completedSteps: string[];
    failedStep?: string;
    status: 'running' | 'completed' | 'compensating' | 'failed' | 'stuck';
    startTime: Date;
    endTime?: Date;
    compensationErrors: string[];
}

// Track all saga executions
const sagaExecutions = new Map<string, SagaExecution>();

/**
 * ERROR 402: BROKEN COMPENSATION LOGIC - Saga Can't Roll Back
 * 
 * This saga implementation has broken compensation logic that fails
 * to properly roll back transactions, leaving the system in an
 * inconsistent state when failures occur.
 * 
 * Problems:
 * - Compensations that don't actually undo
 * - Non-idempotent compensations
 * - Missing compensations for some steps
 * - Compensation order issues
 * - No compensation transaction log
 * 
 * Real-world impact:
 * - Money debited but not credited
 * - Inventory reserved but not released
 * - Orders partially created
 * - Database inconsistencies
 * - Manual intervention required
 */
export const brokenSaga = {
    /**
     * Order processing saga with broken compensations
     */
    processOrder: async (orderId: string, userId: string, items: any[], amount: number) => {
        const sagaId = `order-${orderId}-${Date.now()}`;
        const execution: SagaExecution = {
            id: sagaId,
            steps: [],
            completedSteps: [],
            status: 'running',
            startTime: new Date(),
            compensationErrors: []
        };
        
        sagaExecutions.set(sagaId, execution);
        
        // Define saga steps with BROKEN compensations
        const steps: SagaStep[] = [
            {
                name: 'reserve-inventory',
                execute: async () => {
                    console.log('Reserving inventory for items:', items);
                    // Simulate inventory reservation
                    for (const item of items) {
                        await updateInventory(item.id, -item.quantity);
                    }
                    return { reserved: true, items };
                },
                compensate: async () => {
                    // ERROR 402: Compensation doesn't restore exact quantities!
                    console.log('Compensating inventory... sort of');
                    for (const item of items) {
                        // Wrong! Uses fixed quantity instead of actual reserved amount
                        await updateInventory(item.id, 1); // Should be item.quantity!
                    }
                }
            },
            {
                name: 'charge-payment',
                execute: async () => {
                    console.log('Charging payment:', amount);
                    await chargeCard(userId, amount);
                    return { charged: true, amount };
                },
                compensate: async () => {
                    // ERROR 402: Compensation might fail silently
                    console.log('Refunding payment... maybe');
                    try {
                        // Refund might fail but we don't track it!
                        await refundCard(userId, amount);
                    } catch (error) {
                        // Swallowing error - money is lost!
                        console.error('Refund failed silently');
                    }
                }
            },
            {
                name: 'create-order',
                execute: async () => {
                    console.log('Creating order:', orderId);
                    await createOrderRecord(orderId, userId, items);
                    return { created: true, orderId };
                },
                compensate: async () => {
                    // ERROR 402: No compensation defined!
                    // Order record remains in database
                    console.log('Order compensation not implemented');
                    // Order stays in system as "ghost order"
                }
            },
            {
                name: 'send-confirmation',
                execute: async () => {
                    console.log('Sending confirmation email');
                    await sendEmail(userId, 'Order confirmed', orderId);
                    return { sent: true };
                },
                compensate: async () => {
                    // ERROR 402: Can't "unsend" an email!
                    console.log('Cannot unsend confirmation email');
                    // Customer gets confirmation for failed order
                }
            },
            {
                name: 'update-analytics',
                execute: async () => {
                    console.log('Updating analytics');
                    await incrementMetric('orders.completed', 1);
                    await incrementMetric('revenue', amount);
                    return { updated: true };
                },
                compensate: async () => {
                    // ERROR 402: Non-idempotent compensation
                    // If run twice, metrics go negative!
                    await incrementMetric('orders.completed', -1);
                    await incrementMetric('revenue', -amount);
                }
            }
        ];
        
        execution.steps = steps;
        
        // Execute saga steps
        for (const step of steps) {
            try {
                console.log(`Executing step: ${step.name}`);
                const result = await step.execute();
                execution.completedSteps.push(step.name);
                console.log(`Step ${step.name} completed:`, result);
            } catch (error) {
                console.error(`Step ${step.name} failed:`, error);
                execution.failedStep = step.name;
                execution.status = 'compensating';
                
                // ERROR 402: Compensation in WRONG order (should be reverse!)
                // Compensating in forward order instead of reverse
                for (const completedStep of execution.completedSteps) {
                    const stepToCompensate = steps.find(s => s.name === completedStep);
                    if (stepToCompensate) {
                        try {
                            console.log(`Compensating: ${completedStep}`);
                            await stepToCompensate.compensate();
                        } catch (compError) {
                            console.error(`Compensation failed for ${completedStep}:`, compError);
                            execution.compensationErrors.push(completedStep);
                            // ERROR 402: Continues compensating even after failure!
                        }
                    }
                }
                
                execution.status = execution.compensationErrors.length > 0 ? 'stuck' : 'failed';
                execution.endTime = new Date();
                throw new Error(`Saga failed at step: ${step.name}`);
            }
        }
        
        execution.status = 'completed';
        execution.endTime = new Date();
        return { sagaId, status: 'completed' };
    }
};

/**
 * ERROR 403: NON-IDEMPOTENT SAGA OPERATIONS - Retries Cause Chaos
 * 
 * This implementation has non-idempotent operations that cause
 * problems when retried, leading to duplicate charges, double
 * inventory deductions, and corrupted state.
 * 
 * Problems:
 * - Operations not idempotent
 * - No operation deduplication
 * - Retries cause duplicates
 * - No idempotency keys
 * - State mutations on retry
 */
export const nonIdempotentSaga = {
    /**
     * Transfer money saga - NOT idempotent!
     */
    transferMoney: async (transferId: string, fromAccount: string, toAccount: string, amount: number) => {
        const sagaId = `transfer-${transferId}`;
        
        // ERROR 403: No check if saga already executed!
        // Retrying this saga will transfer money multiple times
        
        const steps: SagaStep[] = [
            {
                name: 'debit-source',
                execute: async () => {
                    // ERROR 403: Non-idempotent - will debit multiple times on retry!
                    const newBalance = await debitAccount(fromAccount, amount);
                    // No idempotency key, no duplicate check
                    return { debited: true, newBalance };
                },
                compensate: async () => {
                    // ERROR 403: Compensation also non-idempotent
                    await creditAccount(fromAccount, amount);
                    // If compensated twice, account gets double credit!
                }
            },
            {
                name: 'credit-destination',
                execute: async () => {
                    // ERROR 403: Will credit multiple times on retry!
                    const newBalance = await creditAccount(toAccount, amount);
                    return { credited: true, newBalance };
                },
                compensate: async () => {
                    // ERROR 403: Will debit multiple times on compensation retry
                    await debitAccount(toAccount, amount);
                }
            },
            {
                name: 'record-transaction',
                execute: async () => {
                    // ERROR 403: Creates duplicate transaction records on retry
                    await recordTransaction({
                        id: Date.now().toString(), // Different ID each time!
                        from: fromAccount,
                        to: toAccount,
                        amount,
                        timestamp: new Date()
                    });
                    return { recorded: true };
                },
                compensate: async () => {
                    // ERROR 403: Can't identify which record to delete
                    console.log('Cannot identify transaction to delete');
                }
            },
            {
                name: 'notify-parties',
                execute: async () => {
                    // ERROR 403: Sends duplicate notifications on retry
                    await sendNotification(fromAccount, `Sent $${amount}`);
                    await sendNotification(toAccount, `Received $${amount}`);
                    return { notified: true };
                },
                compensate: async () => {
                    // Can't un-notify
                    console.log('Notifications already sent');
                }
            }
        ];
        
        // Execute without checking if already done
        for (const step of steps) {
            try {
                // ERROR 403: No retry limit or backoff
                let retries = 0;
                while (retries < 3) {
                    try {
                        await step.execute();
                        break;
                    } catch (error) {
                        retries++;
                        // ERROR 403: Immediate retry without delay
                        // Hammers the service and might cause duplicate executions
                        console.log(`Retry ${retries} for ${step.name}`);
                    }
                }
            } catch (error) {
                console.error(`Step ${step.name} failed after retries`);
                throw error;
            }
        }
        
        return { sagaId, status: 'completed' };
    },
    
    /**
     * Subscription saga with state mutations
     */
    createSubscription: async (userId: string, planId: string) => {
        const sagaId = `subscription-${userId}-${Date.now()}`;
        
        const steps: SagaStep[] = [
            {
                name: 'create-subscription',
                execute: async () => {
                    // ERROR 403: Increments counter on each retry
                    await incrementUserSubscriptionCount(userId);
                    // User might end up with subscription_count = 5 after retries
                    
                    const subId = await createSubscriptionRecord(userId, planId);
                    return { subscriptionId: subId };
                },
                compensate: async () => {
                    // ERROR 403: Might decrement wrong number of times
                    await decrementUserSubscriptionCount(userId);
                }
            },
            {
                name: 'charge-first-payment',
                execute: async () => {
                    // ERROR 403: Might charge multiple times
                    const chargeId = Date.now().toString();
                    await chargeSubscription(userId, planId, chargeId);
                    return { charged: true };
                },
                compensate: async () => {
                    // ERROR 403: Can't identify which charge to refund
                    console.log('Cannot identify charge to refund');
                }
            },
            {
                name: 'grant-access',
                execute: async () => {
                    // ERROR 403: Might grant multiple accesses
                    await grantPlanAccess(userId, planId);
                    // User might get premium_days += 30 multiple times
                    return { accessGranted: true };
                },
                compensate: async () => {
                    // ERROR 403: Removes ALL access, not just what was added
                    await revokePlanAccess(userId, planId);
                }
            }
        ];
        
        // No tracking of execution history
        for (const step of steps) {
            await step.execute();
        }
        
        return { sagaId, status: 'completed' };
    }
};

/**
 * Mock service functions (simulate external services)
 */
async function updateInventory(itemId: string, quantity: number) {
    console.log(`Inventory: ${itemId} ${quantity > 0 ? '+' : ''}${quantity}`);
    await delay(10);
}

async function chargeCard(userId: string, amount: number) {
    console.log(`Charging ${userId}: $${amount}`);
    await delay(20);
    if (Math.random() < 0.1) throw new Error('Payment failed');
}

async function refundCard(userId: string, amount: number) {
    console.log(`Refunding ${userId}: $${amount}`);
    await delay(20);
    if (Math.random() < 0.2) throw new Error('Refund failed');
}

async function createOrderRecord(orderId: string, userId: string, items: any[]) {
    console.log(`Creating order ${orderId} for ${userId}`);
    await delay(15);
}

async function sendEmail(userId: string, subject: string, content: string) {
    console.log(`Email to ${userId}: ${subject}`);
    await delay(5);
}

async function incrementMetric(metric: string, value: number) {
    console.log(`Metric ${metric}: +${value}`);
    await delay(5);
}

async function debitAccount(account: string, amount: number) {
    console.log(`Debit ${account}: -$${amount}`);
    await delay(10);
    return Math.random() * 1000; // Random balance
}

async function creditAccount(account: string, amount: number) {
    console.log(`Credit ${account}: +$${amount}`);
    await delay(10);
    return Math.random() * 1000; // Random balance
}

async function recordTransaction(transaction: any) {
    console.log(`Recording transaction:`, transaction);
    await delay(10);
}

async function sendNotification(account: string, message: string) {
    console.log(`Notify ${account}: ${message}`);
    await delay(5);
}

async function incrementUserSubscriptionCount(userId: string) {
    console.log(`Increment subscription count for ${userId}`);
    await delay(5);
}

async function decrementUserSubscriptionCount(userId: string) {
    console.log(`Decrement subscription count for ${userId}`);
    await delay(5);
}

async function createSubscriptionRecord(userId: string, planId: string) {
    console.log(`Create subscription: ${userId} -> ${planId}`);
    await delay(10);
    return `sub_${Date.now()}`;
}

async function chargeSubscription(userId: string, planId: string, chargeId: string) {
    console.log(`Charge subscription ${chargeId}: ${userId} for ${planId}`);
    await delay(15);
}

async function grantPlanAccess(userId: string, planId: string) {
    console.log(`Grant access: ${userId} -> ${planId}`);
    await delay(10);
}

async function revokePlanAccess(userId: string, planId: string) {
    console.log(`Revoke access: ${userId} -> ${planId}`);
    await delay(10);
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Saga monitoring and debugging
 */
export const sagaMonitor = {
    /**
     * Get all saga executions
     */
    getAllSagas: () => {
        return Array.from(sagaExecutions.values());
    },
    
    /**
     * Get stuck sagas (compensation failed)
     */
    getStuckSagas: () => {
        return Array.from(sagaExecutions.values())
            .filter(s => s.status === 'stuck');
    },
    
    /**
     * Simulate saga failures
     */
    simulateFailures: async () => {
        const results = [];
        
        // Try order saga (will fail and get stuck)
        try {
            await brokenSaga.processOrder(
                'order123',
                'user456',
                [{ id: 'item1', quantity: 2 }, { id: 'item2', quantity: 1 }],
                99.99
            );
        } catch (error) {
            results.push({ 
                saga: 'processOrder',
                error: (error as Error).message,
                stuck: true 
            });
        }
        
        // Try money transfer (non-idempotent)
        try {
            const transferId = 'transfer789';
            // First attempt
            await nonIdempotentSaga.transferMoney(transferId, 'account1', 'account2', 100);
            // Retry (will cause duplicate!)
            await nonIdempotentSaga.transferMoney(transferId, 'account1', 'account2', 100);
            results.push({
                saga: 'transferMoney',
                error: 'Executed twice - money transferred double!'
            });
        } catch (error) {
            results.push({ saga: 'transferMoney', error: (error as Error).message });
        }
        
        return {
            results,
            stuckSagas: sagaMonitor.getStuckSagas()
        };
    }
};

/**
 * The correct implementation would:
 * 1. Implement proper compensation in reverse order
 * 2. Make all operations idempotent with idempotency keys
 * 3. Track saga execution state persistently
 * 4. Implement compensation transaction logs
 * 5. Use two-phase commit where possible
 * 6. Add retry limits with exponential backoff
 * 7. Implement saga timeout handling
 * 8. Add manual intervention capabilities
 * 9. Use event sourcing for saga state
 * 10. Implement proper monitoring and alerting
 */