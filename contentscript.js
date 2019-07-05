// Chrome runs contentscript.js whenever the user creates a tab. Contentscript.js has the same context as the opened tab
// meaning it can manipulate web content.

import TransOver from './lib/transover_utils'
import Core from './lib/transover_core'

// const debug = require('debug')('transover')


const getURL = function (e){ return chrome.extension.getURL(e)}

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

let addTATAndCopyPasteListner = function (e) {chrome.runtime.onMessage.addListener(e)}

const disable = () =>{
  chrome.runtime.sendMessage({
    handler: 'toggle_disable_on_this_page',
    disable_on_this_page: Core.disable_on_this_page,
    current_url: window.location.origin
  })
}

const grayOutIcon = () =>{
  chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
}


Core.loadAndApplyUserOptions(loadAndApplyOptions)
Core.reloadAndApplyOptionsOnTabSwitch(loadAndApplyOptions)
Core.startNoiselessMouseMovementsListening()
Core.startKeyPressListening(asyncGetTranslation, getTranslationCallback)
Core.startMouseStopHandling(asyncGetTranslation, getTranslationCallback)
Core.startClickHandling(asyncGetTranslation, getTranslationCallback)
Core.startMouseMoveHandling()
Core.removePopupUponScrolling()
Core.attachTATandCopyPasteHandler(addTATAndCopyPasteListner)
Core.registerComponents(getURL)
Core.addMessageHandlersToWindow(asyncGetTranslation, getTranslationCallback, disable, grayOutIcon)

