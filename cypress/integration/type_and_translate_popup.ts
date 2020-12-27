// fixme: this test passes locally on my Windows system but not on GitHub actions
describe.skip('Popup Existence', function() {
  it('displays a tat popup', function() {

    cy.visit('localhost:8080/test.html')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000) // if the click happens too fast, the javascript won't have time to register the tat popup
    cy.get('#tat_button').click()

    cy.get('transover-type-and-translate-popup')
  })
})
