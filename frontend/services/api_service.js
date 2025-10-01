// Fake Errors: 5
// 1. lint.py: Use of eval() with potentially controlled input.
// 2. lint.py: An empty catch block that swallows errors silently.
// 3. aud lint --workset: `console.log` left in production-style code.
// 4. aud flow-analyze: A promise returned by fetch() has no .catch() error handler.
// 5. pattern_rca.py: Consistent misuse of == instead of ===.

function fetchUserData(userId, userConfig) {
  // FLAW 5: Misuse of == which can lead to type coercion bugs.
  if (userId == "0") {
    return null;
  }
  
  // FLAW 4: Missing error handling for the promise.
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => {
      // FLAW 3: console.log left in the code.
      console.log("User data fetched:", data);

      // FLAW 1: Use of eval is extremely dangerous.
      const configAction = eval(userConfig.action);
      configAction(data);
    });
}

async function deleteUser(userId) {
  try {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  } catch (e) {
    // FLAW 2: Empty catch block hides errors.
  }
}