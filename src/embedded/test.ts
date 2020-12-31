import Core from '../lib/transover_core'

// const debug = require('debug')('transover')


const getURL = function (e) {
  return e
}


const addSaveOptionHandler = (saveOptions) => {

  $(() => {
      $('#save_button').on('click', function () {
        saveOptions()
        // console.table(Core.options)
      })
    }
  )

}


const asyncGetTranslation = (word, callback) => {
  Core.callAPI(word, Core.parseAPIResponse, callback)
}

const addTATAndCopyPasteListener = function (callback) {

  $(() => {

      $('#copy_button').on('click', function () {
        callback('copy-translation-to-clipboard')
      })

      $('#tat_button').on('click', function () {
        callback('open_type_and_translate')
      })

    }
  )

  // not tested in cypress cuz cypress is a bitch on pressing shortcuts
  document.onkeyup = function (e) {
    //.keyCode is deprecated, use .code
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
    const code = e.code

    // assume the user uses alt + X as "copy translation to clipboard" shortcut
    if (e.altKey && code === 'KeyX') {
      callback('copy-translation-to-clipboard')
    }

    // assume the user uses alt + z as "open type and translate popup" shortcut
    if (e.altKey && code === 'KeyZ') {
      callback('open_type_and_translate')
    }

  }

}


const disable = () => {
  return
}

const grayOutIcon = () => {
  // chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
}


Core.start(getURL, addSaveOptionHandler, asyncGetTranslation, addTATAndCopyPasteListener, disable, grayOutIcon)







