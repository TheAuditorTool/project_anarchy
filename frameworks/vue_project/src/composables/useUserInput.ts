/**
 * User Input Composable - Composition API + Cross-file Taint Flow
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { useUserInput } from '@/composables/useUserInput'
 * - Import: import { useUserInput } from '@composables/useUserInput'
 * - Should resolve to: src/composables/useUserInput.ts
 *
 * TAINT ANALYSIS TEST:
 * - This composable is the TAINT SOURCE for user input
 * - Taint flows: useUserInput() → store → API → backend
 * - Cross-file flow requires proper module resolution
 */

import { ref, computed } from 'vue';
import { validateSearchQuery, validateFilePath } from '@/utils';  // PATH MAPPING IMPORT
import type { ValidationResult } from '@/types';  // PATH MAPPING IMPORT

/**
 * Composable for handling user search input
 * TAINT SOURCE: User input captured here
 */
export function useUserInput() {
  // TAINT SOURCE: These refs hold user-controlled values
  const searchQuery = ref<string>('');
  const filePath = ref<string>('');
  const xmlContent = ref<string>('');
  const templateContent = ref<string>('');

  // Validation state
  const searchValidation = computed<ValidationResult>(() =>
    validateSearchQuery(searchQuery.value)
  );

  const filePathValidation = computed<ValidationResult>(() =>
    validateFilePath(filePath.value)
  );

  // TAINT FLOW: These methods pass tainted data to consumers
  const getSearchQuery = () => searchQuery.value;  // TAINT PASSTHROUGH
  const getFilePath = () => filePath.value;  // TAINT PASSTHROUGH
  const getXmlContent = () => xmlContent.value;  // TAINT PASSTHROUGH
  const getTemplateContent = () => templateContent.value;  // TAINT PASSTHROUGH

  const setSearchQuery = (value: string) => {
    searchQuery.value = value;  // TAINT SINK (into reactive state)
  };

  const setFilePath = (value: string) => {
    filePath.value = value;  // TAINT SINK
  };

  const setXmlContent = (value: string) => {
    xmlContent.value = value;  // TAINT SINK
  };

  const setTemplateContent = (value: string) => {
    templateContent.value = value;  // TAINT SINK
  };

  const clearAll = () => {
    searchQuery.value = '';
    filePath.value = '';
    xmlContent.value = '';
    templateContent.value = '';
  };

  return {
    // Reactive state
    searchQuery,
    filePath,
    xmlContent,
    templateContent,

    // Computed validations
    searchValidation,
    filePathValidation,

    // Methods
    getSearchQuery,
    getFilePath,
    getXmlContent,
    getTemplateContent,
    setSearchQuery,
    setFilePath,
    setXmlContent,
    setTemplateContent,
    clearAll,
  };
}

export type UseUserInputReturn = ReturnType<typeof useUserInput>;
