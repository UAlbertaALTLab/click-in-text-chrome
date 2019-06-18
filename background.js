import Options from './lib/options'
import TransOver from './lib/transover_utils'


function translate(word, sl, tl, last_translation, onresponse, sendResponse) {

  const options = {
    url: 'http://sapir.artsrn.ualberta.ca/cree-dictionary/_translate-cree/'+word,
    dataType: 'json',
    success: function on_success(data) {
      onresponse(data, word, tl, last_translation, sendResponse)
    },
    error: function(xhr, status, e) {
      console.log({e: e, xhr: xhr})
    }
  }

  $.ajax(options)
}

function figureOutSlTl(tab_lang) {
  const res = {}

  if (Options.target_lang() == tab_lang && Options.reverse_lang()) {
    res.tl = Options.reverse_lang()
    res.sl = Options.target_lang()
    console.log('reverse translate into: ', {tl: res.tl, sl: res.sl})
  }
  else {
    res.tl = Options.target_lang()
    res.sl = Options.from_lang()
    console.log('normal translate into:', {tl: res.tl, sl: res.sl})
  }

  return res
}

function on_translation_response(data, word, tl, last_translation, sendResponse) {
  let output
  const translation = {tl: tl}

  console.log('raw_translation: ', data)

  if (!data.translation || data.translation.length === 0) {
    translation.succeeded = false
    if (Options.do_not_show_oops()) {
      output = ''
    } else {
      output = 'Oops.. No translation found.'
    }
  } else{
    translation.succeeded = true
    translation.word = word
    output = []
    if (data.translation) { // full translation
      data.translation.forEach(function (t) {

        const definition_list = []

        t.definitions.forEach(function (dic) {
          definition_list.push(dic.definition +'; ' +  dic.source)
        }
        )
        output.push({pos: t.lemma + t.analysis, meanings: definition_list})
      })
    }
    translation.sl = 'cree'
  }

  // if ((!data.dict && !data.sentences) || (!data.dict && translationIsTheSameAsInput(data.sentences, word))) {
  //   translation.succeeded = false
  //
  //   if (Options.do_not_show_oops()) {
  //     output = ''
  //   } else {
  //     output = 'Oops.. No translation found.'
  //   }
  // } else {
  //   translation.succeeded = true
  //   translation.word = word
  //
  //   output = []
  //   if (data.dict) { // full translation
  //     data.dict.forEach(function(t) {
  //       output.push({pos: t.pos, meanings: ['123', '456']})
  //     })
  //   } else { // single word or sentence(s)
  //     data.sentences.forEach(function(s) {
  //       output.push(s.trans)
  //     })
  //     output = output.join(' ')
  //   }
  //
  //   translation.sl = data.src
  // }

  if (!( output instanceof String)) {
    output = JSON.stringify(output)
  }

  translation.translation = output

  $.extend(last_translation, translation)


  console.log('response: ', translation)
  sendResponse(translation)
}

const last_translation = {}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  const except_urls = Options.except_urls()

  switch (request.handler) {
  case 'get_last_tat_sl_tl':
    console.log('get_last_tat_sl_tl')
    sendResponse({
      last_tl: localStorage['last_tat_tl'],
      last_sl: localStorage['last_tat_sl']
    })
    break
  case 'get_options':
    sendResponse({
      options: JSON.stringify({
        except_urls: Options.except_urls(),
        only_urls: Options.only_urls(),
        target_lang: Options.target_lang(),
        reverse_lang: Options.reverse_lang(),
        delay: Options.delay(),
        word_key_only: Options.word_key_only(),
        selection_key_only: Options.selection_key_only(),
        tts: Options.tts(),
        tts_key: Options.tts_key(),
        popup_show_trigger: Options.popup_show_trigger(),
        translate_by: Options.translate_by(),
        show_from_lang: Options.show_from_lang()
      })
    })
    break
  case 'translate':
    console.log('received to translate: ' + request.word)

    chrome.tabs.detectLanguage(null, function(tab_lang) {
      let sl, tl
      // hack: presence of request.tl/sl means this came from popup translate
      if (request.tl && request.sl) {
        localStorage['last_tat_tl'] = request.tl
        localStorage['last_tat_sl'] = request.sl
        sl = request.sl
        tl = request.tl
      } else {
        const sltl = figureOutSlTl(tab_lang)
        sl = sltl.sl
        tl = sltl.tl
      }
      translate(request.word, sl, tl, last_translation, on_translation_response, sendResponse)
    })
    break
  case 'tts':
    if (last_translation.succeeded) {
      console.log('tts: ' + last_translation.word + ', sl: ' + last_translation.sl)

      const msg = new SpeechSynthesisUtterance()
      msg.lang = last_translation.sl
      msg.text = last_translation.word
      msg.rate = 0.7
      speechSynthesis.speak(msg)
    }
    sendResponse({})
    break
  case 'setIcon':
    chrome.browserAction.setIcon({path: request.disabled ? 'to_bw_38.png' : 'to_38.png'})
    break
  case 'toggle_disable_on_this_page':
    if (request.disable_on_this_page) {
      if (!except_urls.find(u => u.match(request.current_url))) {
        Options.except_urls(
          [request.current_url, ...except_urls]
        )
      }
    } else {
      if (except_urls.find(u => u.match(request.current_url))) {
        Options.except_urls(
          except_urls.filter(u => !u.match(request.current_url))
        )
      }
    }
    break
  default:
    console.error('Unknown handler')
    sendResponse({})
  }
})

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, 'open_type_and_translate')
})

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason == 'install') {
    chrome.tabs.create({url: chrome.extension.getURL('options.html')})
  }
})

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
  case 'copy-translation-to-clipboard':
    chrome.tabs.query({active: true}, ([activeTab]) => {
      chrome.tabs.sendMessage(activeTab.id, 'copy-translation-to-clipboard')
    })
    break
  default:
    console.log('Unknown command %s', command)
  }
})
