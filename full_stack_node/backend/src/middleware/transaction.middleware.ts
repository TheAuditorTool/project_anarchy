/**
 * Transaction Middleware with Complex TypeScript 'any' Violations
 * Demonstrates the problematic res.end function override pattern
 */

import { Request, Response, NextFunction } from 'express';

// Mock logger utility
const logger = {
    error: (message: string, err: any) => console.error(message, err)
};

// Mock commit function
const commitTransaction = async () => Promise.resolve();

/**
 * This middleware demonstrates multiple TypeScript anti-patterns related to 'any'
 * that make the code difficult to refactor and type-check properly
 */
export function manualTransaction(req: Request, res: Response, next: NextFunction) {
    const originalEnd = res.end;

    // ERROR 364: Function override using '...args: any[]' - loses all type safety
    // This pattern makes it impossible to know what arguments res.end accepts
    res.end = function(...args: any[]) {
        // ERROR 365: Using Promise without proper type annotation
        commitTransaction().then(() => {
            // ERROR 366: Using .apply with 'any[]' arguments - completely untyped
            // The auditor cannot verify if the arguments are correct
            originalEnd.apply(res, args);
        }).catch((err) => {
            logger.error('Failed to commit transaction:', err);
            // ERROR 367: Duplicated untyped .apply in catch block
            // Error handling path also lacks type safety
            originalEnd.apply(res, args);
        });
        return res;
    };
    
    next();
}

/**
 * Additional middleware showing more 'any' problems
 */
export function transactionLogger(req: Request, res: Response, next: NextFunction) {
    // Using 'any' for request body
    const body: any = req.body;
    
    // Using 'any' for query parameters
    const query: any = req.query;
    
    // Function that accepts 'any' and returns 'any'
    const processData = (data: any): any => {
        // No type checking possible here
        return data.someProperty?.nested?.value || 'default';
    };
    
    // Extending request object with untyped property
    (req as any).transactionId = Math.random().toString(36);
    
    // Calling function with untyped arguments
    processData({ body, query });
    
    next();
}

/**
 * The worst case: middleware that completely breaks type safety
 */
export function unsafeMiddleware(req: any, res: any, next: any) {
    // Everything is 'any' - no type checking at all
    req.customProperty = 'value';
    res.customMethod = function() { return 'unsafe'; };
    next();
}