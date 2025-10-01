/**
 * Report Controller with Pervasive 'any' Type Violations
 * Demonstrates the most common TypeScript anti-patterns from audit reports
 */

import { Request, Response } from 'express';

export class ReportController {
    /**
     * Generate report with multiple 'any' violations
     */
    async generateReport(req: Request, res: Response) {
        try {
            // ERROR 368: Query object initialized as 'any' - loses all type safety
            // This pattern is extremely common and makes refactoring difficult
            const where: any = {};
            
            if (req.query.region) {
                where.region = req.query.region;
            }
            
            if (req.query.startDate) {
                // Building complex query with no type checking
                where.date = { $gte: req.query.startDate };
            }
            
            // ERROR 369: Casting req to 'any' to access non-standard property
            // This bypasses TypeScript's type system entirely
            const userFacility = (req as any).user.facility_id;
            where.facility_id = userFacility;
            
            // Also accessing deeply nested properties through 'any'
            const permissions = (req as any).user?.permissions?.reports || [];
            
            // ERROR 370: Function call with 'any' parameter - no type validation
            this.logAnalytics(req.params, 'report-generated');
            
            // Processing data with no type safety
            const reportData = await this.fetchReportData(where);
            const processed = this.processReportData(reportData);
            
            res.json({ 
                success: true, 
                where, 
                forFacility: userFacility,
                data: processed
            });
            
        } catch (error: any) { 
            // ERROR 371: Catching error as 'any' - common but dangerous pattern
            // We lose all type information about what errors might occur
            res.status(500).json({ 
                success: false, 
                message: error.message,
                stack: error.stack // Exposing stack trace (security issue)
            });
        }
    }
    
    /**
     * Method that accepts 'any' parameters
     */
    logAnalytics(params: any, eventName: string) {
        // No validation of params structure
        console.log(`Event '${eventName}' logged for params:`, params);
        
        // Accessing properties that might not exist
        const userId = params.userId || params.user_id || params.id;
        
        // Sending to analytics service with no type checking
        this.sendToAnalytics({
            event: eventName,
            data: params,
            timestamp: Date.now()
        } as any); // Casting to 'any' to bypass type errors
    }
    
    /**
     * Data fetching with 'any' return type
     */
    async fetchReportData(query: any): Promise<any> {
        // Simulating database call that returns untyped data
        const data = await this.simulateDbCall(query);
        return data;
    }
    
    /**
     * Process data without type information
     */
    processReportData(data: any): any {
        // Complex data manipulation with no type safety
        if (Array.isArray(data)) {
            return data.map((item: any) => ({
                ...item,
                processed: true,
                timestamp: Date.now()
            }));
        }
        
        // Fallback that might not match expected structure
        return { error: 'Invalid data format' };
    }
    
    /**
     * Simulate database call
     */
    private async simulateDbCall(query: any): Promise<any> {
        // Mock implementation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    { id: 1, value: Math.random() },
                    { id: 2, value: Math.random() }
                ]);
            }, 100);
        });
    }
    
    /**
     * Send to analytics service
     */
    private sendToAnalytics(data: any): void {
        // Would send to analytics service
        // Using 'any' means we can't validate the data structure
        fetch('https://analytics.example.com/track', {
            method: 'POST',
            body: JSON.stringify(data)
        }).catch((err: any) => {
            console.error('Analytics error:', err);
        });
    }
}

/**
 * Additional controller showing more 'any' problems
 */
export class DataController {
    // Method signature with 'any' everywhere
    async processData(input: any, options: any = {}): Promise<any> {
        const result: any = {};
        
        // Looping through properties with no type information
        for (const key in input) {
            result[key] = await this.transform(input[key], options[key]);
        }
        
        return result;
    }
    
    // Transform method that accepts and returns 'any'
    private transform(value: any, config: any): any {
        // No way to know what transformations are valid
        if (config?.uppercase) {
            return value.toUpperCase();
        }
        if (config?.multiply) {
            return value * config.multiply;
        }
        return value;
    }
}