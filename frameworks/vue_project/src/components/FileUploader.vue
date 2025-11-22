<template>
  <div class="file-uploader">
    <h2>Product Image Uploader</h2>

    <form @submit.prevent="handleUpload">
      <div class="form-group">
        <label>File Path:</label>
        <!-- TAINT SOURCE: Path traversal attack vector -->
        <input
          v-model="filePath"
          type="text"
          placeholder="/uploads/images/product.jpg"
        />
        <small class="warning">
          Specify where to save the file on the server
        </small>
      </div>

      <div class="form-group">
        <label>File Content (base64 or text):</label>
        <textarea
          v-model="content"
          rows="10"
          placeholder="Paste file content here..."
        ></textarea>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Uploading...' : 'Upload File' }}
      </button>
    </form>

    <div v-if="result" class="result">
      <h3>Upload Result:</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>

    <!-- XML Import Section -->
    <hr />

    <h2>Import Products from XML</h2>
    <form @submit.prevent="handleXmlImport">
      <div class="form-group">
        <label>XML Data:</label>
        <!-- TAINT SOURCE: XXE attack vector -->
        <textarea
          v-model="xmlData"
          rows="10"
          placeholder='<?xml version="1.0"?>
<products>
  <product>
    <name>Test Product</name>
    <price>29.99</price>
  </product>
</products>'
        ></textarea>
        <small>Paste your product XML data</small>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Importing...' : 'Import XML' }}
      </button>
    </form>

    <div v-if="importResult" class="result">
      <h3>Import Result:</h3>
      <pre>{{ JSON.stringify(importResult, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import { uploadProductImage, importProductsXml } from '../api/productApi';

export default {
  name: 'FileUploader',

  data() {
    return {
      filePath: '',
      content: '',
      xmlData: '',
      loading: false,
      result: null,
      importResult: null
    };
  },

  methods: {
    // TAINT FLOW: filePath → API → file system write
    async handleUpload() {
      if (!this.filePath || !this.content) {
        alert('Please fill in all fields');
        return;
      }

      this.loading = true;
      this.result = null;

      try {
        // User controlled file path - path traversal vulnerability
        // Attacker could use: "../../../etc/cron.d/malicious"
        this.result = await uploadProductImage(this.filePath, this.content);
      } catch (error) {
        console.error('Upload failed:', error);
        this.result = { error: error.message };
      }

      this.loading = false;
    },

    // TAINT FLOW: xmlData → API → XML parser with XXE
    async handleXmlImport() {
      if (!this.xmlData.trim()) {
        alert('Please enter XML data');
        return;
      }

      this.loading = true;
      this.importResult = null;

      try {
        // User controlled XML - XXE vulnerability
        // Attacker could inject:
        // <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        this.importResult = await importProductsXml(this.xmlData);
      } catch (error) {
        console.error('Import failed:', error);
        this.importResult = { error: error.message };
      }

      this.loading = false;
    }
  }
};
</script>

<style scoped>
.file-uploader {
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
  font-family: monospace;
}

.form-group small {
  color: #666;
  font-size: 12px;
}

.form-group small.warning {
  color: #ff9800;
}

button {
  background: #2196F3;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.result {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.result pre {
  white-space: pre-wrap;
  word-break: break-all;
}

hr {
  margin: 30px 0;
  border: none;
  border-top: 1px solid #ddd;
}
</style>
