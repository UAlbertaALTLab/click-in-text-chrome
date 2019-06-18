import Options from './lib/options'


// where translate api happens
function translate(word, onresponse, sendResponse) {

  const options = {
    url: 'http://sapir.artsrn.ualberta.ca/cree-dictionary/_translate-cree/'+word,
    dataType: 'json',
    success: function on_success(data) {
      onresponse(data, word, sendResponse)
    },
    error: function(xhr, status, e) {
      console.log({e: e, xhr: xhr})
    }
  }
  $.ajax(options)
}

function on_translation_response(data, word, sendResponse) {
  let output
  const translation = {}

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
  }

  if (!( output instanceof String)) {
    output = JSON.stringify(output)
  }

  translation.translation = output

  $.extend( translation)


  console.log('response: ', translation)
  sendResponse(translation)
}



chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  const except_urls = Options.except_urls()

  switch (request.handler) {
  case 'get_options':
    sendResponse({
      options: JSON.stringify({
        except_urls: Options.except_urls(),
        only_urls: Options.only_urls(),
        delay: Options.delay(),
        word_key_only: Options.word_key_only(),
        selection_key_only: Options.selection_key_only(),
        popup_show_trigger: Options.popup_show_trigger(),
        translate_by: Options.translate_by(),
      })
    })
    break
  case 'translate':
    console.log('received to translate: ' + request.word)
    translate(request.word, on_translation_response, sendResponse)
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
