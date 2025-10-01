/**
 * GraphQL Resolvers with N+1 Query Problems
 * DO NOT SHIP: Causes database performance collapse under load
 */

// Mock database client
const db = {
    query: async (sql: string, params?: any[]): Promise<any[]> => {
        console.log(`DB Query: ${sql}`, params);
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return [];
    },
    queryOne: async (sql: string, params?: any[]): Promise<any> => {
        console.log(`DB Query: ${sql}`, params);
        await new Promise(resolve => setTimeout(resolve, 10));
        return {};
    }
};

/**
 * ERROR 394: CLASSIC N+1 QUERY PROBLEM - Database Performance Killer
 * 
 * This resolver implementation makes a separate database query for
 * each item in a list, turning what should be 2 queries into N+1 queries.
 * 
 * Example disaster scenario:
 * - Query requests 100 posts with their authors
 * - Result: 1 query for posts + 100 queries for authors = 101 queries
 * - With 1000 posts: 1001 queries
 * - With nested fields: exponential growth
 * 
 * Problems:
 * - No query batching
 * - No DataLoader implementation
 * - No JOIN queries
 * - No eager loading
 * - Database connection pool exhaustion
 * 
 * Real-world impact:
 * - Page load times go from 100ms to 10+ seconds
 * - Database CPU hits 100%
 * - Connection pool exhausted
 * - Cascading failures across services
 * - Cloud database costs skyrocket
 */
export const resolvers = {
    Query: {
        // Get all posts - seems innocent enough
        posts: async () => {
            // Initial query for all posts
            const posts = await db.query('SELECT * FROM posts');
            return posts;
        },
        
        // Get all users
        users: async () => {
            const users = await db.query('SELECT * FROM users');
            return users;
        },
        
        // Get all comments
        comments: async () => {
            const comments = await db.query('SELECT * FROM comments');
            return comments;
        }
    },
    
    Post: {
        // ERROR 394: N+1 Query - Fetches author for EACH post individually
        author: async (post: any) => {
            // This runs once for EVERY post in the list!
            // 100 posts = 100 separate queries
            const author = await db.queryOne(
                'SELECT * FROM users WHERE id = ?',
                [post.authorId]
            );
            return author;
        },
        
        // Another N+1: Fetches comments for EACH post
        comments: async (post: any) => {
            // Another query per post!
            const comments = await db.query(
                'SELECT * FROM comments WHERE postId = ?',
                [post.id]
            );
            return comments;
        },
        
        // Another N+1: Fetches tags for EACH post
        tags: async (post: any) => {
            // Yet another query per post!
            const tags = await db.query(
                'SELECT t.* FROM tags t ' +
                'JOIN post_tags pt ON t.id = pt.tagId ' +
                'WHERE pt.postId = ?',
                [post.id]
            );
            return tags;
        },
        
        // Another N+1: Fetches likes count for EACH post
        likeCount: async (post: any) => {
            const result = await db.queryOne(
                'SELECT COUNT(*) as count FROM likes WHERE postId = ?',
                [post.id]
            );
            return result.count;
        },
        
        // Another N+1: Check if user liked EACH post
        isLikedByMe: async (post: any, args: any, context: any) => {
            const result = await db.queryOne(
                'SELECT * FROM likes WHERE postId = ? AND userId = ?',
                [post.id, context.userId]
            );
            return !!result;
        }
    },
    
    User: {
        // ERROR 394 continued: N+1 for user's posts
        posts: async (user: any) => {
            // Separate query for each user's posts
            const posts = await db.query(
                'SELECT * FROM posts WHERE authorId = ?',
                [user.id]
            );
            return posts;
        },
        
        // N+1 for user's followers
        followers: async (user: any) => {
            const followers = await db.query(
                'SELECT u.* FROM users u ' +
                'JOIN follows f ON u.id = f.followerId ' +
                'WHERE f.followingId = ?',
                [user.id]
            );
            return followers;
        },
        
        // N+1 for user's following
        following: async (user: any) => {
            const following = await db.query(
                'SELECT u.* FROM users u ' +
                'JOIN follows f ON u.id = f.followingId ' +
                'WHERE f.followerId = ?',
                [user.id]
            );
            return following;
        },
        
        // N+1 for user's profile
        profile: async (user: any) => {
            const profile = await db.queryOne(
                'SELECT * FROM profiles WHERE userId = ?',
                [user.id]
            );
            return profile;
        }
    },
    
    Comment: {
        // N+1 for comment author
        author: async (comment: any) => {
            const author = await db.queryOne(
                'SELECT * FROM users WHERE id = ?',
                [comment.authorId]
            );
            return author;
        },
        
        // N+1 for comment post
        post: async (comment: any) => {
            const post = await db.queryOne(
                'SELECT * FROM posts WHERE id = ?',
                [comment.postId]
            );
            return post;
        },
        
        // N+1 for comment replies (nested comments)
        replies: async (comment: any) => {
            const replies = await db.query(
                'SELECT * FROM comments WHERE parentId = ?',
                [comment.id]
            );
            return replies;
        }
    }
};

/**
 * ERROR 395: NESTED N+1 EXPLOSION - Exponential Query Growth
 * 
 * When N+1 problems are nested, the number of queries grows
 * exponentially, not linearly.
 * 
 * Example query:
 * {
 *   posts {                    # 1 query
 *     author {                 # N queries (one per post)
 *       followers {            # N*M queries (M followers per author)
 *         posts {              # N*M*P queries (P posts per follower)
 *           comments {         # N*M*P*C queries (C comments per post)
 *             author {         # N*M*P*C*1 queries
 *               profile {      # N*M*P*C*1 queries
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * 
 * With just 10 items at each level:
 * 10 * 10 * 10 * 10 * 1 * 1 = 10,000 database queries!
 * 
 * Problems:
 * - Exponential query growth
 * - Response times in minutes
 * - Database connection pool exhausted
 * - Memory exhaustion from result sets
 * - Network bandwidth saturation
 */
export const complexResolvers = {
    Query: {
        // ERROR 395: Entry point for nested N+1 explosion
        feed: async (parent: any, args: any, context: any) => {
            // Get user's feed posts
            const posts = await db.query(
                'SELECT * FROM posts WHERE authorId IN ' +
                '(SELECT followingId FROM follows WHERE followerId = ?) ' +
                'ORDER BY createdAt DESC LIMIT 50',
                [context.userId]
            );
            
            // Each post will trigger author query
            // Each author will trigger followers query
            // Each follower will trigger posts query
            // ... and so on
            return posts;
        },
        
        // Another nested N+1 disaster
        trending: async () => {
            // Get trending posts
            const posts = await db.query(
                'SELECT p.*, COUNT(l.id) as likeCount ' +
                'FROM posts p ' +
                'LEFT JOIN likes l ON p.id = l.postId ' +
                'GROUP BY p.id ' +
                'ORDER BY likeCount DESC ' +
                'LIMIT 100'
            );
            
            // Still triggers N+1 for all nested fields!
            return posts;
        },
        
        // Search with N+1
        search: async (parent: any, args: any) => {
            const { query, type } = args;
            
            if (type === 'posts') {
                const posts = await db.query(
                    'SELECT * FROM posts WHERE title LIKE ? OR content LIKE ?',
                    [`%${query}%`, `%${query}%`]
                );
                // Each result triggers N+1 queries
                return { posts, users: [], comments: [] };
            }
            
            if (type === 'users') {
                const users = await db.query(
                    'SELECT * FROM users WHERE name LIKE ? OR bio LIKE ?',
                    [`%${query}%`, `%${query}%`]
                );
                // Each user triggers N+1 queries
                return { posts: [], users, comments: [] };
            }
            
            // Search everything (N+1 nightmare)
            const posts = await db.query(
                'SELECT * FROM posts WHERE title LIKE ?',
                [`%${query}%`]
            );
            const users = await db.query(
                'SELECT * FROM users WHERE name LIKE ?',
                [`%${query}%`]
            );
            const comments = await db.query(
                'SELECT * FROM comments WHERE text LIKE ?',
                [`%${query}%`]
            );
            
            return { posts, users, comments };
        }
    },
    
    SearchResult: {
        // Each search result type triggers more N+1 queries
        posts: (result: any) => result.posts,
        users: (result: any) => result.users,
        comments: (result: any) => result.comments
    }
};

/**
 * Query monitoring to show the disaster
 */
let queryCount = 0;
let queryLog: string[] = [];

export const monitoredDb = {
    query: async (sql: string, params?: any[]) => {
        queryCount++;
        queryLog.push(sql);
        return db.query(sql, params);
    },
    queryOne: async (sql: string, params?: any[]) => {
        queryCount++;
        queryLog.push(sql);
        return db.queryOne(sql, params);
    },
    getStats: () => ({
        totalQueries: queryCount,
        uniqueQueries: new Set(queryLog).size,
        queryLog: queryLog.slice(-100) // Last 100 queries
    }),
    reset: () => {
        queryCount = 0;
        queryLog = [];
    }
};

/**
 * The correct implementation would:
 * 1. Use DataLoader for batching and caching
 * 2. Implement eager loading with JOINs
 * 3. Use query builders with includes
 * 4. Implement field-level query optimization
 * 5. Use database views for complex queries
 * 6. Implement query result caching
 * 7. Use projection to select only needed fields
 * 8. Implement pagination at resolver level
 * 9. Use database connection pooling properly
 * 10. Monitor and alert on N+1 patterns
 */