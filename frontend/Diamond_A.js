// FLAW: Part of a diamond dependency (A -> B, A -> C)
import './utils/Diamond_B.js';
import './utils/Diamond_C.js';
console.log("A loaded");