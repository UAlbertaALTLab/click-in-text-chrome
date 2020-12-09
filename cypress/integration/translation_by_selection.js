describe('Default settings', function() {
  it('displays a popup for cree', function() {

    cy.visit('localhost:8080/test.html')

    cy.get('#test1').selectText()

    cy.get('transover-popup').should('have.attr', 'content').and('include', 'see')
  })
})


describe('alt trigger-key', function() {
  it('shows popup for cree only when alt is held', function() {
    cy.visit('localhost:8080/test.html')

    cy.set_option(()=>{
      cy.get('#selection_key_only').check()
    })

    cy.get('body').type('{alt}', { release: false })
      .get('#test1').selectText()
    cy.get('transover-popup').should('have.attr', 'content').and('include', 'see')
    cy.get('body').type('{alt}') // release the key

  })
})

// describe('ctrl trigger-key', function() {
//   it('shows popup for cree only when control is held', function() {
//     cy.visit('localhost:8080/test.html')
//
//     cy.set_option(()=>{
//       cy.get('#translate_by').select('point at word')
//       cy.get('#word_key_only').check()
//       cy.get('#word_key_only_key').select('ctrl')
//     })
//     cy.get('#test1').move()
//     cy.get('transover-popup').should('not.exist')
//
//     cy.get('body').type('{ctrl}', { release: false })
//       .get('#test1').move()
//     cy.get('transover-popup').should('have.attr', 'content').and('include', 'see')
//     cy.get('body').type('{ctrl}') // release the key
//
//   })
// })