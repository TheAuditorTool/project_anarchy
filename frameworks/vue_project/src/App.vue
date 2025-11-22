<template>
  <div id="app">
    <header>
      <h1>Project Anarchy - Vue Frontend</h1>
      <nav>
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <main>
      <ProductSearch v-if="activeTab === 'search'" />
      <ProductForm v-if="activeTab === 'create'" />
      <FileUploader v-if="activeTab === 'upload'" />
      <TemplateEditor v-if="activeTab === 'template'" />
    </main>

    <footer>
      <p>
        Connected to: <code>{{ apiUrl }}</code>
      </p>
    </footer>
  </div>
</template>

<script>
import ProductSearch from './components/ProductSearch.vue';
import ProductForm from './components/ProductForm.vue';
import FileUploader from './components/FileUploader.vue';
import TemplateEditor from './components/TemplateEditor.vue';

export default {
  name: 'App',

  components: {
    ProductSearch,
    ProductForm,
    FileUploader,
    TemplateEditor
  },

  data() {
    return {
      activeTab: 'search',
      tabs: [
        { id: 'search', label: 'Search Products' },
        { id: 'create', label: 'Create Product' },
        { id: 'upload', label: 'File Upload' },
        { id: 'template', label: 'Email Templates' }
      ],
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
    };
  }
};
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  border-bottom: 1px solid #ddd;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

header h1 {
  margin: 0 0 15px 0;
}

nav {
  display: flex;
  gap: 10px;
}

nav button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

nav button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  color: #666;
}

footer code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
