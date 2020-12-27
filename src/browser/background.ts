import {options} from '../lib/options'
import Core from '../lib/transover_core'


chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, 'open_type_and_translate')
})

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.tabs.create({url: chrome.extension.getURL('options.html')})
  }
})

chrome.commands.onCommand.addListener(function (command) {
  if (command === 'copy-translation-to-clipboard') {
    chrome.tabs.query({active: true}, ([activeTab]) => {
      chrome.tabs.sendMessage(activeTab.id, 'copy-translation-to-clipboard')
    })
  } else {
    // console.log('Unknown command %s', command)
  }
})


function handleMessage(request, sender, sendResponse) {
  const except_urls = options.except_urls

  // console.log('place1')

  switch (request.handler) {
    case 'get_options':
      sendResponse({
        options: JSON.stringify({
          except_urls: options.except_urls,
          only_urls: options.only_urls,
          delay: options.delay,
          word_key_only: options.word_key_only,
          selection_key_only: options.selection_key_only,
          popup_show_trigger: options.popup_show_trigger,
          translate_by: options.translate_by,
        })
      })
      break
    case 'translate':
      Core.callAPI(request.word, Core.parseAPIResponse, sendResponse)
      break

    case 'setIcon':
      chrome.browserAction.setIcon({path: request.disabled ? 'icons/to_bw_38.png' : 'icons/to_38.png'})
      break
    case 'toggle_disable_on_this_page':
      if (request.disable_on_this_page) {
        // todo: u.toString().match is maybe unidiomatic, same for two extra occurrences below
        if (!except_urls.find(u => u.toString().match(request.current_url))) {
          options.except_urls = [new URL(request.current_url), ...except_urls]

        }
      } else {
        if (except_urls.find(u => u.toString().match(request.current_url))) {
          options.except_urls = except_urls.filter(u => !u.toString().match(request.current_url))

        }
      }
      break
    default:
      // console.error('Unknown handler')
      sendResponse({})
  }

  //https://developer.chrome.com/extensions/runtime#event-onMessage
  // If true is not returned, the channel will close and the sender will never get the response. (And I spent 3 hours debugging this shit)
  return true
}


chrome.runtime.onMessage.addListener(handleMessage)