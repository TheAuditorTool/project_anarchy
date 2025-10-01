// Fake Errors: 4 (Covering multiple remaining CLI command gaps)
// 1. aud suggest-fixes: A clear missing try-catch block around a risky operation.
// 2. aud suggest-fixes: An unhandled promise rejection.
// 3. aud flow-analyze: An event emitter with a memory leak (listeners added, never removed).
// 4. pattern_rca.py: Systematic resource cleanup failure.

import { EventEmitter } from 'events';

// FLAW 159: Missing try-catch.
function parseJsonUnsafe(jsonString) {
  // This will throw an exception on invalid JSON.
  const data = JSON.parse(jsonString);
  return data.field;
}

// FLAW 160: Unhandled promise rejection.
function unsafePromise() {
  return Promise.reject("This promise was intentionally rejected and never caught.");
}

// FLAW 161: Event emitter memory leak.
const leakyEmitter = new EventEmitter();
function addLeakyListener() {
    leakyEmitter.on('data', () => console.log('Leaky listener!'));
    // No corresponding 'removeListener' is ever called.
}

// FLAW 162: Systematic resource cleanup failure.
function getResource() {
    const resource = open_some_handle();
    // The handle is never closed in this function, a repeated pattern.
    return resource.read();
}