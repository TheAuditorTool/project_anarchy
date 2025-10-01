/**
 * Worker Controller with Brute Force Vulnerability
 * DO NOT SHIP: No failed login attempt tracking or account lockout
 */

// Mock database client
const db = {
    queryOne: async (sql: string, params: any[]): Promise<any> => {
        // Simulate database query
        console.log('DB Query:', sql, params);
        return {
            id: params[0],
            pin: '1234', // Mock PIN
            name: 'John Worker',
            failed_login_attempts: 5, // This field exists but is never used!
            locked_until: null
        };
    },
    query: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        return { affectedRows: 1 };
    }
};

export const workerController = {
    /**
     * ERROR 378: CRITICAL SECURITY - Worker Lockout Bypass
     * 
     * This PIN authentication function does not check for or increment failed login attempts.
     * It's vulnerable to brute-force attacks as there's no account lockout mechanism.
     * 
     * Impact:
     * - 4-digit PINs can be brute-forced in 10,000 attempts
     * - No rate limiting or lockout protection
     * - No alerting on multiple failed attempts
     * - Workers can be impersonated
     */
    loginWithPin: async (workerId: number, pin: string) => {
        const worker = await db.queryOne('SELECT * FROM workers WHERE id = ?', [workerId]);
        
        // VULNERABILITY: No check for failed_login_attempts
        // The database has a failed_login_attempts field but it's completely ignored!
        // Should check: if (worker.failed_login_attempts >= 5) { return locked }
        
        // VULNERABILITY: No check for locked_until timestamp
        // Should check: if (worker.locked_until > Date.now()) { return locked }
        
        if (worker && worker.pin === pin) {
            // Success - but not resetting failed attempts counter
            // Should: UPDATE workers SET failed_login_attempts = 0
            
            // Generate token (weak token generation is another issue)
            const token = `worker-token-${workerId}-${Date.now()}`;
            
            return { 
                success: true, 
                token,
                worker: {
                    id: worker.id,
                    name: worker.name
                }
            };
        }
        
        // VULNERABILITY: Failed login doesn't increment counter
        // Should: UPDATE workers SET failed_login_attempts = failed_login_attempts + 1
        // Should: If attempts >= 5, SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
        
        // Just returning failure with no tracking
        return { 
            success: false, 
            message: "Invalid PIN"
            // Not returning remaining attempts or lockout status
        };
    },
    
    /**
     * Check PIN without any validation
     */
    validatePin: async (workerId: number, pin: string): Promise<boolean> => {
        // Another endpoint that can be brute-forced
        const worker = await db.queryOne('SELECT pin FROM workers WHERE id = ?', [workerId]);
        
        // Direct comparison with no attempt tracking
        return worker && worker.pin === pin;
    },
    
    /**
     * Change PIN - also vulnerable
     */
    changePin: async (workerId: number, oldPin: string, newPin: string) => {
        // No validation of old PIN attempts
        const valid = await workerController.validatePin(workerId, oldPin);
        
        if (!valid) {
            // Not tracking failed attempts for PIN change either
            return { success: false, message: "Invalid current PIN" };
        }
        
        // Weak PIN validation
        if (!/^\d{4}$/.test(newPin)) {
            return { success: false, message: "PIN must be 4 digits" };
        }
        
        // No check for common PINs like 0000, 1234, 1111
        // No check for sequential PINs like 1234, 4321
        
        await db.query('UPDATE workers SET pin = ? WHERE id = ?', [newPin, workerId]);
        
        return { success: true };
    },
    
    /**
     * Reset PIN - insecure implementation
     */
    resetPin: async (workerId: number, supervisorCode: string) => {
        // Supervisor code is also vulnerable to brute force
        if (supervisorCode !== 'SUPER123') { // Hardcoded supervisor code!
            return { success: false };
        }
        
        // Generates predictable PIN
        const newPin = String(1000 + workerId).slice(-4); // PIN based on worker ID!
        
        await db.query('UPDATE workers SET pin = ?, failed_login_attempts = 0 WHERE id = ?', 
            [newPin, workerId]);
        
        return { success: true, newPin }; // Returning PIN in response!
    },
    
    /**
     * Clock in/out - uses vulnerable PIN auth
     */
    clockIn: async (workerId: number, pin: string, location: string) => {
        // Using the vulnerable loginWithPin
        const auth = await workerController.loginWithPin(workerId, pin);
        
        if (!auth.success) {
            return { success: false, message: "Authentication failed" };
        }
        
        // Clock in logic
        const timestamp = new Date().toISOString();
        await db.query(
            'INSERT INTO time_entries (worker_id, clock_in, location) VALUES (?, ?, ?)',
            [workerId, timestamp, location]
        );
        
        return { success: true, timestamp };
    }
};

/**
 * Additional vulnerable worker functions
 */
export const workerSessionController = {
    // Session management without proper security
    createSession: async (workerId: number) => {
        // Weak session token
        const sessionToken = Buffer.from(`${workerId}:${Date.now()}`).toString('base64');
        
        // No expiration time
        await db.query('INSERT INTO worker_sessions (worker_id, token) VALUES (?, ?)',
            [workerId, sessionToken]);
        
        return sessionToken;
    },
    
    // No session invalidation on logout
    logout: async (sessionToken: string) => {
        // Session not actually invalidated, just marked as logged out
        console.log('Logout:', sessionToken);
        // Should: DELETE FROM worker_sessions WHERE token = ?
        return { success: true };
    }
};

/**
 * The secure version would look like this:
 * 
 * loginWithPinSecure: async (workerId: number, pin: string) => {
 *     const worker = await db.queryOne('SELECT * FROM workers WHERE id = ?', [workerId]);
 *     
 *     // Check if account is locked
 *     if (worker.locked_until && worker.locked_until > Date.now()) {
 *         return { success: false, message: "Account locked", lockedUntil: worker.locked_until };
 *     }
 *     
 *     // Check failed attempts
 *     if (worker.failed_login_attempts >= 5) {
 *         await db.query('UPDATE workers SET locked_until = ? WHERE id = ?',
 *             [Date.now() + 30 * 60 * 1000, workerId]);
 *         return { success: false, message: "Account locked due to multiple failed attempts" };
 *     }
 *     
 *     if (worker && await bcrypt.compare(pin, worker.pin_hash)) {
 *         // Reset failed attempts on success
 *         await db.query('UPDATE workers SET failed_login_attempts = 0 WHERE id = ?', [workerId]);
 *         return { success: true, token: generateSecureToken() };
 *     }
 *     
 *     // Increment failed attempts
 *     await db.query('UPDATE workers SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', 
 *         [workerId]);
 *     
 *     return { success: false, attemptsRemaining: 5 - worker.failed_login_attempts - 1 };
 * }
 */