/**
 * ESLint Violations Test File
 * Phase 10: Contains 8 intentional ESLint violations for TheAuditor validation
 * Errors 181-188
 */

// ERROR 181: no-unused-vars - Variable declared but never used
const unusedVariable = 'This variable is never referenced';

// ERROR 182: eqeqeq - Use of == instead of ===
function compareValues(a, b) {
    if (a == b) {  // Should use ===
        return true;
    }
    return false;
}

// ERROR 183: no-console - Console.log left in production code
function processUser(userId) {
    console.log('Processing user:', userId);
    return { processed: true };
}

// ERROR 184: no-unreachable - Unreachable code after return
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
    const tax = 0.08;  // This line is unreachable
    return total * (1 + tax);
}

// ERROR 185: no-undef - Reference to undeclared variable
function getGlobalConfig() {
    return globalConfigObject;  // globalConfigObject is not defined
}

// ERROR 186: max-nested-callbacks - Deeply nested callbacks (4+ levels)
function callbackHell(data) {
    getUserData(data.userId, function(err, user) {
        if (!err) {
            getOrderHistory(user.id, function(err, orders) {
                if (!err) {
                    processOrders(orders, function(err, processed) {
                        if (!err) {
                            saveResults(processed, function(err, saved) {
                                if (!err) {
                                    console.log('Finally done!');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

// ERROR 187: Promise without .catch() handler
function fetchDataUnsafely() {
    // This promise has no error handling
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            processData(data);
        })
    // Missing .catch() to handle rejection
}

// ERROR 188: Missing semicolons where expected
function missingPunctuation() {
    let x = 5
    let y = 10
    const result = x + y
    return result
}

// Helper functions referenced but not implemented (to avoid more errors)
function getUserData(id, callback) { callback(null, { id }); }
function getOrderHistory(id, callback) { callback(null, []); }
function processOrders(orders, callback) { callback(null, orders); }
function saveResults(data, callback) { callback(null, true); }
function processData(data) { return data; }

module.exports = {
    compareValues,
    processUser,
    calculateTotal,
    getGlobalConfig,
    callbackHell,
    fetchDataUnsafely,
    missingPunctuation
};