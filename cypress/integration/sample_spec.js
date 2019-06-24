

describe('My First Test', function() {
  it('Shows popup for niskak', function() {
    cy.visit('localhost:8080/test.html')
    cy.get('#test1').click()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')

  })



})