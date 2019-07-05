describe('Translation by clicking', function() {
  it('shows popup for niskak', function() {
    cy.visit('localhost:8080/test.html')
    // cy.get('#test1').move()
    cy.get('#test1').click()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')
  })
})

describe('Translation by hovering', function() {
  it('shows popup for niskak', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#translate_by').select('point at word')
    })
    cy.get('#test1').move()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')
  })
})



