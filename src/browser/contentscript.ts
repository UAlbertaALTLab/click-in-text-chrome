// Chrome runs contentscript.js whenever the user creates a tab. Contentscript.js has the same context as the opened tab
// meaning it can manipulate web content.

import Core from '../lib/transover_core'

// const debug = require('debug')('transover')


const getURL = function (e) {
  return new URL(chrome.extension.getURL(e))
}

const applyUserOptions = () => {
  const options = {except_urls: [], only_urls: []}

  chrome.runtime.sendMessage({handler: 'get_options'}, function (response) {
    $.extend(options, JSON.parse(response.options))
    Core.disable_on_this_page = Core.ignoreThisPage(options)
    chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
  })

  return options
}

const asyncGetTranslation = (word, callback) => {
  chrome.runtime.sendMessage({handler: 'translate', word: word}, callback)
}

const getTranslationCallback = (response) => {
  return response.translation
}

const addTATAndCopyPasteListener = function (e) {
  chrome.runtime.onMessage.addListener(e)
}

const disable = () => {
  chrome.runtime.sendMessage({
    handler: 'toggle_disable_on_this_page',
    disable_on_this_page: Core.disable_on_this_page,
    current_url: window.location.origin
  })
}

const grayOutIcon = () => {
  chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
}

Core.start(getURL, applyUserOptions, asyncGetTranslation, getTranslationCallback, addTATAndCopyPasteListener, disable, grayOutIcon)


