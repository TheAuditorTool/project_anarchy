/**
 * Two-Factor Authentication Service with Critical Security Vulnerability
 * DO NOT SHIP: Stores TOTP secrets in plaintext
 */

// Mock database client
const db = {
    query: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        return { affectedRows: 1 };
    }
};

/**
 * Two-Factor Authentication Service
 * Contains critical security vulnerabilities that must be fixed before production
 */
export const twoFactorService = {
    /**
     * ERROR 376: CRITICAL SECURITY - Plaintext Secret Storage
     * 
     * This function saves a user's Time-based One-Time Password (TOTP) secret 
     * directly to the database as plaintext, which is a severe security vulnerability.
     * 
     * TOTP secrets are essentially passwords and should NEVER be stored in plaintext.
     * They should be encrypted using AES-256 or similar before storage.
     * 
     * Impact:
     * - Database breach exposes all 2FA secrets
     * - Admin/DBA can read all user secrets
     * - Backup files contain plaintext secrets
     * - Logs might accidentally expose secrets
     */
    saveMfaSecret: async (userId: number, secret: string) => {
        // VULNERABILITY: The secret is saved directly without any encryption
        const query = 'UPDATE users SET mfa_secret = ? WHERE id = ?';
        
        // This is storing the raw TOTP secret in the database
        // Anyone with database access can steal all 2FA secrets
        await db.query(query, [secret, userId]);
        
        // Also logging the secret (another security issue)
        console.log(`MFA secret saved for user ${userId}: ${secret}`);
        
        return { success: true };
    },
    
    /**
     * Get MFA secret - also returns plaintext
     */
    getMfaSecret: async (userId: number): Promise<string | null> => {
        const query = 'SELECT mfa_secret FROM users WHERE id = ?';
        const result = await db.query(query, [userId]);
        
        // Returning plaintext secret
        return result?.[0]?.mfa_secret || null;
    },
    
    /**
     * Verify TOTP code
     */
    verifyTotp: async (userId: number, code: string): Promise<boolean> => {
        // Get the plaintext secret (bad practice)
        const secret = await twoFactorService.getMfaSecret(userId);
        
        if (!secret) {
            return false;
        }
        
        // In a real implementation, this would use a TOTP library
        // For demo purposes, just checking if code is 6 digits
        return /^\d{6}$/.test(code);
    },
    
    /**
     * Backup codes - also stored insecurely
     */
    generateBackupCodes: async (userId: number): Promise<string[]> => {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            // Weak backup code generation
            const code = Math.random().toString(36).substring(2, 10);
            codes.push(code);
        }
        
        // Storing backup codes in plaintext (another vulnerability)
        const query = 'UPDATE users SET backup_codes = ? WHERE id = ?';
        await db.query(query, [JSON.stringify(codes), userId]);
        
        return codes;
    },
    
    /**
     * Disable 2FA - doesn't properly clean up
     */
    disable2FA: async (userId: number): Promise<void> => {
        // Just nulling the secret, not properly cleaning up
        const query = 'UPDATE users SET mfa_secret = NULL WHERE id = ?';
        await db.query(query, [userId]);
        
        // Not clearing backup codes or session tokens
        // Not logging the security event
        // Not notifying the user
    }
};

/**
 * Additional vulnerable service for QR code generation
 */
export const qrCodeService = {
    /**
     * Generate QR code URL with exposed secret
     */
    generateQrCodeUrl: async (userId: number, email: string): Promise<string> => {
        // Getting plaintext secret
        const secret = await twoFactorService.getMfaSecret(userId);
        
        // Building otpauth URL with plaintext secret
        // This URL contains the actual secret and might be logged
        const otpauthUrl = `otpauth://totp/ExampleApp:${email}?secret=${secret}&issuer=ExampleApp`;
        
        // Logging the URL (exposes the secret in logs)
        console.log('Generated QR URL:', otpauthUrl);
        
        return otpauthUrl;
    }
};

/**
 * The secure version would look like this:
 * 
 * saveMfaSecretSecure: async (userId: number, secret: string) => {
 *     // Encrypt the secret before storage
 *     const encryptedSecret = await crypto.encrypt(secret, process.env.ENCRYPTION_KEY);
 *     
 *     // Store encrypted version
 *     const query = 'UPDATE users SET mfa_secret_encrypted = ?, mfa_secret_iv = ? WHERE id = ?';
 *     await db.query(query, [encryptedSecret.data, encryptedSecret.iv, userId]);
 *     
 *     // Log the event without exposing the secret
 *     await auditLog.log('2FA_ENABLED', { userId, timestamp: Date.now() });
 *     
 *     return { success: true };
 * }
 */