import TransOver from './lib/transover_utils'
import Core from './lib/transover_core'
import Options from './lib/options'
// import save_options from './lib/options_script'

// const debug = require('debug')('transover')



const getURL = function (e){ return e}

const loadAndApplyOptions = () =>
{
  return {
    except_urls: Options.except_urls(),
    only_urls: Options.only_urls(),
    delay: Options.delay(),
    // 0: <disabled> 16: 'shift', 17: 'ctrl', 18: 'alt', 224: 'meta', 91: 'command', 93: 'command', 13: 'Return'
    word_key_only: Options.word_key_only(),
    selection_key_only: Options.selection_key_only(),
    popup_show_trigger: Options.popup_show_trigger(),
    translate_by: Options.translate_by(),
  }
}

$(()=> {
  $('#save_button').click(function () {
    Options.save_options()
    Core.options = loadAndApplyOptions()
    // console.table(Core.options)
  })
}
)

const asyncGetTranslation = (word, callback) =>{

  Core.callAPI(word, Core.parseAPIResponse, callback)
}

const getTranslationCallback = (response) => {
  return TransOver.deserialize(response.translation)
}

let addTATAndCopyPasteListener = function (callback) {

  $(()=> {



    $('#copy_button').click(function () {
      callback('copy-translation-to-clipboard')
    })

    $('#tat_button').click(function () {
      callback('open_type_and_translate')
    })


  }
  )

  // not tested in cypress cuz cypress is a bitch on pressing shortcuts
  document.onkeyup = function(e) {
  //.keyCode is deprecated, use .code
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
    let code = e.code

    // assume the user uses alt + X as "copy translation to clipboard" shortcut
    if (e.altKey && code === 'KeyX'){
      callback('copy-translation-to-clipboard')
    }

    // assume the user uses alt + z as "open type and translate popup" shortcut
    if (e.altKey && code === 'KeyZ'){
      callback('open_type_and_translate')
    }

  }

}



const disable = () =>{

}

const grayOutIcon = () =>{
  // chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
}



Core.start(getURL, loadAndApplyOptions, asyncGetTranslation, getTranslationCallback, addTATAndCopyPasteListener, disable, grayOutIcon)







