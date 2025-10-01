/**
 * Order Service with Critical Race Condition
 * DO NOT SHIP: Contains concurrency bug that can cause double-spending
 */

// Mock database client
const db = {
    queryOne: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
            id: params[0],
            balance: 1000.00,
            inventory_count: 10
        };
    },
    query: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        await new Promise(resolve => setTimeout(resolve, 50));
        return { affectedRows: 1 };
    }
};

/**
 * Order Service
 * Contains a critical race condition that can lead to data corruption
 */
export const orderService = {
    /**
     * ERROR 380: CRITICAL RACE CONDITION - Check-Then-Act Pattern
     * 
     * This function uses a dangerous check-then-act pattern that creates
     * a race condition window between checking inventory and updating it.
     * 
     * Vulnerability Sequence:
     * 1. Thread A checks inventory (10 items available)
     * 2. Thread B checks inventory (10 items available)
     * 3. Thread A updates inventory (sets to 5)
     * 4. Thread B updates inventory (sets to 5)
     * Result: Both orders succeed but inventory is wrong
     * 
     * Impact:
     * - Overselling products
     * - Negative inventory
     * - Financial losses
     * - Customer dissatisfaction
     * - Data integrity violations
     */
    processOrder: async (orderId: number, productId: number, quantity: number) => {
        console.log(`Processing order ${orderId} for ${quantity} units of product ${productId}`);
        
        // VULNERABILITY: Check inventory availability
        const product = await db.queryOne(
            'SELECT inventory_count FROM products WHERE id = ?',
            [productId]
        );
        
        // CRITICAL RACE CONDITION WINDOW STARTS HERE
        // Between this check and the update below, another request
        // can read the same inventory value and both will proceed
        
        if (product.inventory_count < quantity) {
            return {
                success: false,
                error: 'Insufficient inventory'
            };
        }
        
        // Simulate processing time (makes race condition more likely)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // VULNERABILITY: Update inventory without atomic operation
        // This should be: UPDATE products SET inventory_count = inventory_count - ?
        // Instead it's: SELECT then calculate then UPDATE with fixed value
        const newInventory = product.inventory_count - quantity;
        
        await db.query(
            'UPDATE products SET inventory_count = ? WHERE id = ?',
            [newInventory, productId]  // Setting to calculated value instead of atomic decrement
        );
        
        // Create order record
        await db.query(
            'INSERT INTO orders (id, product_id, quantity, status) VALUES (?, ?, ?, ?)',
            [orderId, productId, quantity, 'confirmed']
        );
        
        return {
            success: true,
            orderId,
            remainingInventory: newInventory
        };
    },
    
    /**
     * Process payment with similar race condition
     */
    processPayment: async (userId: number, amount: number) => {
        // Another check-then-act pattern
        const user = await db.queryOne(
            'SELECT balance FROM users WHERE id = ?',
            [userId]
        );
        
        // RACE CONDITION: Check balance
        if (user.balance < amount) {
            return { success: false, error: 'Insufficient funds' };
        }
        
        // Window for race condition
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Non-atomic update
        const newBalance = user.balance - amount;
        await db.query(
            'UPDATE users SET balance = ? WHERE id = ?',
            [newBalance, userId]  // Should be: balance = balance - ?
        );
        
        return { success: true, newBalance };
    },
    
    /**
     * Reserve inventory with race condition
     */
    reserveInventory: async (productId: number, quantity: number, reservationId: string) => {
        // Check availability
        const product = await db.queryOne(
            'SELECT available_count FROM products WHERE id = ?',
            [productId]
        );
        
        if (product.available_count < quantity) {
            return { success: false };
        }
        
        // Race condition window
        
        // Create reservation
        await db.query(
            'INSERT INTO reservations (id, product_id, quantity) VALUES (?, ?, ?)',
            [reservationId, productId, quantity]
        );
        
        // Update available count (non-atomic)
        await db.query(
            'UPDATE products SET available_count = ? WHERE id = ?',
            [product.available_count - quantity, productId]
        );
        
        return { success: true, reservationId };
    },
    
    /**
     * Apply discount code with race condition
     */
    applyDiscountCode: async (code: string, orderId: number) => {
        // Check if code is still valid and has uses left
        const discount = await db.queryOne(
            'SELECT uses_remaining FROM discount_codes WHERE code = ?',
            [code]
        );
        
        if (!discount || discount.uses_remaining <= 0) {
            return { success: false, error: 'Invalid or expired code' };
        }
        
        // RACE CONDITION: Multiple users can pass this check simultaneously
        
        // Apply discount to order
        await db.query(
            'UPDATE orders SET discount_code = ? WHERE id = ?',
            [code, orderId]
        );
        
        // Decrement uses (non-atomic)
        await db.query(
            'UPDATE discount_codes SET uses_remaining = ? WHERE code = ?',
            [discount.uses_remaining - 1, code]  // Should be atomic decrement
        );
        
        return { success: true };
    }
};

/**
 * Additional vulnerable functions demonstrating the pattern
 */
export const inventoryManager = {
    // Transfer inventory between warehouses with race condition
    transferInventory: async (productId: number, fromWarehouse: number, toWarehouse: number, quantity: number) => {
        // Check source warehouse
        const source = await db.queryOne(
            'SELECT quantity FROM warehouse_inventory WHERE warehouse_id = ? AND product_id = ?',
            [fromWarehouse, productId]
        );
        
        if (source.quantity < quantity) {
            return { success: false };
        }
        
        // RACE CONDITION WINDOW
        
        // Update source (non-atomic)
        await db.query(
            'UPDATE warehouse_inventory SET quantity = ? WHERE warehouse_id = ? AND product_id = ?',
            [source.quantity - quantity, fromWarehouse, productId]
        );
        
        // Update destination (also non-atomic)
        const dest = await db.queryOne(
            'SELECT quantity FROM warehouse_inventory WHERE warehouse_id = ? AND product_id = ?',
            [toWarehouse, productId]
        );
        
        await db.query(
            'UPDATE warehouse_inventory SET quantity = ? WHERE warehouse_id = ? AND product_id = ?',
            [dest.quantity + quantity, toWarehouse, productId]
        );
        
        return { success: true };
    }
};

/**
 * The secure version would use atomic operations:
 * 
 * processOrderSecure: async (orderId, productId, quantity) => {
 *     // Use atomic decrement with condition
 *     const result = await db.query(
 *         'UPDATE products SET inventory_count = inventory_count - ? WHERE id = ? AND inventory_count >= ?',
 *         [quantity, productId, quantity]
 *     );
 *     
 *     if (result.affectedRows === 0) {
 *         return { success: false, error: 'Insufficient inventory' };
 *     }
 *     
 *     // Or use transactions with proper locking:
 *     await db.beginTransaction();
 *     await db.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
 *     // ... perform checks and updates within transaction
 *     await db.commit();
 * }
 */