/**
 * Product Image Model with Critical Performance Anti-Pattern
 * DO NOT SHIP: Stores large BLOBs directly in database
 */

import { DataTypes, Model, Sequelize } from 'sequelize';

/**
 * Product Image Model
 * Contains a critical performance anti-pattern that will destroy database performance
 */
export class ProductImage extends Model {
    public id!: number;
    public productId!: number;
    public imageName!: string;
    /**
     * ERROR 381: CRITICAL PERFORMANCE - BLOB Storage in Database
     * 
     * This field stores entire image files as BLOBs directly in the database.
     * This is one of the worst performance anti-patterns in database design.
     * 
     * Problems:
     * 1. Database size explodes (each image can be 5-10MB)
     * 2. Backup/restore becomes impossibly slow
     * 3. Replication lag increases dramatically
     * 4. SELECT * queries become disasters
     * 5. Memory usage skyrockets
     * 6. Network traffic overwhelms the database
     * 7. Cannot use CDN for image delivery
     * 8. No image optimization/resizing
     * 9. Database cache becomes useless
     * 10. Query performance degrades for entire database
     * 
     * Real-world impact:
     * - A product catalog with 10,000 products × 5 images × 5MB = 250GB in database
     * - Every product list query transfers massive amounts of data
     * - Database RAM gets consumed by image data instead of indexes
     * - Customers experience 30+ second page loads
     */
    public imageData!: Buffer;  // ERROR 381: Storing BLOB directly in database
    public thumbnailData!: Buffer;  // Another BLOB field!
    public largeImageData!: Buffer;  // And another one!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initProductImageModel(sequelize: Sequelize): typeof ProductImage {
    ProductImage.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id',
                },
            },
            imageName: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            // CRITICAL ANTI-PATTERN: Storing images as BLOBs
            imageData: {
                type: DataTypes.BLOB('long'),  // Can store up to 4GB!
                allowNull: false,
                comment: 'Original image data - DO NOT USE IN PRODUCTION',
            },
            thumbnailData: {
                type: DataTypes.BLOB('medium'),  // Up to 16MB
                allowNull: true,
                comment: 'Thumbnail version - ALSO A BAD IDEA',
            },
            largeImageData: {
                type: DataTypes.BLOB('long'),  // Another huge BLOB
                allowNull: true,
                comment: 'High-res version - TERRIBLE FOR PERFORMANCE',
            },
            // Even worse: storing metadata as JSON BLOB
            imageMetadata: {
                type: DataTypes.BLOB,  // Storing JSON as BLOB instead of JSON type
                allowNull: true,
                get() {
                    const data = this.getDataValue('imageMetadata');
                    return data ? JSON.parse(data.toString()) : null;
                },
                set(value: any) {
                    this.setDataValue('imageMetadata', Buffer.from(JSON.stringify(value)));
                },
            },
        },
        {
            sequelize,
            modelName: 'ProductImage',
            tableName: 'product_images',
            timestamps: true,
            // No indexes defined for foreign keys!
            indexes: [
                // Missing index on productId despite frequent JOINs
            ],
            // Hooks that make it worse
            hooks: {
                // Automatically loads all images when querying products
                afterFind: async (instances: any) => {
                    // This hook ensures BLOBs are always loaded
                    if (Array.isArray(instances)) {
                        for (const instance of instances) {
                            // Force load all BLOB fields
                            await instance.reload({
                                attributes: ['imageData', 'thumbnailData', 'largeImageData']
                            });
                        }
                    }
                },
            },
        }
    );

    return ProductImage;
}

/**
 * Bad practices in action - service functions that compound the problem
 */
export const productImageService = {
    /**
     * Gets all images for a product - loads ALL BLOBs into memory
     */
    getAllProductImages: async (productId: number) => {
        // This query loads potentially 50MB+ of data per product
        return await ProductImage.findAll({
            where: { productId },
            // No attributes restriction - loads all BLOBs
        });
    },
    
    /**
     * Bulk load images for multiple products - performance disaster
     */
    bulkLoadImages: async (productIds: number[]) => {
        // This could load GBs of data into memory
        return await ProductImage.findAll({
            where: {
                productId: productIds
            },
            // Again, loading all BLOB fields
            raw: true,  // Even worse - no lazy loading
        });
    },
    
    /**
     * Search products with images - the worst possible query
     */
    searchProductsWithImages: async (searchTerm: string) => {
        // Joins products with images, loading all BLOBs
        const query = `
            SELECT p.*, pi.imageData, pi.thumbnailData, pi.largeImageData
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.productId
            WHERE p.name LIKE ?
        `;
        // This query could return hundreds of MB of data
        return await sequelize.query(query, {
            replacements: [`%${searchTerm}%`],
            type: 'SELECT',
        });
    },
    
    /**
     * Copy images between products - duplicates BLOBs
     */
    copyProductImages: async (sourceProductId: number, targetProductId: number) => {
        const images = await ProductImage.findAll({
            where: { productId: sourceProductId },
        });
        
        // Duplicating massive BLOBs in database
        for (const image of images) {
            await ProductImage.create({
                productId: targetProductId,
                imageName: image.imageName,
                imageData: image.imageData,  // Copying multi-MB BLOB
                thumbnailData: image.thumbnailData,  // Another BLOB copy
                largeImageData: image.largeImageData,  // And another
            });
        }
    },
};

/**
 * Migration that makes it even worse
 */
export const badMigration = `
    -- Adding more BLOB columns to existing table
    ALTER TABLE product_images 
    ADD COLUMN image_2x LONGBLOB,
    ADD COLUMN image_4x LONGBLOB,
    ADD COLUMN image_webp LONGBLOB,
    ADD COLUMN image_avif LONGBLOB;
    
    -- No partitioning strategy
    -- No archival strategy
    -- No cleanup strategy
`;

/**
 * The correct approach would be:
 * 
 * 1. Store images in object storage (S3, Azure Blob, etc.)
 * 2. Store only the URL/path in database
 * 3. Use CDN for delivery
 * 4. Generate thumbnails on upload, not on request
 * 5. Implement proper caching strategies
 * 
 * Example:
 * imageUrl: {
 *     type: DataTypes.STRING(500),
 *     allowNull: false,
 * },
 * thumbnailUrl: {
 *     type: DataTypes.STRING(500),
 *     allowNull: true,
 * }
 */

// Make it available for other bad code to use
declare const sequelize: Sequelize;
export default initProductImageModel(sequelize);