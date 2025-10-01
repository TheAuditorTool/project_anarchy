/**
 * Currency Conversion Service with Non-Atomic Operations
 * DO NOT SHIP: Contains data integrity violations in financial calculations
 */

// Mock database client
const db = {
    query: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        await new Promise(resolve => setTimeout(resolve, 20));
        return { affectedRows: 1, insertId: Math.floor(Math.random() * 1000) };
    },
    queryOne: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        return {
            balance: 1000.00,
            currency: 'USD',
            exchange_rate: 1.2
        };
    }
};

/**
 * Currency Conversion Service
 * Contains critical non-atomic operations that violate ACID properties
 */
export const conversionService = {
    /**
     * ERROR 382: CRITICAL DATA INTEGRITY - Non-Atomic Currency Conversion
     * 
     * This function performs currency conversion as multiple separate operations
     * instead of a single atomic transaction. If any step fails or the system
     * crashes mid-operation, money can be lost or duplicated.
     * 
     * Vulnerability Sequence:
     * 1. Deduct from source account ✓
     * 2. System crashes or network fails ✗
     * 3. Credit to destination never happens
     * Result: Money disappears from the system
     * 
     * Alternative failure:
     * 1. Deduct from source account ✓
     * 2. Credit to destination account ✓
     * 3. Recording transaction fails ✗
     * Result: No audit trail, reconciliation impossible
     * 
     * Impact:
     * - Financial data corruption
     * - Money can be lost or created
     * - Audit trail gaps
     * - Regulatory compliance violations
     * - Customer fund losses
     */
    convertCurrency: async (
        userId: number,
        fromCurrency: string,
        toCurrency: string,
        amount: number
    ) => {
        console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency} for user ${userId}`);
        
        // Step 1: Deduct from source currency account (SEPARATE OPERATION)
        await db.query(
            'UPDATE user_wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?',
            [amount, userId, fromCurrency]
        );
        
        // CRITICAL FAILURE POINT - System could crash here
        // Money is deducted but not credited anywhere
        
        // Step 2: Get exchange rate (ANOTHER SEPARATE OPERATION)
        const rateData = await db.queryOne(
            'SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ?',
            [fromCurrency, toCurrency]
        );
        
        const convertedAmount = amount * rateData.rate;
        
        // Step 3: Simulate processing delay (increases failure window)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ANOTHER FAILURE POINT - Rate could change during delay
        
        // Step 4: Credit to destination currency account (YET ANOTHER OPERATION)
        await db.query(
            'UPDATE user_wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?',
            [convertedAmount, userId, toCurrency]
        );
        
        // Step 5: Record transaction (FINAL SEPARATE OPERATION)
        // If this fails, we have no record of the conversion
        await db.query(
            'INSERT INTO conversion_history (user_id, from_currency, to_currency, from_amount, to_amount, rate) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, fromCurrency, toCurrency, amount, convertedAmount, rateData.rate]
        );
        
        // ERROR 382: All these operations should be in a single transaction!
        
        return {
            success: true,
            converted: convertedAmount
        };
    },
    
    /**
     * Transfer between users with non-atomic operations
     */
    transferFunds: async (
        fromUserId: number,
        toUserId: number,
        amount: number,
        currency: string
    ) => {
        // Step 1: Deduct from sender (SEPARATE OPERATION)
        await db.query(
            'UPDATE users SET balance = balance - ? WHERE id = ? AND currency = ?',
            [amount, fromUserId, currency]
        );
        
        // FAILURE POINT: Money deducted but not credited
        
        // Artificial delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Step 2: Add to recipient (SEPARATE OPERATION)
        await db.query(
            'UPDATE users SET balance = balance + ? WHERE id = ? AND currency = ?',
            [amount, toUserId, currency]
        );
        
        // Step 3: Log transfer (ANOTHER SEPARATE OPERATION)
        await db.query(
            'INSERT INTO transfers (from_user, to_user, amount, currency) VALUES (?, ?, ?, ?)',
            [fromUserId, toUserId, amount, currency]
        );
        
        // All three operations should be atomic!
        
        return { success: true };
    },
    
    /**
     * Batch processing with partial failures
     */
    processBatchConversions: async (conversions: any[]) => {
        const results = [];
        
        // Processing conversions one by one without transaction
        for (const conv of conversions) {
            try {
                // Each conversion is independent - partial batch can fail
                await conversionService.convertCurrency(
                    conv.userId,
                    conv.fromCurrency,
                    conv.toCurrency,
                    conv.amount
                );
                results.push({ id: conv.id, status: 'success' });
            } catch (error) {
                // Some succeed, some fail - inconsistent state
                results.push({ id: conv.id, status: 'failed' });
                // No rollback of successful conversions!
            }
        }
        
        return results;
    },
    
    /**
     * Compound operation without atomicity
     */
    applyFeeAndConvert: async (
        userId: number,
        amount: number,
        fromCurrency: string,
        toCurrency: string,
        feePercent: number
    ) => {
        // Calculate fee
        const fee = amount * (feePercent / 100);
        const netAmount = amount - fee;
        
        // Step 1: Deduct fee to platform account (SEPARATE)
        await db.query(
            'UPDATE platform_account SET balance = balance + ? WHERE currency = ?',
            [fee, fromCurrency]
        );
        
        // FAILURE POINT: Fee collected but conversion might fail
        
        // Step 2: Deduct full amount from user (SEPARATE)
        await db.query(
            'UPDATE user_wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?',
            [amount, userId, fromCurrency]
        );
        
        // Step 3: Get rate and convert (SEPARATE)
        const rate = await db.queryOne(
            'SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ?',
            [fromCurrency, toCurrency]
        );
        
        const convertedAmount = netAmount * rate.rate;
        
        // Step 4: Credit converted amount (SEPARATE)
        await db.query(
            'UPDATE user_wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?',
            [convertedAmount, userId, toCurrency]
        );
        
        // Multiple failure points, no atomicity!
        
        return { success: true, fee, converted: convertedAmount };
    }
};

/**
 * Additional non-atomic operations
 */
export const accountingService = {
    /**
     * Month-end reconciliation without transaction boundaries
     */
    reconcileAccounts: async (accountId: number) => {
        // Get all transactions (READ)
        const transactions = await db.query(
            'SELECT * FROM transactions WHERE account_id = ? AND reconciled = false',
            [accountId]
        );
        
        // Calculate balance (in-memory)
        let calculatedBalance = 0;
        for (const tx of transactions) {
            calculatedBalance += tx.amount;
        }
        
        // FAILURE POINT: Balance calculated but not yet updated
        
        // Update account balance (WRITE)
        await db.query(
            'UPDATE accounts SET balance = ? WHERE id = ?',
            [calculatedBalance, accountId]
        );
        
        // Mark transactions as reconciled (ANOTHER WRITE)
        await db.query(
            'UPDATE transactions SET reconciled = true WHERE account_id = ?',
            [accountId]
        );
        
        // If second update fails, balance is updated but transactions aren't marked!
        
        return { balance: calculatedBalance };
    }
};

/**
 * The correct approach would use transactions:
 * 
 * convertCurrencySecure: async (userId, fromCurrency, toCurrency, amount) => {
 *     const connection = await db.getConnection();
 *     await connection.beginTransaction();
 *     
 *     try {
 *         // All operations in a single transaction
 *         await connection.query('UPDATE user_wallets SET balance = balance - ? WHERE user_id = ? AND currency = ?', 
 *             [amount, userId, fromCurrency]);
 *         
 *         const rate = await connection.queryOne('SELECT rate FROM exchange_rates...');
 *         const convertedAmount = amount * rate.rate;
 *         
 *         await connection.query('UPDATE user_wallets SET balance = balance + ? WHERE user_id = ? AND currency = ?',
 *             [convertedAmount, userId, toCurrency]);
 *         
 *         await connection.query('INSERT INTO conversion_history...');
 *         
 *         await connection.commit();
 *         return { success: true, converted: convertedAmount };
 *     } catch (error) {
 *         await connection.rollback();
 *         throw error;
 *     } finally {
 *         connection.release();
 *     }
 * }
 */