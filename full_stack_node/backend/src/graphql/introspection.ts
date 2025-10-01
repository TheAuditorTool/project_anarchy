/**
 * GraphQL Introspection Configuration with Security Vulnerabilities
 * DO NOT SHIP: Exposes entire API schema to attackers
 */

import { GraphQLSchema, getIntrospectionQuery, buildSchema } from 'graphql';

/**
 * ERROR 396: INTROSPECTION ENABLED IN PRODUCTION - Information Disclosure
 * 
 * GraphQL introspection is enabled in production, allowing attackers
 * to discover the entire API schema, including hidden fields, internal
 * operations, deprecated fields, and the complete data model.
 * 
 * Attack vector:
 * - Attacker sends introspection query
 * - Receives complete schema documentation
 * - Discovers internal APIs, admin endpoints
 * - Identifies deprecated vulnerable fields
 * - Maps entire data model for attacks
 * 
 * Problems:
 * - Full schema exposed to public
 * - Internal fields visible
 * - Admin operations discoverable
 * - Deprecated vulnerable endpoints shown
 * - Complete attack surface mapped
 * 
 * Real-world impact:
 * - Attackers know every possible query
 * - Hidden admin APIs discovered
 * - Internal microservice endpoints exposed
 * - Sensitive field names revealed
 * - Makes targeted attacks trivial
 */
export const introspectionConfig = {
    // ERROR 396: Introspection enabled in production!
    introspection: true, // Should be false in production
    
    // Even worse: GraphQL playground enabled
    playground: true, // Should be false in production
    
    // Debug mode exposes stack traces
    debug: true, // Should be false in production
    
    // Formatting errors with internal details
    formatError: (error: any) => {
        // Exposing full error details including stack traces
        return {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: {
                code: error.extensions?.code,
                // ERROR 396: Exposing internal error details
                stacktrace: error.stack, // Never expose in production!
                originalError: error.originalError,
                internalCode: error.extensions?.internalCode,
                databaseError: error.extensions?.dbError,
                serviceName: error.extensions?.service,
                timestamp: new Date().toISOString()
            }
        };
    },
    
    // Validation rules that allow dangerous queries
    validationRules: [],
    
    // No query depth limiting
    depthLimit: undefined,
    
    // No query complexity limiting
    costLimit: undefined
};

/**
 * ERROR 397: EXPOSING INTERNAL METADATA - System Information Leakage
 * 
 * Custom introspection endpoints that expose internal system metadata,
 * including database schemas, service topology, and infrastructure details.
 * 
 * Problems:
 * - Database table names exposed
 * - Microservice URLs revealed
 * - Internal service names shown
 * - Version information disclosed
 * - Infrastructure details leaked
 */
export const customIntrospectionResolvers = {
    Query: {
        // ERROR 397: Exposes internal system information
        __debug: () => ({
            version: process.env.APP_VERSION || '2.3.1',
            environment: process.env.NODE_ENV || 'production',
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            pid: process.pid,
            platform: process.platform,
            arch: process.arch,
            // Exposing all environment variables!
            env: process.env,
        }),
        
        // Exposes database schema
        __schema_details: async () => ({
            databases: [
                {
                    name: 'main_db',
                    host: process.env.DB_HOST || 'db.internal.example.com',
                    port: process.env.DB_PORT || 5432,
                    type: 'PostgreSQL',
                    version: '13.2',
                    tables: [
                        'users', 'posts', 'comments', 'sessions',
                        'payment_methods', 'api_keys', 'admin_logs'
                    ]
                },
                {
                    name: 'cache_db',
                    host: process.env.REDIS_HOST || 'redis.internal.example.com',
                    port: process.env.REDIS_PORT || 6379,
                    type: 'Redis',
                    version: '6.2'
                }
            ]
        }),
        
        // Exposes internal service topology
        __services: () => ({
            microservices: [
                {
                    name: 'auth-service',
                    url: 'http://auth.internal:3001',
                    version: '1.2.3',
                    endpoints: ['/login', '/refresh', '/admin/impersonate']
                },
                {
                    name: 'payment-service',
                    url: 'http://payment.internal:3002',
                    version: '2.1.0',
                    endpoints: ['/charge', '/refund', '/admin/manual-credit']
                },
                {
                    name: 'notification-service',
                    url: 'http://notify.internal:3003',
                    version: '1.5.2',
                    endpoints: ['/email', '/sms', '/push', '/admin/broadcast']
                }
            ],
            messageQueues: [
                {
                    type: 'RabbitMQ',
                    url: 'amqp://rabbitmq.internal:5672',
                    queues: ['orders', 'payments', 'notifications', 'admin-events']
                }
            ],
            caches: [
                {
                    type: 'Redis',
                    url: 'redis://redis.internal:6379',
                    databases: ['sessions', 'rate-limits', 'feature-flags']
                }
            ]
        }),
        
        // Exposes API keys and secrets structure
        __config: () => ({
            apiKeys: {
                stripe: process.env.STRIPE_KEY ? 'sk_live_***' : 'not configured',
                sendgrid: process.env.SENDGRID_KEY ? 'SG.***' : 'not configured',
                aws: {
                    accessKey: process.env.AWS_ACCESS_KEY_ID?.substring(0, 4) + '***',
                    region: process.env.AWS_REGION,
                    buckets: ['user-uploads', 'backups', 'logs']
                }
            },
            features: {
                rateLimit: process.env.RATE_LIMIT_ENABLED === 'true',
                maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
                debugMode: process.env.DEBUG === 'true',
                adminPanel: process.env.ADMIN_PANEL_ENABLED === 'true'
            },
            security: {
                jwtSecret: process.env.JWT_SECRET ? 'configured' : 'DEFAULT_SECRET',
                sessionSecret: process.env.SESSION_SECRET ? 'configured' : 'DEFAULT',
                encryptionKey: process.env.ENCRYPTION_KEY ? 'configured' : 'INSECURE'
            }
        }),
        
        // Exposes user statistics
        __stats: async () => ({
            users: {
                total: 1523423,
                active: 823421,
                admins: 42,
                suspended: 1523
            },
            posts: {
                total: 5234234,
                published: 4234234,
                draft: 1000000
            },
            revenue: {
                daily: '$12,453.23',
                monthly: '$385,234.12',
                yearly: '$4,523,123.45'
            },
            performance: {
                avgResponseTime: '243ms',
                p95ResponseTime: '1.2s',
                p99ResponseTime: '3.4s',
                errorRate: '0.23%'
            }
        }),
        
        // Exposes deprecated and vulnerable endpoints
        __deprecated: () => ({
            endpoints: [
                {
                    field: 'User.password',
                    reason: 'Was exposing hashed passwords',
                    removedIn: 'v2.0.0',
                    stillAccessible: true // Still works!
                },
                {
                    field: 'User.apiKey',
                    reason: 'Security vulnerability',
                    removedIn: 'v2.1.0',
                    stillAccessible: true
                },
                {
                    field: 'Admin.impersonate',
                    reason: 'Security risk',
                    removedIn: 'v2.2.0',
                    stillAccessible: true
                }
            ],
            migrations: [
                {
                    from: 'REST API v1',
                    to: 'GraphQL',
                    legacyEndpoints: [
                        '/api/v1/users',
                        '/api/v1/admin',
                        '/api/internal/debug'
                    ]
                }
            ]
        })
    }
};

/**
 * Schema with all introspection enabled
 */
export const createVulnerableSchema = (typeDefs: string) => {
    const schema = buildSchema(typeDefs);
    
    // Add introspection extensions
    const extensions = {
        // Expose schema source code
        getSchemaSource: () => typeDefs,
        
        // Expose resolver source code
        getResolverSource: () => customIntrospectionResolvers.toString(),
        
        // Expose all registered types
        getAllTypes: () => {
            const typeMap = schema.getTypeMap();
            return Object.keys(typeMap).map(typeName => ({
                name: typeName,
                type: typeMap[typeName],
                fields: (typeMap[typeName] as any).getFields?.()
            }));
        },
        
        // Expose all queries ever executed
        getQueryLog: () => [
            'query { users { id password } }',
            'mutation { adminLogin(key: "secret") { token } }',
            'query { __debug { env } }'
        ],
        
        // Expose rate limit bypasses
        getRateLimitBypasses: () => [
            'X-Admin-Override: true',
            'X-Internal-Service: auth-service',
            'X-Skip-Rate-Limit: true'
        ]
    };
    
    return { schema, extensions };
};

/**
 * Introspection query logger (logs sensitive queries)
 */
export const introspectionLogger = {
    queries: [] as any[],
    
    log: (query: string, variables: any, context: any) => {
        introspectionLogger.queries.push({
            query,
            variables, // Might contain passwords!
            context: {
                userId: context.userId,
                ip: context.ip,
                headers: context.headers // Might contain auth tokens!
            },
            timestamp: new Date()
        });
    },
    
    // Exposes all logged queries
    getAll: () => introspectionLogger.queries,
    
    // Search queries (exposes sensitive data)
    search: (term: string) => 
        introspectionLogger.queries.filter(q => 
            JSON.stringify(q).includes(term)
        )
};

/**
 * GraphQL middleware that enables everything
 */
export const vulnerableMiddleware = {
    // Allow all introspection queries
    allowIntrospection: () => true,
    
    // Allow playground in production
    allowPlayground: () => true,
    
    // Allow any query depth
    allowDepth: () => true,
    
    // Allow any query complexity
    allowComplexity: () => true,
    
    // Log everything including sensitive data
    logQuery: (query: any) => {
        console.log('Query:', JSON.stringify(query, null, 2));
        return true;
    }
};

/**
 * The secure implementation would:
 * 1. Disable introspection in production
 * 2. Disable GraphQL playground in production
 * 3. Remove all __debug and __internal resolvers
 * 4. Never expose stack traces or internal errors
 * 5. Implement proper error formatting
 * 6. Remove all system information endpoints
 * 7. Implement field-level authorization
 * 8. Use environment-specific configurations
 * 9. Never log sensitive data
 * 10. Implement query whitelisting for production
 */