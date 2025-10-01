/**
 * Product Type Definitions
 * Frontend types that are mismatched with the backend's refactored structure
 */

// ERROR 311: The Root Cause - Frontend expects nested product object
// Backend now returns flat variants with productId field
export interface ProductVariant {
  id: string;
  price: number;
  sku?: string;
  stock?: number;
  color?: string;
  size?: string;
  // ERROR 311: Expects nested product object that backend no longer provides
  product: {
    id: string;
    name: string;
    description: string;
    category?: string;
    brand?: string;
    images?: string[];
  };
}

// ERROR 312: Product interface still has optional pricing fields
// even though prices have moved to variants in the refactored backend
export interface Product {
  id: string;
  name: string;
  description: string;
  category?: string;
  brand?: string;
  // ERROR 312: These fields no longer exist on products
  unit_price?: number;  // Moved to variants
  sale_price?: number;  // Moved to variants
  discount_percentage?: number; // Moved to variants
  images?: string[];
  variants?: ProductVariant[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Additional types that compound the mismatch problem
export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStock?: boolean;
}

export interface CartItem {
  id: string;
  variant: ProductVariant; // Will fail due to nested product expectation
  quantity: number;
  addedAt: Date;
}

export interface ProductResponse {
  success: boolean;
  data: ProductVariant[]; // Type says ProductVariant but structure is wrong
  total?: number;
  page?: number;
  pageSize?: number;
}

// Helper type that will cause issues
export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  defaultVariant?: ProductVariant;
};

// Utility function that will crash at runtime
export function getProductNameFromVariant(variant: ProductVariant): string {
  // This will fail because variant.product is undefined
  return variant.product.name;
}

// Another utility that assumes the old structure
export function calculateVariantDiscount(variant: ProductVariant): number {
  // Will crash trying to access nested product
  const basePrice = variant.product.unit_price || variant.price;
  return ((basePrice - variant.price) / basePrice) * 100;
}

// Type guard that gives false confidence
export function isValidVariant(data: any): data is ProductVariant {
  // This check is insufficient and wrong
  return data && 
         typeof data.id === 'string' &&
         typeof data.price === 'number';
  // Doesn't check for required nested product object
}