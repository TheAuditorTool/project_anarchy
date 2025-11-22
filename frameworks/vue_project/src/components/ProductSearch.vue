<template>
  <div class="product-search">
    <h2>Product Search</h2>

    <!-- TAINT SOURCE: User input for SQL injection -->
    <div class="search-form">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        @keyup.enter="handleSearch"
      />
      <button @click="handleSearch">Search</button>
    </div>

    <!-- Results with XSS vulnerability -->
    <div class="results">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="selectProduct(product)"
      >
        <h3>{{ product.name }}</h3>
        <p class="price">${{ product.price }}</p>

        <!-- TAINT SINK: XSS - rendering user-controlled HTML -->
        <div
          class="description"
          v-html="product.description"
        ></div>
      </div>
    </div>

    <!-- Product detail modal -->
    <div v-if="selectedProduct" class="modal">
      <div class="modal-content">
        <h3>{{ selectedProduct.name }}</h3>

        <!-- Another XSS sink -->
        <div v-html="selectedProduct.description"></div>

        <button @click="selectedProduct = null">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { searchProducts, getProducts } from '../api/productApi';

export default {
  name: 'ProductSearch',

  data() {
    return {
      searchQuery: '',
      products: [],
      selectedProduct: null,
      loading: false
    };
  },

  async mounted() {
    // Load initial products
    await this.loadProducts();
  },

  methods: {
    async loadProducts() {
      this.loading = true;
      try {
        const data = await getProducts();
        this.products = data || [];
      } catch (error) {
        console.error('Failed to load products:', error);
      }
      this.loading = false;
    },

    // TAINT FLOW: searchQuery → API → SQL query
    async handleSearch() {
      if (!this.searchQuery.trim()) {
        await this.loadProducts();
        return;
      }

      this.loading = true;
      try {
        // User input flows to SQL query in backend
        const data = await searchProducts(this.searchQuery);
        this.products = data.results || [];
      } catch (error) {
        console.error('Search failed:', error);
      }
      this.loading = false;
    },

    selectProduct(product) {
      this.selectedProduct = product;
    }
  }
};
</script>

<style scoped>
.product-search {
  padding: 20px;
}

.search-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
}

.product-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
}
</style>
