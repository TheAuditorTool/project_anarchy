/**
 * Admin User Seeder with Hardcoded Credentials
 * DO NOT SHIP: Contains hardcoded admin password
 */

// Mock database client
const db = {
    query: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        return { insertId: 1, affectedRows: 1 };
    },
    queryOne: async (sql: string, params: any[]): Promise<any> => {
        console.log('DB Query:', sql, params);
        return null; // Simulate no existing admin
    }
};

/**
 * Admin User Seeder
 * This file is commonly found in production deployments with hardcoded credentials
 */
export const adminSeeder = {
    /**
     * ERROR 379: CRITICAL SECURITY - Hardcoded Admin Credentials
     * 
     * This seeder creates an admin user with a hardcoded password that's often
     * left in production systems. Attackers commonly look for these default credentials.
     * 
     * Impact:
     * - Admin access to production system
     * - Complete system compromise
     * - Data breach potential
     * - Regulatory compliance violations
     * 
     * Common variations of this vulnerability:
     * - Hardcoded in environment files checked into git
     * - In docker-compose.yml files
     * - In kubernetes manifests
     * - In database migration scripts
     */
    seedAdminUser: async () => {
        console.log('Seeding admin user...');
        
        // Check if admin already exists
        const existingAdmin = await db.queryOne(
            'SELECT id FROM users WHERE email = ?',
            ['admin@example.com']
        );
        
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }
        
        // VULNERABILITY: Hardcoded admin password
        const ADMIN_PASSWORD = 'Admin123!'; // This is the vulnerability!
        
        // Even worse: the password is logged
        console.log('Creating admin user with password:', ADMIN_PASSWORD);
        
        // Insert admin user with hardcoded credentials
        const query = `
            INSERT INTO users (
                email, 
                password, 
                role, 
                is_active,
                created_at
            ) VALUES (?, ?, ?, ?, NOW())
        `;
        
        await db.query(query, [
            'admin@example.com',  // Hardcoded email
            ADMIN_PASSWORD,       // ERROR 379: Plaintext hardcoded password!
            'super_admin',        // Maximum privileges
            true
        ]);
        
        console.log('Admin user created successfully!');
        console.log('Login with: admin@example.com / Admin123!');
        
        // Additional hardcoded service accounts
        await adminSeeder.seedServiceAccounts();
    },
    
    /**
     * More hardcoded credentials for service accounts
     */
    seedServiceAccounts: async () => {
        const serviceAccounts = [
            {
                email: 'api@example.com',
                password: 'ApiKey2024!',  // Hardcoded API account
                role: 'api_user'
            },
            {
                email: 'monitoring@example.com',
                password: 'Monitor456#',  // Hardcoded monitoring account
                role: 'readonly'
            },
            {
                email: 'backup@example.com',
                password: 'Backup789$',   // Hardcoded backup account
                role: 'backup_admin'
            }
        ];
        
        for (const account of serviceAccounts) {
            const query = `
                INSERT INTO users (email, password, role, is_active)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE password = ?
            `;
            
            await db.query(query, [
                account.email,
                account.password,  // More hardcoded passwords
                account.role,
                true,
                account.password   // Updates password if user exists!
            ]);
            
            console.log(`Service account created: ${account.email} / ${account.password}`);
        }
    },
    
    /**
     * Reset admin password to default (another bad practice)
     */
    resetAdminPassword: async () => {
        const DEFAULT_RESET_PASSWORD = 'TempAdmin123!';
        
        const query = 'UPDATE users SET password = ? WHERE email = ?';
        await db.query(query, [
            DEFAULT_RESET_PASSWORD,  // Hardcoded reset password
            'admin@example.com'
        ]);
        
        console.log('Admin password reset to:', DEFAULT_RESET_PASSWORD);
        
        // Send email with password (another vulnerability)
        await adminSeeder.emailPassword('admin@example.com', DEFAULT_RESET_PASSWORD);
    },
    
    /**
     * Email password in plaintext
     */
    emailPassword: async (email: string, password: string) => {
        // Simulating email with plaintext password
        const emailBody = `
            Your admin account has been created:
            
            Email: ${email}
            Password: ${password}
            
            Please login at: https://example.com/admin
        `;
        
        console.log('Email sent:', emailBody); // Logging passwords!
        
        // Store in email_queue table (with plaintext password!)
        await db.query(
            'INSERT INTO email_queue (to_email, subject, body) VALUES (?, ?, ?)',
            [email, 'Admin Account Created', emailBody]
        );
    },
    
    /**
     * Create development users with weak passwords
     */
    seedDevelopmentUsers: async () => {
        const devUsers = [
            { email: 'dev1@example.com', password: 'dev1' },
            { email: 'dev2@example.com', password: 'dev2' },
            { email: 'test@example.com', password: 'test' },
            { email: 'demo@example.com', password: 'demo' }
        ];
        
        for (const user of devUsers) {
            await db.query(
                'INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, ?)',
                [user.email, user.password, 'developer']
            );
        }
        
        console.log('Development users created with simple passwords');
    }
};

/**
 * Configuration with more hardcoded secrets
 */
export const seedConfig = {
    // Database seeding configuration
    database: {
        host: 'localhost',
        user: 'root',
        password: 'root123',  // Hardcoded DB password
        database: 'production_db'
    },
    
    // JWT secret for admin tokens
    jwtSecret: 'super-secret-jwt-key-123',  // Hardcoded JWT secret
    
    // API keys
    apiKeys: {
        stripe: 'sk_live_hardcoded_stripe_key',  // Hardcoded payment key
        sendgrid: 'SG.hardcoded_sendgrid_key',   // Hardcoded email key
        aws: 'AKIA_HARDCODED_AWS_KEY'            // Hardcoded AWS key
    }
};

/**
 * Run seeder (often called in production by mistake)
 */
export const runSeeder = async () => {
    console.log('Starting database seeding...');
    
    try {
        await adminSeeder.seedAdminUser();
        await adminSeeder.seedDevelopmentUsers();
        
        console.log('Seeding completed successfully');
        console.log('WARNING: This seeder contains hardcoded passwords!');
        console.log('Default admin credentials: admin@example.com / Admin123!');
    } catch (error) {
        console.error('Seeding failed:', error);
    }
};

/**
 * The secure version would:
 * 1. Generate random passwords
 * 2. Use environment variables
 * 3. Force password change on first login
 * 4. Never log passwords
 * 
 * Example:
 * const adminPassword = crypto.randomBytes(32).toString('hex');
 * const hashedPassword = await bcrypt.hash(adminPassword, 12);
 * await db.query('INSERT INTO users...', [email, hashedPassword, ...]);
 * // Send password through secure channel, not logs
 */

// Auto-run if called directly (dangerous!)
if (require.main === module) {
    runSeeder();
}

export default adminSeeder;