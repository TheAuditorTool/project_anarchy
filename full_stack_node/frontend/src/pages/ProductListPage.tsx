/**
 * Product List Page Component
 * This page will crash at runtime due to data structure mismatch
 */

import React, { useEffect } from 'react';
import { useProductStore, useProductNames } from '../store/product.store';
import { VariantDetails } from '../components/VariantDetails';

export const ProductListPage: React.FC = () => {
  const { 
    variants, 
    loading, 
    error, 
    loadProducts,
    selectProductNames 
  } = useProductStore();
  
  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);
  
  // ERROR 317: Runtime Crash - selectProductNames tries to access undefined
  // This will cause: TypeError: Cannot read properties of undefined (reading 'name')
  const productNames = selectProductNames();
  
  if (loading) {
    return <div className="loading">Loading products...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="product-list-page">
      <h1>Products</h1>
      
      {/* ERROR 317: This section will crash */}
      <div className="product-names">
        <h2>Available Products:</h2>
        <ul>
          {productNames.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>
      
      {/* ERROR 318: Incomplete UI - Empty onClick handler */}
      <button 
        className="add-variant-btn"
        onClick={() => {
          /* TODO */ 
          // ERROR 318: Empty function, no implementation
        }}
      >
        Add New Variant
      </button>
      
      {/* Attempt to render variants - will partially work but with issues */}
      <div className="variants-grid">
        {variants.map(variant => (
          // Pass raw variant data to VariantDetails
          // This will "work" due to any types but display wrong data
          <VariantDetails 
            key={variant.id} 
            data={variant}
          />
        ))}
      </div>
      
      {/* Another section that will fail */}
      <div className="product-categories">
        <h2>Categories:</h2>
        <ul>
          {variants.map(v => (
            // Will render undefined because v.product doesn't exist
            <li key={v.id}>{v.product?.category || 'Unknown'}</li>
          ))}
        </ul>
      </div>
      
      {/* Stats section that will show wrong data */}
      <div className="stats">
        <p>Total Products: {new Set(variants.map(v => v.product?.id)).size}</p>
        <p>Total Variants: {variants.length}</p>
        <p>Average Price: ${
          variants.reduce((sum, v) => sum + (v.product?.unit_price || v.price), 0) / 
          variants.length || 0
        }</p>
      </div>
    </div>
  );
};

// Additional component that compounds the problem
export const ProductFilters: React.FC = () => {
  const variants = useProductStore(state => state.variants);
  
  // Extract unique categories (will fail)
  const categories = Array.from(
    new Set(variants.map(v => v.product?.category).filter(Boolean))
  );
  
  return (
    <div className="filters">
      <h3>Filter by Category:</h3>
      <select>
        <option value="">All</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
};

// Search component that will not work properly
export const ProductSearch: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const variants = useProductStore(state => state.variants);
  
  const searchResults = variants.filter(v => {
    // Will never match because v.product.name is undefined
    return v.product?.name.toLowerCase().includes(query.toLowerCase());
  });
  
  return (
    <div className="search">
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      <div className="results">
        {searchResults.length} results found
      </div>
    </div>
  );
};