/**
 * Payment Controller with Race Condition Vulnerability
 * Allows double-spending and balance manipulation through concurrent requests
 */

import { Request, Response } from 'express';

// Simulated database (in reality would be actual DB)
const userBalances: Map<string, number> = new Map();
const transactionLog: Array<any> = [];

// Initialize some test data
userBalances.set('user1', 1000.00);
userBalances.set('user2', 500.00);

/**
 * ERROR 363: Race Condition in Balance Transfer
 * 
 * This function has a critical race condition that allows double-spending.
 * When two requests hit this endpoint simultaneously with the same source account,
 * both can pass the balance check before either deducts the amount.
 * 
 * Attack scenario:
 * 1. User has $1000 balance
 * 2. User sends two $800 transfers simultaneously 
 * 3. Both requests check balance (both see $1000)
 * 4. Both requests pass validation (1000 >= 800)
 * 5. Both requests deduct $800
 * 6. User has transferred $1600 from $1000 account!
 */
export async function transferFunds(req: Request, res: Response) {
    const { fromUserId, toUserId, amount } = req.body;
    
    console.log(`Transfer request: ${fromUserId} -> ${toUserId}: $${amount}`);
    
    // RACE CONDITION START - Check-then-act pattern
    
    // Step 1: Check balance (READ)
    const senderBalance = userBalances.get(fromUserId) || 0;
    
    // Simulate network/database delay (makes race condition more likely)
    await simulateDelay(100);
    
    // Step 2: Validate sufficient funds
    if (senderBalance < amount) {
        return res.status(400).json({
            error: 'Insufficient funds',
            balance: senderBalance,
            requested: amount
        });
    }
    
    // Step 3: Another delay (processing time)
    await simulateDelay(50);
    
    // CRITICAL WINDOW: Between check and update, another request can pass validation!
    
    // Step 4: Deduct from sender (WRITE)
    const newSenderBalance = senderBalance - amount;
    userBalances.set(fromUserId, newSenderBalance);
    
    // Step 5: Add to receiver
    const receiverBalance = userBalances.get(toUserId) || 0;
    userBalances.set(toUserId, receiverBalance + amount);
    
    // RACE CONDITION END
    
    // Log transaction (also has race condition for transaction IDs)
    const transactionId = transactionLog.length + 1; // Not atomic!
    transactionLog.push({
        id: transactionId,
        from: fromUserId,
        to: toUserId,
        amount: amount,
        timestamp: new Date().toISOString()
    });
    
    return res.json({
        success: true,
        transactionId,
        newBalance: newSenderBalance
    });
}

/**
 * Another race condition: Reward points calculation
 */
export async function claimDailyReward(req: Request, res: Response) {
    const { userId } = req.params;
    
    // Race condition: Multiple claims can succeed
    const lastClaim = await getLastClaimTime(userId);
    const now = Date.now();
    
    // Check if 24 hours have passed
    if (lastClaim && (now - lastClaim) < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ error: 'Already claimed today' });
    }
    
    // Delay simulates database operation
    await simulateDelay(100);
    
    // RACE CONDITION: Another request could pass the check above
    // before this one updates the last claim time
    
    await setLastClaimTime(userId, now);
    
    // Add reward
    const currentBalance = userBalances.get(userId) || 0;
    userBalances.set(userId, currentBalance + 100);
    
    return res.json({
        success: true,
        reward: 100,
        newBalance: currentBalance + 100
    });
}

/**
 * Inventory management with race condition
 */
let inventory: Map<string, number> = new Map([
    ['product1', 10],
    ['product2', 5]
]);

export async function purchaseProduct(req: Request, res: Response) {
    const { productId, quantity, userId } = req.body;
    
    // Check inventory (READ)
    const available = inventory.get(productId) || 0;
    
    if (available < quantity) {
        return res.status(400).json({ error: 'Out of stock' });
    }
    
    // Process payment (takes time)
    await simulateDelay(200);
    
    // RACE CONDITION: Inventory could be depleted by now
    
    // Deduct inventory (WRITE) 
    inventory.set(productId, available - quantity);
    
    // If two users buy the last items simultaneously,
    // inventory can go negative!
    
    return res.json({
        success: true,
        purchased: quantity,
        remaining: available - quantity
    });
}

/**
 * Coupon redemption with race condition
 */
const usedCoupons = new Set<string>();

export async function redeemCoupon(req: Request, res: Response) {
    const { couponCode, userId } = req.body;
    
    // Check if coupon is already used
    if (usedCoupons.has(couponCode)) {
        return res.status(400).json({ error: 'Coupon already used' });
    }
    
    // Validate coupon (network call)
    await simulateDelay(150);
    
    // RACE CONDITION: Same coupon can be redeemed multiple times
    
    // Mark as used
    usedCoupons.add(couponCode);
    
    // Apply discount
    return res.json({
        success: true,
        discount: 50,
        message: 'Coupon applied successfully'
    });
}

// Helper functions
async function simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const claimTimes = new Map<string, number>();

async function getLastClaimTime(userId: string): Promise<number | undefined> {
    await simulateDelay(50);
    return claimTimes.get(userId);
}

async function setLastClaimTime(userId: string, time: number): Promise<void> {
    await simulateDelay(50);
    claimTimes.set(userId, time);
}

/**
 * The fix would involve using proper locking mechanisms:
 * 
 * 1. Database transactions with proper isolation levels
 * 2. Optimistic locking with version numbers
 * 3. Redis/Memcached distributed locks
 * 4. Atomic operations (e.g., MongoDB's findAndModify)
 * 5. Message queues for serialization
 * 
 * Example fix with database transaction:
 * 
 * async function secureTransferFunds(req, res) {
 *     const session = await db.startSession();
 *     session.startTransaction();
 *     try {
 *         // All operations within transaction
 *         const sender = await User.findById(fromUserId).session(session);
 *         if (sender.balance < amount) throw new Error('Insufficient funds');
 *         
 *         sender.balance -= amount;
 *         await sender.save({ session });
 *         
 *         const receiver = await User.findById(toUserId).session(session);
 *         receiver.balance += amount;
 *         await receiver.save({ session });
 *         
 *         await session.commitTransaction();
 *         return res.json({ success: true });
 *     } catch (error) {
 *         await session.abortTransaction();
 *         return res.status(400).json({ error: error.message });
 *     } finally {
 *         session.endSession();
 *     }
 * }
 */