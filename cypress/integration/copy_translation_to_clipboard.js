// copy button doesn't work
describe('Clipboard', function() {
  it.skip('copies the last translation to clipboard', function() {
    cy.visit('localhost:8080/test.html')


    cy.get('#test1').click()

    cy.get('transover-popup').should('have.attr', 'content').and('include', 'see')

    // cy.get('.blank-rectangle').move()

    cy.get('#copy_button').click()

    cy.get('#test_input').focus().then(()=>{
      cy.document().then((document)=>[
        document.execCommand('paste')
      ])
    })
  })
})
