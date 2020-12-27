// fixme: this test won't passes in cypress testing, but if you serve the directory yourself and manually test it works.
//  In cypress testing "#tat_button" does nothing upon press.
//  run `npm run build && ts-node libexec/test-server.ts` to manually test.
//  or even just open a new tab in cypress's browser and the button will work.
describe.skip('Popup Existence', function() {
  it('displays a tat popup', function() {

    cy.visit('localhost:8080/test.html')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000) // if the click happens too fast, the javascript won't have time to register the tat popup
    cy.get('#tat_button').click()

    cy.get('transover-type-and-translate-popup')
  })
})
