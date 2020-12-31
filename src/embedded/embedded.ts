import Core from '../lib/transover_core'


/**
 * On embedded version, we don't support option tweaking yet
 */
const addSaveOptionHandler = () => {
  return
}


const asyncGetTranslation = (word, callback) => {
  Core.callAPI(word, Core.parseAPIResponse, callback)
}

const addTATAndCopyPasteListener = function (callback) {
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


/**
 * We don't provide a way to disable yet
 */
const disable = () => {
  return
}


// there is no "Icon" in a embedded version
const grayOutIcon = () => {
  return
}


Core.start(addSaveOptionHandler, asyncGetTranslation, addTATAndCopyPasteListener, disable, grayOutIcon)