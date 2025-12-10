/// <reference types="vite/client" />

/**
 * TypeScript declarations for Vue project
 *
 * MODULE RESOLUTION TEST:
 * This file provides type declarations for:
 * - .vue file imports
 * - import.meta.env variables
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
