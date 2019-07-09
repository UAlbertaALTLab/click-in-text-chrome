describe('Default settings', function() {
  it('shows popup for niskak', function() {
    cy.visit('localhost:8080/test.html')
    // cy.get('#test1').move()

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500) // for javascript to settle
    cy.get('#test1').click()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')

  })
})


describe('alt trigger-key', function() {
  it('only shows popup when alt is held', function() {
    cy.visit('localhost:8080/test.html')
    // cy.get('#test1').move()

    cy.set_option(()=>{
      cy.get('#word_key_only').check()
    })

    cy.get('#test1').click()

    cy.get('transover-popup').should('not.exist')

    cy.get('body').type('{alt}', { release: false })
      .get('#test1').click()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')

  })
})

describe('ctrl trigger-key', function() {
  it('shows popup for niskak only when control is held', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#word_key_only').check()
      cy.get('#word_key_only_key').select('ctrl')
    })
    cy.get('#test1').click()
    cy.get('transover-popup').should('not.exist')

    cy.get('body').type('{ctrl}', { release: false })
      .get('#test1').click()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')
    cy.get('body').type('{ctrl}') // release the key

  })
})