/**
 * Product Admin Routes with Critical Authorization Vulnerability
 * DO NOT SHIP: Admin endpoints accessible to all authenticated users
 */

import { Router, Request, Response } from 'express';

// Mock middleware - only checks if user is logged in, not if they're admin
const authenticateToken = (req: Request, res: Response, next: any) => {
    const token = req.headers.authorization;
    if (token) {
        // Just checking if token exists, not validating permissions
        (req as any).user = { id: 1, role: 'user' }; // Regular user, not admin
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
};

// CRITICAL: The 'requireAdmin' middleware is NOT imported or used
// This middleware should exist and check if user.role === 'admin'
// const requireAdmin = (req: Request, res: Response, next: any) => {
//     if ((req as any).user?.role === 'admin') {
//         next();
//     } else {
//         res.status(403).json({ error: 'Admin access required' });
//     }
// };

const router = Router();

/**
 * ERROR 377: CRITICAL AUTHORIZATION BYPASS - Missing Admin Check
 * 
 * This endpoint should be protected by requireAdmin middleware but it's missing.
 * Any authenticated user (even regular users) can access admin functionality.
 * 
 * Impact:
 * - Regular users can create/modify products
 * - Users can manipulate pricing
 * - Users can delete products
 * - Complete compromise of product catalog integrity
 */
router.post('/variants/create', authenticateToken, (req: Request, res: Response) => {
    // This should only be accessible to admins!
    const { productId, name, price, sku } = req.body;
    
    // Creating product variant without checking if user is admin
    console.log('Creating variant:', { productId, name, price, sku });
    
    res.json({ 
        message: "Variant created successfully by non-admin!",
        variant: {
            id: Math.floor(Math.random() * 10000),
            productId,
            name,
            price,
            sku,
            createdBy: (req as any).user.id // Regular user creating admin content
        }
    });
});

/**
 * More admin endpoints without proper authorization
 */
router.delete('/products/:id', authenticateToken, (req: Request, res: Response) => {
    // Missing requireAdmin - any user can delete products!
    const productId = req.params.id;
    
    console.log(`Product ${productId} deleted by user ${(req as any).user.id}`);
    
    res.json({ 
        message: "Product deleted",
        deletedBy: (req as any).user.id
    });
});

router.put('/products/:id/price', authenticateToken, (req: Request, res: Response) => {
    // Missing requireAdmin - any user can change prices!
    const productId = req.params.id;
    const { price } = req.body;
    
    console.log(`Price updated to ${price} for product ${productId}`);
    
    res.json({ 
        message: "Price updated",
        product: { id: productId, newPrice: price }
    });
});

router.post('/bulk-import', authenticateToken, (req: Request, res: Response) => {
    // Missing requireAdmin - any user can bulk import!
    const { products } = req.body;
    
    console.log(`Bulk importing ${products?.length || 0} products`);
    
    res.json({ 
        message: "Bulk import completed",
        imported: products?.length || 0
    });
});

router.post('/inventory/adjust', authenticateToken, (req: Request, res: Response) => {
    // Missing requireAdmin - any user can adjust inventory!
    const { productId, quantity, reason } = req.body;
    
    console.log(`Inventory adjusted: ${quantity} units for product ${productId}`);
    
    res.json({ 
        message: "Inventory adjusted",
        adjustment: { productId, quantity, reason }
    });
});

/**
 * Export settings - should definitely be admin only
 */
router.get('/export/all-products', authenticateToken, (req: Request, res: Response) => {
    // Missing requireAdmin - exposing all product data
    
    res.json({
        products: [
            { id: 1, name: 'Product 1', cost: 10, price: 20, supplier: 'Supplier A' },
            { id: 2, name: 'Product 2', cost: 15, price: 30, supplier: 'Supplier B' }
        ],
        exportedBy: (req as any).user.id,
        warning: 'This data should only be accessible to admins!'
    });
});

/**
 * Settings endpoint - critical admin function
 */
router.put('/settings/store', authenticateToken, (req: Request, res: Response) => {
    // Missing requireAdmin - any user can change store settings!
    const settings = req.body;
    
    console.log('Store settings updated:', settings);
    
    res.json({ 
        message: "Store settings updated",
        settings
    });
});

/**
 * The secure version would look like this:
 * 
 * router.post('/variants/create', 
 *     authenticateToken, 
 *     requireAdmin, // <-- This is what's missing!
 *     (req: Request, res: Response) => {
 *         // Admin-only logic here
 *     }
 * );
 */

export default router;