// Chrome runs contentscript.js whenever the user creates a tab. Contentscript.js has the same context as the opened tab
// meaning it can manipulate web content.

import TransOver from './lib/transover_utils'
import Core from './lib/transover_core'

const debug = require('debug')('transover')

let disable_on_this_page



const getURL = chrome.extension.getURL
const loadAndApplyOptions = () =>
{
  let options = {}

  chrome.runtime.sendMessage({handler: 'get_options'},    function (response) {
    options = JSON.parse(response.options)
    disable_on_this_page = Core.ignoreThisPage(options)
    chrome.runtime.sendMessage({handler: 'setIcon', disabled: disable_on_this_page})
  } )



  // chrome.extension.sendRequest({handler: 'get_options'}, function (response) {
  //   options = JSON.parse(response.options)
  //   disable_on_this_page = Core.ignoreThisPage(options)
  //   chrome.extension.sendRequest({handler: 'setIcon', disabled: disable_on_this_page})
  // })

  return options
}

//
// const applyOptions = (options) =>
// {
//   disable_on_this_page = Core.ignoreThisPage(options)
//   chrome.extension.sendRequest({handler: 'setIcon', disabled: disable_on_this_page})
// }


Core.loadAndApplyUserOptions(loadAndApplyOptions)
Core.reloadAndApplyOptionsOnTabSwitch(loadAndApplyOptions)
Core.startNoiselessMouseMovementsListening()

//
// // Load user options
// // decide whether to turn icon into black and white when the user loads a tab
// chrome.extension.sendRequest({handler: 'get_options'}, function (response) {
//   options = JSON.parse(response.options)
//   disable_on_this_page = Core.ignoreThisPage(options)
//   chrome.extension.sendRequest({handler: 'setIcon', disabled: disable_on_this_page})
// })
//
//
// // Load user options
// // decide whether to turn icon into black and white whenever the user switches tabs
// //"The visibilitychange event is fired when the content of a tab has become visible or has been hidden."
// document.addEventListener('visibilitychange', function () {
//   if (!document.hidden) {
//     chrome.extension.sendRequest({handler: 'get_options'}, function (response) {
//       options = JSON.parse(response.options)
//       disable_on_this_page = Core.ignoreThisPage(options)
//       chrome.extension.sendRequest({handler: 'setIcon', disabled: disable_on_this_page})
//
//     })
//   }
// }, false)

let last_translation

function process(e) {

  function getHitWord(e) {

    function restorable(node, do_stuff) {
      $(node).wrap('<transwrapper />')
      const res = do_stuff(node)
      $('transwrapper').replaceWith(TransOver.escape_html($('transwrapper').text()))
      return res
    }

    function getExactTextNode(nodes, e) {
      $(text_nodes).wrap('<transblock />')
      let hit_text_node = document.elementFromPoint(e.clientX, e.clientY)

      //means we hit between the lines
      if (hit_text_node.nodeName != 'TRANSBLOCK') {
        $(text_nodes).unwrap()
        return null
      }

      hit_text_node = hit_text_node.childNodes[0]

      $(text_nodes).unwrap()

      return hit_text_node
    }

    const hit_elem = $(document.elementFromPoint(e.clientX, e.clientY))
    const word_re = '\\p{L}+(?:[\'’]\\p{L}+)*'
    const parent_font_style = {
      'line-height': hit_elem.css('line-height'),
      'font-size': '1em',
      'font-family': hit_elem.css('font-family')
    }

    const text_nodes = hit_elem.contents().filter(function () {
      return this.nodeType == Node.TEXT_NODE && XRegExp(word_re).test(this.nodeValue)
    })

    if (text_nodes.length == 0) {
      debug('no text')
      return ''
    }

    const hit_text_node = getExactTextNode(text_nodes, e)
    if (!hit_text_node) {
      debug('hit between lines')
      return ''
    }

    const hit_word = restorable(hit_text_node, function () {
      let hw = ''

      function getHitText(node, parent_font_style) {
        debug('getHitText: \'' + node.textContent + '\'')

        if (XRegExp(word_re).test(node.textContent)) {
          $(node).replaceWith(function () {
            return this.textContent.replace(XRegExp('^(.{' + Math.round(node.textContent.length / 2) + '}(?:\\p{L}|[\'’](?=\\p{L}))*)(.*)', 's'), function ($0, $1, $2) {
              return '<transblock>' + TransOver.escape_html($1) + '</transblock><transblock>' + TransOver.escape_html($2) + '</transblock>'
            })
          })

          $('transblock').css(parent_font_style)

          const next_node = document.elementFromPoint(e.clientX, e.clientY).childNodes[0]

          if (next_node.textContent == node.textContent) {
            return next_node
          } else {
            return getHitText(next_node, parent_font_style)
          }
        } else {
          return null
        }
      }

      const minimal_text_node = getHitText(hit_text_node, parent_font_style)

      if (minimal_text_node) {
        //wrap words inside text node into <transover> element
        $(minimal_text_node).replaceWith(function () {
          return this.textContent.replace(XRegExp('(<|>|&|' + word_re + ')', 'gs'), function ($0, $1) {
            switch ($1) {
            case '<':
              return '&lt;'
            case '>':
              return '&gt;'
            case '&':
              return '&amp;'
            default:
              return '<transover>' + $1 + '</transover>'
            }
          })
        })

        $('transover').css(parent_font_style)

        //get the exact word under cursor
        const hit_word_elem = document.elementFromPoint(e.clientX, e.clientY)

        //no word under cursor? we are done
        if (hit_word_elem.nodeName != 'TRANSOVER') {
          debug('missed!')
        } else {
          hw = $(hit_word_elem).text()
          debug('got it: \'' + hw + '\'')
        }
      }

      return hw
    })

    return hit_word
  }

  const selection = window.getSelection()
  const hit_elem = document.elementFromPoint(e.clientX, e.clientY)

  // happens sometimes on page resize (I think)
  if (!hit_elem) {
    return
  }

  //skip inputs and editable divs
  if (/INPUT|TEXTAREA/.test(hit_elem.nodeName) || hit_elem.isContentEditable
    || $(hit_elem).parents().filter(function () {
      return this.isContentEditable
    }).length > 0) {

    return
  }

  let word = ''
  if (selection.toString()) {

    if (Core.options.selection_key_only) {
      debug('Skip because "selection_key_only"')
      return
    }

    debug('Got selection: ' + selection.toString())

    let sel_container = selection.getRangeAt(0).commonAncestorContainer

    while (sel_container.nodeType != Node.ELEMENT_NODE) {
      sel_container = sel_container.parentNode
    }

    if (
      // only choose selection if mouse stopped within immediate parent of selection
      ($(hit_elem).is(sel_container) || $.contains(sel_container, hit_elem))
      // and since it can still be quite a large area
      // narrow it down by only choosing selection if mouse points at the element that is (partially) inside selection
      && selection.containsNode(hit_elem, true)
    // But what is the point for the first part of condition? Well, without it, pointing at body for instance would also satisfy the second part
    // resulting in selection translation showing up in random places
    ) {
      word = selection.toString()
    } else if (Core.options.translate_by == 'point') {
      word = getHitWord(e)
    }
  } else {
    word = getHitWord(e)
  }
  if (word != '') {
    // chrome.runtime.sendMessage({handler: 'translate', word: word}, function(response) {
    //   debug('response: ', response)
    //
    //   const translation = TransOver.deserialize(response.translation)
    //
    //   if (!translation) {
    //     debug('skipping empty translation')
    //     return
    //   }
    //
    //   last_translation = translation
    //   showPopup(e, TransOver.formatTranslation(translation))
    // })

    chrome.runtime.sendMessage({handler: 'translate', word: word}, function (response) {
      debug('response: ', response)

      const translation = TransOver.deserialize(response.translation)

      if (!translation) {
        debug('skipping empty translation')
        return
      }

      last_translation = translation
      Core.showPopup(e, TransOver.formatTranslation(translation))
    })
  }
}

function withOptionsSatisfied(e, do_stuff) {
  //respect 'translate only when alt pressed' option
  if (Core.options.word_key_only && !show_popup_key_pressed) return

  //respect "don't translate these sites"
  if (disable_on_this_page) return

  do_stuff()

}

$(document).on('mousestop', function (e) {
  withOptionsSatisfied(e, function () {
    // translate selection unless 'translate selection on alt only' is set
    if (window.getSelection().toString()) {
      if (!Core.options.selection_key_only) {
        process(e)
      }
    } else {
      if (Core.options.translate_by === 'point') {
        process(e)
      }
    }
  })
})

$(document).click(function (e) {
  withOptionsSatisfied(e, function () {
    if (Core.options.translate_by !== 'click')
      return
    if ($(e.target).closest('a').length > 0)
      return

    process(e)
  })
  return true
})

let show_popup_key_pressed = false
$(document).keydown(function (e) {
  if (TransOver.modifierKeys[e.keyCode] === Core.options.popup_show_trigger) {
    show_popup_key_pressed = true

    const selection = window.getSelection().toString()

    if (Core.options.selection_key_only && selection) {
      debug('Got selection_key_only')

      chrome.extension.sendRequest({handler: 'translate', word: selection}, function (response) {
        debug('response: ', response)

        const translation = TransOver.deserialize(response.translation)

        if (!translation) {
          debug('skipping empty translation')
          return
        }

        const xy = {clientX: Core.last_mouse_stop.x, clientY: Core.last_mouse_stop.y}
        last_translation = translation
        Core.showPopup(xy, TransOver.formatTranslation(translation))
      })
    }
  }


  // Hide tat popup on escape
  if (e.keyCode == 27) {
    Core.removePopup('transover-type-and-translate-popup')
  }
}).keyup(function (e) {
  if (TransOver.modifierKeys[e.keyCode] == Core.options.popup_show_trigger) {
    show_popup_key_pressed = false
  }
})

function hasMouseReallyMoved(e) { //or is it a tremor?
  const left_boundry = parseInt(Core.last_mouse_stop.x) - 5,
    right_boundry = parseInt(Core.last_mouse_stop.x) + 5,
    top_boundry = parseInt(Core.last_mouse_stop.y) - 5,
    bottom_boundry = parseInt(Core.last_mouse_stop.y) + 5

  return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry || e.clientY < top_boundry
}


$(document).mousemove(

  /**
   * check if it's just a small tremor. If it's not a tremor, fire a 'mousemove_without_noise' with attributes 'clientX' 'clientY'
   */
  function (e) {
    if (hasMouseReallyMoved(e)) {
      const mousemove_without_noise = new $.Event('mousemove_without_noise')
      mousemove_without_noise.clientX = e.clientX
      mousemove_without_noise.clientY = e.clientY

      $(document).trigger(mousemove_without_noise)
    }
  })




$(document).scroll(function () {
  Core.removePopup('transover-popup')
})

chrome.runtime.onMessage.addListener(

  function (request) {
    if (window != window.top) return

    console.log('place3')
    if (request == 'open_type_and_translate') {
      if ($('transover-type-and-translate-popup').length == 0) {
        const $popup = Core.createPopup('transover-type-and-translate-popup', Core.templates[Core.templateIds['transover-type-and-translate-popup']])
        $popup.attr('data-disable_on_this_page', disable_on_this_page)
        $('body').append($popup)
        $popup.each(function () {
          $(this.shadowRoot.querySelector('main')).hide().fadeIn('fast')
        })
      } else {
        Core.removePopup('transover-type-and-translate-popup')
      }
    } else if (request == 'copy-translation-to-clipboard') {
      debug('received copy-translation-to-clipboard')
      if ($('transover-popup').length > 0) {
        let toClipboard
        if (Array.isArray(last_translation)) {
          toClipboard = last_translation.map(t => {
            let line = ''
            if (t.pos) {
              line = t.pos + ': '
            }
            line = line + t.meanings.slice(0, 5).join(', ')
            return line
          }).join('; ')
        } else {
          toClipboard = last_translation
        }
        Core.copyToClipboard(toClipboard)
      }
    }
  }
)

$(function () {
  Core.registerTransoverComponent('popup', getURL)
  Core.registerTransoverComponent('tat_popup', getURL)
})

window.addEventListener('message', function (e) {
  console.log('place2')
  console.log(e.source)
  console.log(e.data.type)
  // We only accept messages from ourselves
  if (e.source != window)
    return

  if (e.data.type == 'transoverTranslate') {
    chrome.runtime.sendMessage({handler: 'translate', word: e.data.text}, function (response) {
      debug('tat response: ', response)
      console.log('lmao')
      console.log(response)
      const translation = TransOver.deserialize(response.translation)
      console.log('shit')
      if (!translation) {
        debug('tat skipping empty translation')
        return
      }

      const e = {clientX: $(window).width(), clientY: 0}
      last_translation = translation
      Core.showPopup(e, TransOver.formatTranslation(translation))
    })
  } else if (e.data.type === 'toggle_disable_on_this_page') {
    disable_on_this_page = e.data.disable_on_this_page
    chrome.extension.sendRequest({
      handler: 'toggle_disable_on_this_page',
      disable_on_this_page,
      current_url: window.location.origin
    })
    chrome.extension.sendRequest({handler: 'setIcon', disabled: disable_on_this_page})
    Core.removePopup('transover-type-and-translate-popup')
  } else if (e.data.type === 'tat_close') {
    Core.removePopup('transover-type-and-translate-popup')
  }
})
