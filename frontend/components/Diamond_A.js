// FLAW: Root of a diamond dependency (A -> B, A -> C, both B and C -> D)
// This creates the diamond pattern where D gets included twice
import '../utils/Diamond_B.js';
import '../utils/Diamond_C.js';
console.log("A loaded - diamond dependency root");