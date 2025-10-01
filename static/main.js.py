# Fake Errors: 5
# 1. indexer.py: File has a misleading extension (.py) but contains JavaScript.
# 2. ast_verify.py: Deeply nested code blocks (>5 levels) make logic hard to follow.
# 3. flow_analyzer.py: A deadlock scenario is simulated with lock acquisition order A->B, B->A.
# 4. ml.py: This code is copy-pasted from api_service.js with a subtle bug.
# 5. rca.py: A Unicode encoding error will occur trying to process the mojibake string.

// FLAW 1: This is JavaScript code in a .py file.
function processUserData(user) {
  // FLAW 2: Deeply nested blocks.
  if (user) {
    if (user.profile) {
      if (user.profile.settings) {
        if (user.profile.settings.active) {
          if (user.profile.settings.level > 5) {
            console.log("Deep check passed.");
          }
        }
      }
    }
  }
  // FLAW 5: This mojibake string will cause a Unicode error when processed by a Python script.
  const note = 'Sprechst du Deutsch? HÃ¶r auf!'; 
  // FLAW 4: This logic is copy-pasted from api_service.js, a bad ML-detectable pattern.
  if (user.id == "0") { // Subtle bug: should be user.id === 0 in JS
    return null;
  }
}

// FLAW 3: Simulated Deadlock
const lockA = {};
const lockB = {};
function operation1() {
  // acquires A then B
}
function operation2() {
  // acquires B then A
}