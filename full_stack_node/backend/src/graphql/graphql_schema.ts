/**
 * GraphQL Schema with Critical Security Vulnerabilities
 * DO NOT SHIP: Allows query depth attacks, introspection, and resource exhaustion
 */

import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt, GraphQLFloat } from 'graphql';

/**
 * ERROR 392: UNBOUNDED QUERY DEPTH - Denial of Service Attack Vector
 * 
 * This schema allows infinitely nested queries that can exhaust
 * server resources with a single malicious query.
 * 
 * Attack example:
 * query {
 *   user {
 *     posts {
 *       author {
 *         posts {
 *           author {
 *             posts { ... } // Continues forever
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * 
 * Problems:
 * - No query depth limiting
 * - No query complexity analysis
 * - No timeout on resolver execution
 * - Circular references allowed
 * - No cost analysis
 * 
 * Real-world impact:
 * - Single query can crash server
 * - Memory exhaustion
 * - CPU exhaustion  
 * - Database connection pool exhaustion
 * - Complete service outage
 */

// User type with dangerous circular references
const UserType: any = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        // ERROR 392: Circular reference without depth limiting
        posts: {
            type: new GraphQLList(PostType),
            resolve: async (user) => {
                // This will be called recursively forever
                return await fetchUserPosts(user.id);
            }
        },
        // Another circular path
        friends: {
            type: new GraphQLList(UserType), // Self-reference!
            resolve: async (user) => {
                return await fetchUserFriends(user.id);
            }
        },
        // Expensive computed field
        analytics: {
            type: AnalyticsType,
            resolve: async (user) => {
                // Expensive operation for each user
                return await computeExpensiveAnalytics(user.id);
            }
        }
    })
});

// Post type that references User (circular)
const PostType: any = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
        // Circular reference back to User
        author: {
            type: UserType,
            resolve: async (post) => {
                return await fetchPostAuthor(post.authorId);
            }
        },
        // Can fetch unlimited comments
        comments: {
            type: new GraphQLList(CommentType),
            resolve: async (post) => {
                return await fetchAllComments(post.id); // No pagination!
            }
        },
        // Nested posts (related posts)
        relatedPosts: {
            type: new GraphQLList(PostType), // Self-reference!
            resolve: async (post) => {
                return await fetchRelatedPosts(post.id);
            }
        }
    })
});

// Comment type adding another layer
const CommentType: any = new GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
        id: { type: GraphQLString },
        text: { type: GraphQLString },
        // Back to User
        author: {
            type: UserType,
            resolve: async (comment) => {
                return await fetchCommentAuthor(comment.authorId);
            }
        },
        // Back to Post
        post: {
            type: PostType,
            resolve: async (comment) => {
                return await fetchCommentPost(comment.postId);
            }
        },
        // Nested replies (recursive)
        replies: {
            type: new GraphQLList(CommentType), // Self-reference!
            resolve: async (comment) => {
                return await fetchCommentReplies(comment.id);
            }
        }
    })
});

/**
 * ERROR 393: QUERY COMPLEXITY EXPLOSION - Resource Exhaustion
 * 
 * This schema allows queries that exponentially increase in complexity,
 * consuming massive amounts of resources.
 * 
 * Attack example:
 * query {
 *   search(limit: 1000) {
 *     ... on User {
 *       posts(limit: 1000) {
 *         comments(limit: 1000) {
 *           replies(limit: 1000) {
 *             # 1000 * 1000 * 1000 * 1000 = 1 trillion operations!
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * 
 * Problems:
 * - No query complexity scoring
 * - No rate limiting per complexity
 * - Arguments allow huge limits
 * - Union types multiply complexity
 * - No query cost analysis
 */

// Analytics type with expensive computations
const AnalyticsType = new GraphQLObjectType({
    name: 'Analytics',
    fields: {
        // ERROR 393: Each field triggers expensive computation
        totalViews: {
            type: GraphQLInt,
            resolve: async (parent, args) => {
                // Scans entire database
                return await countAllViews();
            }
        },
        averageEngagement: {
            type: GraphQLFloat,
            resolve: async () => {
                // Complex aggregation
                return await calculateAverageEngagement();
            }
        },
        trendingTopics: {
            type: new GraphQLList(GraphQLString),
            args: {
                limit: { type: GraphQLInt } // No max limit!
            },
            resolve: async (parent, args) => {
                // Can request millions of topics
                return await fetchTrendingTopics(args.limit || 1000000);
            }
        },
        // Recursive analytics
        comparisons: {
            type: new GraphQLList(AnalyticsType), // Self-reference!
            resolve: async () => {
                return await fetchComparisons();
            }
        }
    }
});

// Root query with dangerous operations
const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        // Fetch all users (no pagination)
        users: {
            type: new GraphQLList(UserType),
            resolve: async () => {
                return await fetchAllUsers(); // Returns entire user table!
            }
        },
        // Search without limits
        search: {
            type: new GraphQLList(UserType),
            args: {
                query: { type: GraphQLString },
                limit: { type: GraphQLInt } // No maximum enforced
            },
            resolve: async (parent, args) => {
                // Can return unlimited results
                return await searchUsers(args.query, args.limit || 999999);
            }
        },
        // Expensive aggregation
        globalAnalytics: {
            type: AnalyticsType,
            resolve: async () => {
                // Triggers cascade of expensive operations
                return await computeGlobalAnalytics();
            }
        },
        // Allows arbitrary deep nesting
        node: {
            type: UserType,
            args: {
                id: { type: GraphQLString }
            },
            resolve: async (parent, args) => {
                // Entry point for deep nesting attacks
                return await fetchUser(args.id);
            }
        }
    }
});

// Helper functions (simulate database calls)
async function fetchUserPosts(userId: string) {
    // No limit on posts returned
    return Array(100).fill(null).map((_, i) => ({
        id: `post-${i}`,
        authorId: userId,
        title: `Post ${i}`
    }));
}

async function fetchUserFriends(userId: string) {
    // Returns many friends, each can be queried deeply
    return Array(50).fill(null).map((_, i) => ({
        id: `user-${i}`,
        name: `Friend ${i}`
    }));
}

async function fetchPostAuthor(authorId: string) {
    return { id: authorId, name: 'Author' };
}

async function fetchAllComments(postId: string) {
    // No pagination!
    return Array(200).fill(null).map((_, i) => ({
        id: `comment-${i}`,
        postId,
        text: `Comment ${i}`
    }));
}

async function fetchRelatedPosts(postId: string) {
    return Array(20).fill(null).map((_, i) => ({
        id: `related-${i}`,
        title: `Related ${i}`
    }));
}

async function fetchCommentAuthor(authorId: string) {
    return { id: authorId, name: 'Commenter' };
}

async function fetchCommentPost(postId: string) {
    return { id: postId, title: 'Original Post' };
}

async function fetchCommentReplies(commentId: string) {
    return Array(50).fill(null).map((_, i) => ({
        id: `reply-${i}`,
        text: `Reply ${i}`
    }));
}

async function fetchAllUsers() {
    // Returns entire user database!
    return Array(10000).fill(null).map((_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`
    }));
}

async function searchUsers(query: string | undefined, limit: number) {
    return Array(limit).fill(null).map((_, i) => ({
        id: `search-${i}`,
        name: `Result ${i}`
    }));
}

async function countAllViews() {
    // Expensive database aggregation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 1000000;
}

async function calculateAverageEngagement() {
    // Complex calculation
    await new Promise(resolve => setTimeout(resolve, 500));
    return 75.5;
}

async function fetchTrendingTopics(limit: number) {
    return Array(limit).fill(null).map((_, i) => `Topic ${i}`);
}

async function fetchComparisons() {
    return Array(10).fill(null).map(() => ({}));
}

async function computeExpensiveAnalytics(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {};
}

async function computeGlobalAnalytics() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {};
}

async function fetchUser(id: string) {
    return { id, name: `User ${id}` };
}

// Export the vulnerable schema
export const schema = new GraphQLSchema({
    query: RootQueryType,
    // No query depth limiter middleware
    // No query complexity analyzer
    // No rate limiting
    // No timeout configuration
});

/**
 * The secure implementation would:
 * 1. Use graphql-depth-limit to limit query depth
 * 2. Use graphql-query-complexity for complexity analysis
 * 3. Implement query cost analysis
 * 4. Add timeouts on resolver execution
 * 5. Paginate all list fields
 * 6. Remove circular references or limit them
 * 7. Implement rate limiting based on complexity
 * 8. Disable introspection in production
 * 9. Use DataLoader to batch database queries
 * 10. Implement field-level authorization
 */