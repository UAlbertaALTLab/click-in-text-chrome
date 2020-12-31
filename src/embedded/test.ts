import Core from '../lib/transover_core'


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

  // extra buttons for testing
  $(() => {

      $('#copy_button').on('click', function () {
        callback('copy-translation-to-clipboard')
      })

      $('#tat_button').on('click', function () {
        callback('open_type_and_translate')
      })

    }
  )

  // not tested in cypress cuz cypress refuses to accept key combinations
  document.onkeyup = function (e) {
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


Core.start(addSaveOptionHandler, asyncGetTranslation, addTATAndCopyPasteListener, disable, grayOutIcon)







