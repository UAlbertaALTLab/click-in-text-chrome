// load type definitions that come with Cypress module
/// <reference types="cypress" />

/**
 * A function that finds some option on the dom and changes it (by checking/typing etc.)
 */
interface Configurate {
  (): void;
}

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * This command opens more-settings, lets you configurate, and clicks on save-settings button
     * @example cy.set_option( ()=>cy.get('#word_key_only').check())
     */
    set_option(configurate: Configurate): Chainable


    /**
     * This command simulates hovering on an element. It's named move instead of hover because cypress already has
     * a placeholder command called hover that doesn't do anything.
     * @example cy.get("[data-cy=test-button]").move()
     */
    move(): Chainable<JQuery<HTMLElement>>

    /**
     * This command simulates painting/highlighting text and emits mousemove events
     * @example cy.get([data-cy=test-text]).selectText()
     */
    selectText(): Chainable<JQuery<HTMLElement>>;
  }

}