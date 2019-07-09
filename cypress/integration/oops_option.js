
describe('Always show oops setting', function() {
  it('shows oops message', function() {
    cy.visit('localhost:8080/test.html')
    cy.get('#non_cree_hello').click()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'Oops..')
  })
})

describe('Never show oops setting', function() {
  it('shows oops message', function() {
    cy.visit('localhost:8080/test.html')
    cy.set_option(()=>{
      cy.get('#do_not_show_oops').check()
    })
    cy.get('#non_cree_hello').click()
    cy.get('transover-popup').should('not.exist')
  })
})



