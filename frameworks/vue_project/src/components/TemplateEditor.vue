<template>
  <div class="template-editor">
    <h2>Email Template Editor</h2>
    <p class="description">
      Create custom email templates for product notifications.
      Use template variables like {{ '{{ product.name }}' }} and {{ '{{ product.price }}' }}.
    </p>

    <form @submit.prevent="handlePreview">
      <div class="form-group">
        <label>Product ID:</label>
        <input
          v-model="productId"
          type="text"
          placeholder="Enter product ID"
        />
      </div>

      <div class="form-group">
        <label>Email Template:</label>
        <!-- TAINT SOURCE: Server-Side Template Injection -->
        <textarea
          v-model="template"
          rows="15"
          placeholder="Enter your email template...

Example:
<h1>New Product Alert!</h1>
<p>Check out {{ product.name }} for only ${{ product.price }}!</p>
<p>Order now at {{ shop.url }}</p>"
        ></textarea>
        <small>
          Available variables: product.name, product.price, product.description,
          shop.name, shop.url, customer.name, customer.email
        </small>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Rendering...' : 'Preview Email' }}
      </button>
    </form>

    <!-- Preview rendered by server (potential SSTI output) -->
    <div v-if="preview" class="preview">
      <h3>Email Preview:</h3>
      <!-- Double XSS: Server rendered content displayed as HTML -->
      <div class="email-preview" v-html="preview.rendered"></div>

      <details>
        <summary>Raw Response</summary>
        <pre>{{ JSON.stringify(preview, null, 2) }}</pre>
      </details>
    </div>

    <div v-if="error" class="error">
      <h3>Error:</h3>
      <pre>{{ error }}</pre>
    </div>

    <!-- Dangerous template examples -->
    <div class="examples">
      <h3>Template Examples:</h3>
      <div class="example-buttons">
        <button
          v-for="example in examples"
          :key="example.name"
          type="button"
          @click="loadExample(example)"
        >
          {{ example.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { renderProductEmail } from '../api/productApi';

export default {
  name: 'TemplateEditor',

  data() {
    return {
      productId: '1',
      template: '',
      preview: null,
      error: null,
      loading: false,
      examples: [
        {
          name: 'Basic Template',
          template: '<h1>{{ product.name }}</h1>\n<p>Price: ${{ product.price }}</p>'
        },
        {
          name: 'Full Email',
          template: `<html>
<body>
  <h1>New Product: {{ product.name }}</h1>
  <p>{{ product.description }}</p>
  <p><strong>Price:</strong> \${{ product.price }}</p>
  <p>Shop at {{ shop.url }}</p>
</body>
</html>`
        },
        {
          name: 'Debug Info',
          // SSTI payload for Jinja2
          template: '{{ config.items() }}'
        },
        {
          name: 'System Info',
          // Another SSTI payload
          template: '{{ self.__init__.__globals__ }}'
        }
      ]
    };
  },

  methods: {
    // TAINT FLOW: template → API → Jinja2 render → SSTI
    async handlePreview() {
      if (!this.productId || !this.template) {
        alert('Please fill in all fields');
        return;
      }

      this.loading = true;
      this.preview = null;
      this.error = null;

      try {
        // User controlled template sent to server for rendering
        // Vulnerable to Server-Side Template Injection
        this.preview = await renderProductEmail(this.productId, this.template);
      } catch (err) {
        this.error = err.message;
      }

      this.loading = false;
    },

    loadExample(example) {
      this.template = example.template;
    }
  }
};
</script>

<style scoped>
.template-editor {
  max-width: 800px;
  padding: 20px;
}

.description {
  color: #666;
  margin-bottom: 20px;
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
  font-family: monospace;
}

.form-group small {
  color: #666;
  font-size: 12px;
}

button {
  background: #9C27B0;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:disabled {
  background: #ccc;
}

.preview {
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.preview h3 {
  padding: 10px 15px;
  margin: 0;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.email-preview {
  padding: 20px;
  background: white;
}

.preview details {
  border-top: 1px solid #ddd;
}

.preview summary {
  padding: 10px 15px;
  cursor: pointer;
  background: #f9f9f9;
}

.preview pre {
  padding: 15px;
  margin: 0;
  background: #f5f5f5;
  overflow-x: auto;
}

.error {
  margin-top: 20px;
  padding: 15px;
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
}

.error pre {
  white-space: pre-wrap;
  color: #c62828;
}

.examples {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.example-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.example-buttons button {
  background: #607D8B;
  font-size: 12px;
  padding: 6px 12px;
}
</style>
