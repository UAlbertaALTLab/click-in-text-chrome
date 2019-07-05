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

let addTATAndCopyPasteListner = function (e) {}

const disable = () =>{

}

const grayOutIcon = () =>{
  // chrome.runtime.sendMessage({handler: 'setIcon', disabled: Core.disable_on_this_page})
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







