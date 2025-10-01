/**
 * API Service Layer
 * Handles communication with backend but is unaware of the data contract change
 */

import { ProductVariant, Product, ProductResponse } from '../types/product.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// ERROR 313: Missing Normalization - No data transformation
// Function expects old ProductVariant structure but backend returns different format
export async function fetchProducts(): Promise<ProductVariant[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // ERROR 313: No data transformation or normalization
    // Passes mismatched API response directly to application
    // Backend returns flat variants but frontend expects nested product objects
    return data.data as ProductVariant[]; // Type assertion hides the problem
    
  } catch (error) {
    // ERROR 314: Poor Error Handling - Only console.log, no user feedback
    console.log(error);
    return []; // Returns empty array on error, hiding the problem
  }
}

// Another problematic function
export async function fetchProductById(productId: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    const data = await response.json();
    
    // Assumes old product structure
    return data.data as Product;
    
  } catch (error) {
    // ERROR 314 (continued): Poor error handling pattern throughout
    console.log('Failed to fetch product:', error);
    return null;
  }
}

// Function that will fail due to structure mismatch
export async function searchProducts(query: string): Promise<ProductVariant[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/search?q=${query}`);
    const data = await response.json();
    
    // Tries to access nested structure that doesn't exist
    const variants = data.data.map((item: any) => ({
      ...item,
      product: {
        name: item.productName || 'Unknown', // These fields don't exist
        description: item.productDescription || '',
        id: item.productId
      }
    }));
    
    return variants;
    
  } catch (error) {
    console.log(error); // Silent failure
    return [];
  }
}

// Cart operations that will fail
export async function addToCart(variantId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ variantId })
    });
    
    return response.ok;
    
  } catch (error) {
    console.log('Add to cart failed:', error);
    return false; // Hides the actual error
  }
}

// Update variant function with wrong expectations
export async function updateVariant(
  variantId: string, 
  updates: Partial<ProductVariant>
): Promise<ProductVariant | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/variants/${variantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    // Expects nested product in response
    if (!data.data.product) {
      // Try to "fix" it with wrong assumptions
      data.data.product = {
        id: data.data.productId,
        name: 'Unknown Product',
        description: ''
      };
    }
    
    return data.data as ProductVariant;
    
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Batch operations that compound the problem
export async function fetchVariantsByProductIds(
  productIds: string[]
): Promise<Map<string, ProductVariant[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/variants/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds })
    });
    
    const data = await response.json();
    const variantMap = new Map<string, ProductVariant[]>();
    
    // Assumes nested structure for grouping
    data.data.forEach((variant: any) => {
      const productId = variant.product?.id || variant.productId; // Will use fallback
      
      if (!variantMap.has(productId)) {
        variantMap.set(productId, []);
      }
      
      variantMap.get(productId)!.push(variant);
    });
    
    return variantMap;
    
  } catch (error) {
    console.log('Batch fetch failed:', error);
    return new Map();
  }
}

// Export a default error handler that does nothing useful
export function handleApiError(error: any): void {
  console.log('API Error:', error);
  // No toast, no user notification, no error reporting
}