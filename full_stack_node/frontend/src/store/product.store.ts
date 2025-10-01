/**
 * Product Store (using Zustand)
 * State management that expects the old data structure
 */

import { create } from 'zustand';
import { ProductVariant, Product } from '../types/product.types';
import { fetchProducts } from '../services/api';

// ERROR 315: Incorrect State Shape - designed for old nested structure
interface ProductStore {
  variants: ProductVariant[]; // Expects nested product objects
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedVariant: ProductVariant | null;
  
  // Actions
  loadProducts: () => Promise<void>;
  selectVariant: (variantId: string) => void;
  clearError: () => void;
  
  // ERROR 316: Faulty Selector that will crash
  selectProductNames: () => string[];
}

export const useProductStore = create<ProductStore>((set, get) => ({
  variants: [],
  products: [],
  loading: false,
  error: null,
  selectedVariant: null,
  
  loadProducts: async () => {
    set({ loading: true, error: null });
    
    try {
      const variants = await fetchProducts();
      
      // ERROR 315: Store expects nested structure but gets flat data
      set({ 
        variants, // Storing mismatched data structure
        loading: false 
      });
      
      // Try to extract products from variants (will fail)
      const productMap = new Map<string, Product>();
      variants.forEach(variant => {
        // This will crash because variant.product is undefined
        if (variant.product && !productMap.has(variant.product.id)) {
          productMap.set(variant.product.id, {
            ...variant.product,
            variants: []
          } as Product);
        }
      });
      
      set({ products: Array.from(productMap.values()) });
      
    } catch (error) {
      set({ 
        error: 'Failed to load products', 
        loading: false 
      });
    }
  },
  
  selectVariant: (variantId: string) => {
    const variant = get().variants.find(v => v.id === variantId);
    set({ selectedVariant: variant || null });
  },
  
  clearError: () => set({ error: null }),
  
  // ERROR 316: Selector attempts to access variant.product.name
  // Will fail at runtime because product is undefined
  selectProductNames: () => {
    const { variants } = get();
    // This will crash with "Cannot read properties of undefined (reading 'name')"
    return variants.map(variant => variant.product.name);
  }
}));

// Additional selectors that will fail
export const useProductNames = () => {
  return useProductStore(state => state.selectProductNames());
};

export const useProductsByCategory = (category: string) => {
  return useProductStore(state => 
    state.variants.filter(v => 
      // Will crash trying to access product.category
      v.product.category === category
    )
  );
};

export const useVariantPrice = (variantId: string) => {
  return useProductStore(state => {
    const variant = state.variants.find(v => v.id === variantId);
    // Will return undefined because variant.product doesn't exist
    return variant?.product?.unit_price || variant?.price;
  });
};

// Computed values that will produce wrong results
export const useTotalProducts = () => {
  return useProductStore(state => {
    const uniqueProducts = new Set();
    state.variants.forEach(v => {
      // Will never add anything because v.product is undefined
      if (v.product) {
        uniqueProducts.add(v.product.id);
      }
    });
    return uniqueProducts.size; // Will always return 0
  });
};

// Action that will fail silently
export const useAddVariant = () => {
  return useProductStore(state => ({
    addVariant: (variant: ProductVariant) => {
      // Assumes nested structure
      if (!variant.product) {
        console.error('Invalid variant: missing product');
        return;
      }
      
      state.variants.push(variant);
    }
  }));
};