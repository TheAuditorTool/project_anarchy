/**
 * Flaky E2E Test Suite - User Journey
 * Contains timing issues and unreliable selectors
 */

describe('User Journey E2E', () => {
  before(() => {
    // Setup that sometimes fails
    cy.visit('http://localhost:3000');
    
    // ERROR 342: No proper wait for page load
    // This selector might not exist yet when the test runs
    cy.get('#app-loaded').should('exist');  
    // Should wait for specific content or use cy.intercept() for API calls
  });
  
  it('should allow user to login and view products', () => {
    // Flaky navigation test
    cy.get('button[data-test=login]').click();
    
    // ERROR 343: Race condition with form submission
    // Typing and clicking immediately without waiting for form to be ready
    cy.get('#username').type('testuser');
    cy.get('#password').type('password123');
    cy.get('form').submit(); // Might submit before typing completes
    
    // Missing wait for login to complete
    cy.url().should('include', '/dashboard');
    
    // Trying to interact with products that might not be loaded
    cy.get('.product-card').first().click();
    
    // ERROR 344: Using brittle CSS selectors that break with styling changes
    // These selectors are tied to implementation details
    cy.get('div.MuiCard-root > div.MuiCardContent-root > h2.MuiTypography-h5')
      .should('contain', 'Product');
    // Should use data-test attributes: cy.get('[data-test=product-title]')
    
    // More brittle selectors
    cy.get('button.MuiButton-containedPrimary.MuiButton-sizeMedium')
      .contains('Add to Cart')
      .click();
    
    // Timing-dependent assertion
    cy.get('.cart-count', { timeout: 100 }) // Too short timeout
      .should('have.text', '1');
  });
  
  it('should handle checkout flow', () => {
    // Assumes previous test state (test interdependency)
    cy.get('[data-test=cart]').click();
    
    // Flaky hover interaction
    cy.get('.checkout-button').trigger('mouseover');
    cy.wait(50); // Arbitrary wait instead of proper condition
    cy.get('.checkout-tooltip').should('be.visible');
    
    cy.get('.checkout-button').click();
    
    // Form filling without proper waits
    cy.get('#shipping-address').type('123 Test St');
    cy.get('#card-number').type('4111111111111111');
    cy.get('#expiry').type('12/25');
    cy.get('#cvv').type('123');
    
    // Network-dependent action without proper handling
    cy.get('button[type=submit]').click();
    
    // Assumes immediate response
    cy.get('.success-message').should('be.visible');
  });
  
  afterEach(() => {
    // Incomplete cleanup that might affect next test
    cy.clearCookies();
    // Should also clear localStorage, sessionStorage, reset database state
  });
});

// Additional flaky test patterns
describe('Admin Features', () => {
  it('should allow admin to manage users', () => {
    // Hard-coded wait times
    cy.visit('/admin');
    cy.wait(2000); // Bad practice: arbitrary wait
    
    // Assumes admin is already logged in (state dependency)
    cy.get('.user-list').should('exist');
    
    // Clicking without ensuring element is actionable
    cy.get('.edit-user-btn').first().click({ force: true }); // Using force: true masks issues
    
    // Not handling async data loading
    cy.get('.user-form').within(() => {
      cy.get('input[name=email]').clear().type('new@example.com');
      cy.get('button[type=submit]').click();
    });
    
    // Immediate assertion without waiting for update
    cy.get('.user-list').contains('new@example.com');
  });
});

// Test configuration issues
Cypress.config({
  defaultCommandTimeout: 1000, // Too short for most operations
  requestTimeout: 1000,        // Will cause flaky API tests
  responseTimeout: 1000,       // Too aggressive
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,                // No video evidence when tests fail
  screenshotOnRunFailure: false, // No debugging screenshots
  retries: {
    runMode: 5,                // Masking flakiness with retries
    openMode: 0
  }
});