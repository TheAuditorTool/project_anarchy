/**
 * Variant Details Component
 * Abuses 'any' type to temporarily "fix" the crashing page
 */

import React from 'react';
import { ProductVariant } from '../types/product.types';

// ERROR 319: Component accepts data as 'any' type
interface VariantDetailsProps {
  data: any; // ERROR 319: Using any instead of proper typing
  onSelect?: (id: string) => void;
  showActions?: boolean;
}

export const VariantDetails: React.FC<VariantDetailsProps> = ({ 
  data, 
  onSelect,
  showActions = true 
}) => {
  // ERROR 320: Type casting to force incorrect shape
  // This hides the runtime error but displays wrong/undefined data
  const variant = data as ProductVariant;
  
  // ERROR 321: Will render undefined but any types suppress compile errors
  // variant.product.name will be undefined at runtime
  return (
    <div className="variant-card">
      {/* ERROR 321: Accessing undefined nested properties */}
      <h3 className="product-name">
        {variant.product?.name || 'Unknown Product'}
      </h3>
      
      <div className="variant-info">
        {/* Some fields from flat structure will work */}
        <p className="price">${variant.price}</p>
        <p className="sku">SKU: {variant.sku || 'N/A'}</p>
        
        {/* These will show 'N/A' because product is undefined */}
        <p className="description">
          {variant.product?.description || 'No description available'}
        </p>
        <p className="category">
          Category: {variant.product?.category || 'N/A'}
        </p>
      </div>
      
      {/* Trying to display images that don't exist */}
      <div className="images">
        {variant.product?.images?.map((img: any, i: number) => (
          <img key={i} src={img} alt={`Product ${i}`} />
        )) || <div className="no-image">No image</div>}
      </div>
      
      {showActions && (
        <div className="actions">
          <button 
            onClick={() => {
              // Will pass undefined ID
              onSelect?.(variant.product?.id || variant.id);
            }}
          >
            Select
          </button>
          
          <button 
            onClick={() => {
              // Attempts to use nested data
              console.log('Adding to cart:', {
                productId: variant.product?.id,
                productName: variant.product?.name,
                variantId: variant.id,
                price: variant.price
              });
            }}
          >
            Add to Cart
          </button>
        </div>
      )}
      
      {/* Computed values that will be wrong */}
      <div className="computed-info">
        <p>
          Discount: {
            variant.product?.unit_price 
              ? `${((variant.product.unit_price - variant.price) / variant.product.unit_price * 100).toFixed(0)}%`
              : 'N/A'
          }
        </p>
        <p>
          In Stock: {variant.stock ? 'Yes' : 'No'}
        </p>
      </div>
    </div>
  );
};

// Related component with more any abuse
export const VariantQuickView: React.FC<{ item: any }> = ({ item }) => {
  // More dangerous any casting
  const variant = item as ProductVariant;
  const [quantity, setQuantity] = React.useState(1);
  
  // Function that will fail silently
  const handleAddToCart = () => {
    // Trying to build cart item with undefined values
    const cartItem = {
      variantId: variant.id,
      productId: variant.product?.id, // undefined
      productName: variant.product?.name, // undefined
      price: variant.price,
      quantity: quantity
    };
    
    // This will add incomplete data to cart
    console.log('Adding to cart:', cartItem);
  };
  
  return (
    <div className="quick-view">
      <h4>{variant.product?.name || variant.variantName || 'Unknown'}</h4>
      <p>${variant.price}</p>
      
      <input 
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        min="1"
      />
      
      <button onClick={handleAddToCart}>
        Quick Add
      </button>
    </div>
  );
};

// Comparison component that will show wrong data
export const VariantComparison: React.FC<{ items: any[] }> = ({ items }) => {
  // Cast all items
  const variants = items as ProductVariant[];
  
  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Category</th>
          <th>Brand</th>
        </tr>
      </thead>
      <tbody>
        {variants.map(v => (
          <tr key={v.id}>
            {/* All product fields will be undefined */}
            <td>{v.product?.name || 'Unknown'}</td>
            <td>${v.price}</td>
            <td>{v.product?.category || 'N/A'}</td>
            <td>{v.product?.brand || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};