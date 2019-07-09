
describe('Default settings', function() {
  it('shows popup for niskak', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#translate_by').select('point at word')
    })
    cy.get('#test1').move()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')
  })
})

describe('alt trigger-key', function() {
  it('shows popup for niskak only when alt is held', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#translate_by').select('point at word')
      cy.get('#word_key_only').check()
    })
    cy.get('#test1').move()
    cy.get('transover-popup').should('not.exist')

    cy.get('body').type('{alt}', { release: false })
      .get('#test1').move()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')
    cy.get('body').type('{alt}') // release the key

  })
})

describe('ctrl trigger-key', function() {
  it('shows popup for niskak only when control is held', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#translate_by').select('point at word')
      cy.get('#word_key_only').check()
      cy.get('#word_key_only_key').select('ctrl')
    })
    cy.get('#test1').move()
    cy.get('transover-popup').should('not.exist')

    cy.get('body').type('{ctrl}', { release: false })
      .get('#test1').move()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'damp')
    cy.get('body').type('{ctrl}') // release the key

  })
})

describe('delay option', function() {
  it('delays', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#translate_by').select('point at word')
      cy.get('#delay').clear().type('2000')


    })

    cy.get('#test1').move()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000).get('transover-popup').should('not.exist')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000).get('transover-popup')

  })
})