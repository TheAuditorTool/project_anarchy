/* eslint-disable no-useless-escape */
// FLAW 114: Linter rule is disabled for the entire file.

// Fake Errors: 5
// 1. aud detect-patterns: A regex with catastrophic backtracking potential.
// 2. aud lint --workset: A linter rule is disabled for the file.
// 3. ml.py: A repeated anti-pattern (in this case, overly complex regexes) that ML can learn.
// 4. risk_scorer.py: This file has high churn but low test coverage (simulated).
// 5. framework_detector.py: Contains code for a different framework (e.g., Vue) in a project that might otherwise be identified as React.

// FLAW 112 (Catastrophic Backtracking): The (a+)+ pattern is exponential.
const badRegex = /^(a+)+$/;

// FLAW 116 (Vue in React Project): A Vue-specific pattern.
export default {
  data() {
    return { message: 'Hello Vue!' }
  }
};

// FLAW 113: Another complex regex, establishing a repeated anti-pattern for ML.
const anotherBadRegex = /^(\w+\s?)*$/;

// FLAW 115: This file is marked as high-churn (e.g., in git history) but has no tests, flagging the risk scorer.
function unstable_feature() {
    return "needs tests";
}