# Vue Module Resolution Test Cases

This Vue project is specifically designed to test TheAuditor's module resolution capabilities.

## Problem Statement

TheAuditor currently extracts only the **basename** of imports:

```python
# CURRENT (broken):
module_name = imp_path.split('/')[-1].replace('.js', '').replace('.ts', '')
```

This causes **40-60% of imports to be unresolvable**, breaking cross-file taint analysis.

## Test Cases

### 1. Path Mapping (@/ → src/)

**Files testing this:**
- `src/App.vue` → imports `@/components/SearchPanel.vue`
- `src/components/SearchPanel.vue` → imports `@/stores`, `@/utils`, `@/composables`
- `src/stores/productStore.ts` → imports `@/types`, `@/utils`, `@/api`

**Expected resolution:**
```
@/components/SearchPanel.vue → src/components/SearchPanel.vue
@/stores → src/stores/index.ts
@/utils → src/utils/index.ts
@/types → src/types/index.ts
```

**Current (broken):**
```
@/components/SearchPanel.vue → 'SearchPanel.vue' (basename only)
@/stores → 'stores' (cannot find file)
```

### 2. Index File Resolution

**Files testing this:**
- `src/utils/index.ts` - barrel export
- `src/stores/index.ts` - barrel export
- `src/types/index.ts` - barrel export
- `src/composables/index.ts` - barrel export
- `src/api/index.ts` - barrel export

**Expected resolution:**
```
import { validateEmail } from '@/utils'
→ src/utils/index.ts
→ re-exports from src/utils/validation.ts
```

**Current (broken):**
```
import { validateEmail } from '@/utils'
→ 'utils' (cannot resolve to index.ts)
```

### 3. Relative Imports

**Files testing this:**
- `src/utils/index.ts` → imports `./validation`, `./sanitization`, `./formatting`
- `src/api/auth.ts` → imports `./client`
- `src/components/TemplateRenderer.vue` → imports `../stores`

**Expected resolution:**
```
./validation → src/utils/validation.ts
./client → src/api/client.ts
../stores → src/stores/index.ts
```

**Current (broken):**
```
./validation → 'validation' (basename only)
../stores → 'stores' (loses parent path context)
```

### 4. Scoped Package Imports

**Files testing this:**
- `src/components/FileManager.vue` → imports `@vueuse/core`
- `package.json` → depends on `@vueuse/core`

**Expected resolution:**
```
@vueuse/core → node_modules/@vueuse/core/dist/index.mjs
```

**Current (broken):**
```
@vueuse/core → 'core' (loses scoped package context)
```

### 5. Cross-File Taint Flow

**Complete taint flow path (requires ALL resolution types):**

```
1. SearchPanel.vue (TAINT SOURCE: v-model searchQuery)
   ↓ imports @/composables → useUserInput()

2. useUserInput.ts (composable)
   ↓ imports @/utils → validateSearchQuery()
   ↓ returns tainted searchQuery ref

3. SearchPanel.vue
   ↓ imports @/stores → useProductStore()
   ↓ calls productStore.searchProducts(searchQuery)

4. productStore.ts (Pinia store)
   ↓ imports @/utils → validateSearchQuery(), escapeForSql()
   ↓ imports @/api/products → productApi
   ↓ calls productApi.search(params)

5. products.ts (API layer)
   ↓ imports ./client → httpClient
   ↓ calls httpClient.get('/items/search-vulnerable', { params })

6. TAINT SINK: SQL Injection in backend
```

**If module resolution fails at ANY step, the taint flow breaks.**

## Configuration Files

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@stores/*": ["src/stores/*"],
      "@types/*": ["src/types/*"],
      "@composables/*": ["src/composables/*"],
      "@api/*": ["src/api/*"]
    }
  }
}
```

### vite.config.js

```javascript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
    // ... etc
  }
}
```

## File Structure

```
frameworks/vue_project/
├── package.json              # Dependencies
├── package-lock.json         # Lock file for resolution testing
├── tsconfig.json             # Path mappings
├── vite.config.js            # Vite aliases (must match tsconfig)
├── src/
│   ├── main.ts               # Entry point
│   ├── App.vue               # Root component (path mapping + relative imports)
│   ├── env.d.ts              # TypeScript declarations
│   │
│   ├── components/           # Vue components
│   │   ├── SearchPanel.vue       # Composition API + @/ imports
│   │   ├── FileManager.vue       # @vueuse/core + @stores/* imports
│   │   ├── TemplateRenderer.vue  # Relative + @composables/* imports
│   │   ├── ProductSearch.vue     # Legacy Options API
│   │   └── ...
│   │
│   ├── stores/               # Pinia stores
│   │   ├── index.ts          # Barrel export (index resolution test)
│   │   ├── userStore.ts      # @/ imports
│   │   └── productStore.ts   # Cross-file taint flow hub
│   │
│   ├── composables/          # Vue composables
│   │   ├── index.ts          # Barrel export
│   │   └── useUserInput.ts   # TAINT SOURCE
│   │
│   ├── utils/                # Utility functions
│   │   ├── index.ts          # Barrel export
│   │   ├── validation.ts     # Validation (TAINT passes through)
│   │   ├── sanitization.ts   # Sanitization (TAINT should stop here, but doesn't)
│   │   └── formatting.ts     # Formatting utilities
│   │
│   ├── types/                # TypeScript types
│   │   ├── index.ts          # Barrel export + re-exports
│   │   └── validation.types.ts
│   │
│   └── api/                  # API layer
│       ├── index.ts          # Barrel export
│       ├── client.ts         # HTTP client
│       ├── auth.ts           # Auth endpoints
│       └── products.ts       # Product endpoints (TAINT SINK)
```

## Success Criteria

After implementing proper module resolution, TheAuditor should:

1. **Resolve 80%+ of imports** (up from 40-60%)
2. **Follow cross-file taint flows** through the complete path
3. **Detect SQL injection** from SearchPanel.vue → products.ts → backend
4. **Detect path traversal** from FileManager.vue → products.ts → backend
5. **Detect XXE** from FileManager.vue → products.ts → backend
6. **Detect SSTI** from TemplateRenderer.vue → products.ts → backend

## Verification

Run TheAuditor on this project and verify:

```bash
# Index the project
aud index --root ./frameworks/vue_project

# Check import resolution rate
aud stats --show-imports

# Run taint analysis
aud taint --entry src/components/SearchPanel.vue
```

Expected output should show cross-file taint flows from Vue components to API layer.
