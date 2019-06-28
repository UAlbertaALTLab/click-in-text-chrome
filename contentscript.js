// Chrome runs contentscript.js whenever the user creates a tab. Contentscript.js has the same context as the opened tab
// meaning it can manipulate web content.

import TransOver from './lib/transover_utils'
import Core from './lib/transover_core'

const debug = require('debug')('transover')





const getURL = chrome.extension.getURL
const loadAndApplyOptions = () =>
{
  let options = {}

  chrome.runtime.sendMessage({handler: 'get_options'},    function (response) {
    $.extend(options, JSON.parse(response.options))
    Core.disable_on_this_page = Core.ignoreThisPage(options)
    chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
  } )

  return options
}

const asyncGetTranslation = (word, callback) =>{
  chrome.runtime.sendMessage({handler:'translate', word:word}, callback)
}

const getTranslationCallback = (response) => {
  return TransOver.deserialize(response.translation)
}

// chrome.runtime.sendMessage({handler: 'translate', word: word}, function (response) {
//   // debug('response: ', response)
//
//   const translation = TransOver.deserialize(response.translation)
//   console.log(translation)
//
//   if (!translation) {
//     // debug('skipping empty translation')
//     return
//   }
//
//   Core.last_translation = translation
//   Core.showPopup(e, TransOver.formatTranslation(translation))
// })


Core.loadAndApplyUserOptions(loadAndApplyOptions)
Core.reloadAndApplyOptionsOnTabSwitch(loadAndApplyOptions)
Core.startNoiselessMouseMovementsListening()
Core.startKeyPressListening()
Core.startMouseStopHandling(asyncGetTranslation, getTranslationCallback)
Core.startClickHandling(asyncGetTranslation, getTranslationCallback)
Core.startMouseMoveHandling()

Core.removePopupUponScrolling()


chrome.runtime.onMessage.addListener(

  function (request) {
    if (window != window.top) return

    console.log('place3')
    if (request == 'open_type_and_translate') {
      if ($('transover-type-and-translate-popup').length == 0) {
        const $popup = Core.createPopup('transover-type-and-translate-popup', Core.templates[Core.templateIds['transover-type-and-translate-popup']])
        $popup.attr('data-disable_on_this_page', Core.disable_on_this_page)
        $('body').append($popup)
        $popup.each(function () {
          $(this.shadowRoot.querySelector('main')).hide().fadeIn('fast')
        })
      } else {
        Core.removePopup('transover-type-and-translate-popup')
      }
    } else if (request == 'copy-translation-to-clipboard') {
      debug('received copy-translation-to-clipboard')
      if ($('transover-popup').length > 0) {
        let toClipboard
        if (Array.isArray(Core.last_translation)) {
          toClipboard = Core.last_translation.map(t => {
            let line = ''
            if (t.pos) {
              line = t.pos + ': '
            }
            line = line + t.meanings.slice(0, 5).join(', ')
            return line
          }).join('; ')
        } else {
          toClipboard = Core.last_translation
        }
        Core.copyToClipboard(toClipboard)
      }
    }
  }
)

$(function () {
  Core.registerTransoverComponent('popup', getURL)
  Core.registerTransoverComponent('tat_popup', getURL)
})

window.addEventListener('message', function (e) {
  console.log('place2')
  console.log(e.source)
  console.log(e.data.type)
  // We only accept messages from ourselves
  if (e.source != window)
    return

  if (e.data.type == 'transoverTranslate') {
    chrome.runtime.sendMessage({handler: 'translate', word: e.data.text}, function (response) {
      debug('tat response: ', response)
      console.log('lmao')
      console.log(response)
      const translation = TransOver.deserialize(response.translation)
      console.log('shit')
      if (!translation) {
        debug('tat skipping empty translation')
        return
      }

      const e = {clientX: $(window).width(), clientY: 0}
      Core.last_translation = translation
      Core.showPopup(e, TransOver.formatTranslation(translation))
    })
  } else if (e.data.type === 'toggle_disable_on_this_page') {
    Core.disable_on_this_page = e.data.disable_on_this_page
    console.log('disable??', Core.disable_on_this_page)
    chrome.runtime.sendMessage({
      handler: 'toggle_disable_on_this_page',
      disable_on_this_page: Core.disable_on_this_page,
      current_url: window.location.origin
    })
    chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
    Core.removePopup('transover-type-and-translate-popup')
  } else if (e.data.type === 'tat_close') {
    Core.removePopup('transover-type-and-translate-popup')
  }
})
