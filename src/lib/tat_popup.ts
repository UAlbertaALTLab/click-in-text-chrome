// this file defines the custom element "transover-type-and-translate-popup" using the tat_popup.html template

/**
 * TAT means type-and-translate
 */
class TATPopup extends HTMLElement {
  static get observedAttributes() {
    return ['data-disable_on_this_page']
  }

  constructor() {
    super()
    const t = (<HTMLTemplateElement>document.querySelector('#transover-tat-popup-template')).content.cloneNode(true)
    this.attachShadow({mode: 'open'}).appendChild(t)

    const sendTranslate = () => {
      window.postMessage({
        type: 'transoverTranslate',
        text: this.q('#tat_input').value,
      }, '*')
    }


    this.q('main').onkeydown = (e) => {
      if (e.keyCode == 13) {
        sendTranslate()
      }
      // let 'escape' be handled in the host context (by content script)
      if (e.keyCode == 27) {
        return
      }
      e.stopPropagation()
    }

    this.q('#disable_on_this_page').onchange = (e) => {
      window.postMessage({
        type: 'toggle_disable_on_this_page',
        disable_on_this_page: e.target.checked
      }, '*')
    }

    this.q('#tat_close').onclick = (e) => {
      // todo: what does targetOrigin (the second argument) do?
      window.postMessage({type: 'tat_close'}, undefined)
      e.preventDefault()
    }

    this.q('#tat_submit').onclick = sendTranslate
  }

  connectedCallback() {
    this.q('#tat_input').focus()
  }

  attributeChangedCallback(attribute, oldVal, newVal) {
    if (attribute === 'data-disable_on_this_page') {
      this.q('#disable_on_this_page').checked = JSON.parse(newVal)
    }
  }

  q(selector) {
    return this.shadowRoot.querySelector(selector)
  }
}

window.customElements.define('transover-type-and-translate-popup', TATPopup)
