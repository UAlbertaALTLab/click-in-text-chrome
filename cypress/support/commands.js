// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('set_option', (doshit) => {

  cy.get('#more_options_link').click()
  doshit()
  cy.get('#save_button').click()

})

// 'move' command simulates hovering on an element
Cypress.Commands.add('move',{prevSubject: true}, (subject) => {
  const $this = subject
  const offset = $this.offset()
  const width = $this.width()
  const height = $this.height()

  const centerX = offset.left + width / 2
  const centerY = offset.top + height / 2
  cy.document().trigger('mousemove', {clientX:centerX, clientY: centerY})


})