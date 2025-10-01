/**
 * Shopping Cart Store
 * Contains floating-point errors, state logic bugs, and security issues
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  lineItemId: string;
  productVariantId: string;
  productName: string;
  quantity: number;
  price: number;
  addedAt: Date;
}

interface CartStore {
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, 'lineItemId' | 'addedAt'>) => void;
  removeItem: (lineItemId: string) => void;
  updateQuantity: (lineItemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getDiscountAmount: (discountPercent: number) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const lineItemId = `li_${Date.now()}_${Math.random()}`;
        
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              lineItemId,
              addedAt: new Date()
            }
          ]
        }));
      },
      
      // ERROR 334: Wrong logic - removes all items with same variant_id
      removeItem: (lineItemId) => {
        set((state) => {
          const itemToRemove = state.items.find(i => i.lineItemId === lineItemId);
          
          if (itemToRemove) {
            // BUG: Removes ALL items with same productVariantId, not just the specific lineItem
            return {
              items: state.items.filter(i => i.productVariantId !== itemToRemove.productVariantId)
            };
          }
          
          return state;
        });
      },
      
      updateQuantity: (lineItemId, quantity) => {
        if (quantity < 0) return; // No validation for max quantity
        
        set((state) => ({
          items: state.items.map(item =>
            item.lineItemId === lineItemId
              ? { ...item, quantity }
              : item
          )
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      // ERROR 333: Floating-point precision errors in price calculation
      getTotalPrice: () => {
        const items = get().items;
        
        // Using simple addition with floating-point numbers
        // Will accumulate precision errors with many items
        return items.reduce((total, item) => {
          // Not using proper decimal arithmetic
          return total + (item.price * item.quantity);
        }, 0);
        // Should use: Math.round((total + (item.price * item.quantity)) * 100) / 100
      },
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      // More floating-point issues
      getDiscountAmount: (discountPercent) => {
        const total = get().getTotalPrice();
        
        // More floating-point precision issues
        const discount = total * (discountPercent / 100);
        
        // Not rounding properly for currency
        return discount; // Could be 19.999999999998 instead of 20.00
      }
    }),
    {
      name: 'shopping-cart',
      
      // ERROR 335: No type validation on localStorage hydration
      // Treats persisted state as 'any', could contain malformed data
      onRehydrateStorage: () => (state) => {
        // No validation of the hydrated state structure
        // If localStorage is tampered with, app could crash
        
        // Should validate that state.items is an array
        // Should validate each item has required fields
        // Should validate prices are numbers, etc.
        
        // Instead, just accepts whatever is in localStorage
        if (state) {
          console.log('Cart rehydrated with', state.items?.length || 0, 'items');
        }
      },
      
      // Persisting sensitive price data to localStorage (can be tampered)
      partialize: (state) => ({ items: state.items })
    }
  )
);

// Helper functions with issues
export function formatPrice(price: number): string {
  // Improper rounding for display
  return `$${price.toFixed(2)}`; // Doesn't handle rounding correctly
}

export function calculateTax(subtotal: number, taxRate: number): number {
  // More floating-point issues
  return subtotal * taxRate; // No rounding
}

export function applyCoupon(
  subtotal: number,
  couponCode: string
): { valid: boolean; newTotal: number } {
  // Hardcoded coupon codes (security issue)
  const coupons: Record<string, number> = {
    'SAVE10': 0.1,
    'SAVE20': 0.2,
    'ADMIN': 1.0, // 100% discount!
    'TEST': 0.5
  };
  
  if (coupons[couponCode]) {
    // More floating-point math
    const discount = subtotal * coupons[couponCode];
    const newTotal = subtotal - discount;
    
    return {
      valid: true,
      newTotal // Not rounded
    };
  }
  
  return {
    valid: false,
    newTotal: subtotal
  };
}

// Cart analytics with privacy issues
export function trackCartEvent(event: string, data: any) {
  // Sending sensitive data to analytics
  const payload = {
    event,
    data,
    cart: useCartStore.getState().items, // Includes prices
    userId: localStorage.getItem('userId'),
    timestamp: Date.now()
  };
  
  // Simulate sending to analytics
  console.log('Analytics:', payload);
  
  // Also storing in localStorage (data leak)
  const events = JSON.parse(localStorage.getItem('cartEvents') || '[]');
  events.push(payload);
  localStorage.setItem('cartEvents', JSON.stringify(events));
}

// Subscription to cart changes (memory leak potential)
const unsubscribe = useCartStore.subscribe(
  (state) => state.items,
  (items) => {
    // This runs on every cart change
    trackCartEvent('cart_updated', { itemCount: items.length });
  }
);

// Never calling unsubscribe() - potential memory leak