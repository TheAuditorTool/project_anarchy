<template>
  <div class="product-form">
    <h2>Create Product</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Product Name:</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>Price:</label>
        <input v-model.number="form.price" type="number" step="0.01" required />
      </div>

      <div class="form-group">
        <label>Description (HTML allowed):</label>
        <!-- TAINT SOURCE: User controlled HTML that will be stored -->
        <textarea
          v-model="form.description"
          rows="5"
          placeholder="Enter description... HTML is allowed for formatting"
        ></textarea>
        <small>You can use HTML tags for formatting</small>
      </div>

      <div class="form-group">
        <label>Owner ID:</label>
        <input v-model.number="form.ownerId" type="number" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create Product' }}
      </button>
    </form>

    <!-- Preview section with XSS vulnerability -->
    <div class="preview" v-if="form.description">
      <h3>Preview:</h3>
      <!-- TAINT SINK: Renders user input as HTML -->
      <div v-html="form.description"></div>
    </div>

    <!-- Success message -->
    <div v-if="createdProduct" class="success">
      <p>Product created successfully!</p>
      <pre>{{ JSON.stringify(createdProduct, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import { createProduct } from '../api/productApi';

export default {
  name: 'ProductForm',

  data() {
    return {
      form: {
        name: '',
        price: 0,
        description: '',
        ownerId: 1
      },
      loading: false,
      createdProduct: null
    };
  },

  methods: {
    // TAINT FLOW: form.description → API → database → later v-html render
    async handleSubmit() {
      this.loading = true;
      this.createdProduct = null;

      try {
        // User controlled description flows to database
        const result = await createProduct({
          name: this.form.name,
          price: this.form.price,
          description: this.form.description,  // TAINT: Stored XSS
          ownerId: this.form.ownerId
        });

        this.createdProduct = result;
        this.resetForm();
      } catch (error) {
        console.error('Failed to create product:', error);
        alert('Failed to create product: ' + error.message);
      }

      this.loading = false;
    },

    resetForm() {
      this.form = {
        name: '',
        price: 0,
        description: '',
        ownerId: 1
      };
    }
  }
};
</script>

<style scoped>
.product-form {
  max-width: 600px;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  color: #666;
  font-size: 12px;
}

button {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.preview {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.success {
  margin-top: 20px;
  padding: 15px;
  background: #d4edda;
  border-radius: 4px;
}
</style>
