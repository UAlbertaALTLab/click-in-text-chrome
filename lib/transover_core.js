// helper functions
import Options from './options'
import TransOver from './transover_utils'
import XRegExp from 'xregexp/src'


const Core = {}



Core.options = {}

/**
 *
 * @param loadOptions should be a function that returns user options from the extension's local storage and applies user preferences to the tabs
 */
Core.loadAndApplyUserOptions =

  (loadAndApolyOptions)=>{

    Core.options = loadAndApolyOptions()


  }


Core.reloadAndApplyOptionsOnTabSwitch = (loadAndApplyOptions) =>{

  //"The visibilitychange event is fired when the content of a tab has become visible or has been hidden."
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      Core.loadAndApplyUserOptions(loadAndApplyOptions)
    }
  }, false)
}

// where translate api happens
Core.callAPI = (word, onresponse, sendResponse) => {

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


Core.parseAPIResponse = (data, word, sendResponse) => {
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

  // Core.last_translation = translation.translation


  console.log('response: ', translation)
  sendResponse(translation)
}


Core.ignoreThisPage = (options) => {
  const isBlacklisted = $.grep(options.except_urls, function(url) { return RegExp(url).test(window.location.href) }).length > 0
  const isWhitelisted = $.grep(options.only_urls, function(url) { return RegExp(url).test(window.location.href) }).length > 0 ||
    options.only_urls.length === 0
  return isBlacklisted || !isWhitelisted
}


/**
 * Attaches an invisible popup without content to current web-page.
 * @param nodeType either 'transover-type-and-translate-popup' or 'transover-popup'
 * @param popupHTML Note under chrome, this javascript will be running on user opened web-page. Our popup.html is located elsewhere and has to be fetched using chrome API getURL
 * @returns {*|jQuery.fn.init|jQuery|HTMLElement} The newly attached popup element for subsequent content loading and modifying
 */
Core.createPopup = (nodeType, popupHTML) => {

  document.documentElement.appendChild(popupHTML)
  return $('<'+nodeType+'>')
}

const templateIds = {
  'transover-popup': 'transover-popup-template',
  'transover-type-and-translate-popup': 'transover-tat-popup-template'
}
Core.templateIds = templateIds

Core.removePopup = (nodeType) => {
  $(nodeType).each(function() {
    const self = this
    $(this.shadowRoot.querySelector('main')).fadeOut('fast', function() { self.remove() })
  })
  $('#'+templateIds[nodeType]).remove()
}


Core.templates = {}

/**
 * This is run twice upon loading of any tabs. It attaches the scripts our popup html needs to the head of current html.
 *
 * It also saves popup html as objects for future use and modification.
 *
 * By how chrome plugin works, all the extension javascript and html files are in different context (different from user
 * opened web-pages). Chrome API getURL is needed to access them
 *
 * @param component
 * @param getURL the api to get html and javascript by filename
 */
Core.registerTransoverComponent = (component, getURL)=> {
  const html = component + '.html'
  const script = component + '.js'

  const xhr = new XMLHttpRequest()
  xhr.open('GET', getURL(html), true)
  xhr.responseType = 'document'
  xhr.onload = function(e) {
    const doc = e.target.response
    const template = doc.querySelector('template')
    Core.templates[template.id] = template
  }
  xhr.send()

  const s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = getURL(script)
  s.async = true
  document.head.appendChild(s)
}


Core.copyToClipboard = (text)=> {
  const input = document.createElement('input')
  input.style.position = 'fixed'
  input.style.opacity = 0
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}


/**
 * Chooses the proper position of the popup so that the popup can fit into the window
 * @param x word x coordinate
 * @param y word y coordinate
 * @param $popup
 * @return Object e.g. {x: 123, y: 123}
 */
Core.calculatePosition = (x, y, $popup) => {
  const pos = {}
  const margin = 5
  const anchor = 10
  const outerWidth = Number($popup.attr('outer-width'))
  const outerHeight = Number($popup.attr('outer-height'))

  // show popup to the right of the word if it fits into window this way
  if (x + anchor + outerWidth + margin < $(window).width()) {
    pos.x = x + anchor
  }
  // show popup to the left of the word if it fits into window this way
  else if (x - anchor - outerWidth - margin > 0) {
    pos.x = x - anchor - outerWidth
  }
  // show popup at the very left if it is not wider than window
  else if (outerWidth + margin*2 < $(window).width()) {
    pos.x = margin
  }
  // resize popup width to fit into window and position it the very left of the window
  else {
    const non_content_x = outerWidth - Number($popup.attr('content-width'))

    $popup.attr('content-width', $(window).width() - margin*2 - non_content_x )
    $popup.attr('content-height', Number($popup.attr('content-height')) + 4)
    pos.x = margin
  }

  // show popup above the word if it fits into window this way
  if (y - anchor - outerHeight - margin > 0) {
    pos.y = y - anchor - outerHeight
  }
  // show popup below the word if it fits into window this way
  else if (y + anchor + outerHeight + margin < $(window).height()) {
    pos.y = y + anchor
  }
  // show popup at the very top of the window
  else {
    pos.y = margin
  }

  return pos
}



Core.showPopup = (e, content) => {
  Core.removePopup('transover-type-and-translate-popup')

  const $popup = Core.createPopup('transover-popup', Core.templates[Core.templateIds['transover-popup']])
  $('body').append($popup)

  $popup.on('transover-popup_content_updated', function() {
    const pos = Core.calculatePosition(e.clientX, e.clientY, $popup)
    $popup
      .each(function() {
        $(this.shadowRoot.querySelector('main')).hide()
      })
      .attr({ top: pos.y, left: pos.x })
      .each(function() {
        $(this.shadowRoot.querySelector('main')).fadeIn('fast')
      })
  })
  $popup.attr('content', content)
}

// used to determine whether a mousemove is a tremor
Core.last_mouse_stop = {x: 0, y: 0}


let timer25
Core.timer25 = timer25




Core.startNoiselessMouseMovementsListening =
  () => {

    // setup mousestop event
    $(document).on('mousemove_without_noise', function (e) {

      Core.removePopup('transover-popup')

      clearTimeout(Core.timer25)

      if (Core.options) {
        let delay = Core.options.delay
        if (window.getSelection().toString()) {

          if (Core.options.selection_key_only) {
            delay = 200
          }
        } else {
          if (Core.options.word_key_only) {
            delay = 200
          }
        }

        Core.timer25 = setTimeout(function () {
          delay = Core.options.delay
          console.log('stopped', delay)
          const mousestop = new $.Event('mousestop')
          Core.last_mouse_stop.x = mousestop.clientX = e.clientX
          Core.last_mouse_stop.y = mousestop.clientY = e.clientY

          $(document).trigger(mousestop)
        }, delay)
      }

    })


  }

Core.show_popup_key_pressed = false
Core.last_translation = ''

Core.startKeyPressListening = (asyncGetTranslation, getTranslationCallback) =>{

  $(document).keydown(function (e) {
    // respect "translate only when xx key is held" option

    if (TransOver.modifierKeys[e.keyCode] === Core.options.popup_show_trigger) {
      Core.show_popup_key_pressed = true
      const selection = window.getSelection().toString()

      if (Core.options.selection_key_only && selection) {
        // debug('Got selection_key_only')

        asyncGetTranslation(selection, (response)=>{
          const translation = getTranslationCallback(response)
          if (!translation) {
            return
          }
          const xy = {clientX: Core.last_mouse_stop.x, clientY: Core.last_mouse_stop.y}
          Core.last_translation = translation
          let translation_html = TransOver.formatTranslation(translation)
          Core.showPopup(xy, translation_html)
        })


      }
    }


    // Hide tat popup on escape
    if (e.keyCode == 27) {
      Core.removePopup('transover-type-and-translate-popup')
    }
  }).keyup(function (e) {
    if (TransOver.modifierKeys[e.keyCode] == Core.options.popup_show_trigger) {
      Core.show_popup_key_pressed = false
    }
  })


}


Core.disable_on_this_page = false

Core.withOptionsSatisfied = (e, do_stuff)=> {
  //respect 'translate only when alt pressed' option
  console.log('key pressed?', Core.show_popup_key_pressed)
  // console.log('word_key_only?', Core.options.word_key_only)
  if (Core.options.word_key_only && !Core.show_popup_key_pressed) return

  //respect "don't translate these sites"
  if (Core.disable_on_this_page) return

  do_stuff()

}


/**
 * This function extracts the word under cursor and shows the popup with translation.
 * @param e
 * @param asyncGetTranslation async function that has 2 arguments. 1: the word to be translated 2: a callback function. This async function should have a response that contains translation
 * @param getTranslationCallback The callback function of getTranslation. It should receive the response and either return a string, which will be displayed directly in a popup. (e.g. "oops...translation not found"). Or it can return an array of different objects as dictionary entries for this word.
 * Each entry looks like {meanings: ['meaning from source 1', 'meaning from source 2'], pos: 'string fst analysis such as nahapiw+V+AI+Cnj+Prs+X'}
 */
Core.extractWordAndShowPopup = function (e, asyncGetTranslation, getTranslationCallback) {

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
      // debug('no text')
      return ''
    }

    const hit_text_node = getExactTextNode(text_nodes, e)
    if (!hit_text_node) {
      // debug('hit between lines')
      return ''
    }

    const hit_word = restorable(hit_text_node, function () {
      let hw = ''

      function getHitText(node, parent_font_style) {
        console.log('getHitText: \'' + node.textContent + '\'')

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
          // debug('missed!')
        } else {
          hw = $(hit_word_elem).text()
          // debug('got it: \'' + hw + '\'')
        }
      }

      return hw
    })

    return hit_word
  }

  const selection = window.getSelection()
  console.log(selection.toString())

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
    } else if (Core.options.translate_by === 'point') {
      word = getHitWord(e)
    }
  } else {
    word = getHitWord(e)
  }
  if (word != '') {
    asyncGetTranslation(word, (response)=>{
      // console.log('lllmao', response)
      const translation = getTranslationCallback(response)
      // console.log('123', translation)
      if (!translation) {
        // debug('skipping empty translation')
        return
      }
      Core.last_translation = translation
      console.log('last translation loaded')
      let translation_html = TransOver.formatTranslation(translation)
      Core.showPopup(e, translation_html)


    })

  }
}

Core.startMouseStopHandling = (asyncGetTranslation, getTranslationCallback) => {
  $(document).on('mousestop', function (e) {

    console.log('onMousestop triggered')
    // console.log('string:', window.getSelection().toString())
    Core.withOptionsSatisfied(e, function () {
      // console.log('sTriNG:', window.getSelection().toString())
      // translate selection unless 'translate selection on alt only' is set
      if (window.getSelection().toString()) {
        if (!Core.options.selection_key_only || Core.show_popup_key_pressed) {

          Core.extractWordAndShowPopup(e, asyncGetTranslation, getTranslationCallback)
        }

      } else {
        if (Core.options.translate_by === 'point') {
          Core.extractWordAndShowPopup(e, asyncGetTranslation, getTranslationCallback)
        }
      }
    })
  })
}


Core.startClickHandling = (asyncGetTranslation, getTranslationCallback) =>{

  $(document).click(function (e) {
    Core.withOptionsSatisfied(e, function () {
      if (Core.options.translate_by !== 'click')
        return

      // don't translate when
      // console.log('closest', $(e.target).closest('button'))
      if ($(e.target).closest('a').length > 0)
        return
      if ($(e.target).closest('button').length > 0)
        return

      Core.extractWordAndShowPopup(e, asyncGetTranslation, getTranslationCallback)
    })
    return true
  })
}

/**
 * returns False if new mouse position is too close to the last mouse stop.
 *
 * @param e
 * @returns {boolean}
 */
function hasMouseReallyMoved(e){ //or is it a tremor?
  // console.log(e.clientX, e.clientY)
  const left_boundry = parseInt(Core.last_mouse_stop.x) - 5,
    right_boundry = parseInt(Core.last_mouse_stop.x) + 5,
    top_boundry = parseInt(Core.last_mouse_stop.y) - 5,
    bottom_boundry = parseInt(Core.last_mouse_stop.y) + 5

  return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry || e.clientY < top_boundry
}


Core.startMouseMoveHandling = () =>{
  $(document).mousemove(


    /**
     * check if it's just a small tremor. If it's not a tremor, fire a 'mousemove_without_noise' with attributes 'clientX' 'clientY'
     */
    function (e) {
      // console.log('the mouse is moving')

      if (hasMouseReallyMoved(e)) {
        // console.log('the mouse is seriously moving')
        const mousemove_without_noise = new $.Event('mousemove_without_noise')
        // console.log(e.clientX, e.clientY)
        mousemove_without_noise.clientX = e.clientX
        mousemove_without_noise.clientY = e.clientY

        $(document).trigger(mousemove_without_noise)
      }
    })


}


Core.removePopupUponScrolling = () =>{

  $(document).scroll(function () {
    Core.removePopup('transover-popup')
  })


}
Core.attachTATandCopyPasteHandler = (addListener) =>{
  addListener(  function (request) {
    console.log('called')
    // detects whether window is in an iframe
    if (window != window.top) return


    console.log('request?', request)
    if (request === 'open_type_and_translate') {
      console.log('open tat?')
      if ($('transover-type-and-translate-popup').length === 0) {
        const $popup = Core.createPopup('transover-type-and-translate-popup', Core.templates[Core.templateIds['transover-type-and-translate-popup']])
        $popup.attr('data-disable_on_this_page', Core.disable_on_this_page)
        console.log('appending')
        $('body').append($popup)
        console.log('blah')
        $popup.each(function () {
          $(this.shadowRoot.querySelector('main')).hide().fadeIn('fast')
        })
      } else {
        Core.removePopup('transover-type-and-translate-popup')
      }
    } else if (request == 'copy-translation-to-clipboard') {
      // debug('received copy-translation-to-clipboard')

      console.log('going to clipboard')
      if (Core.last_translation) {
        let toClipboard
        if (Array.isArray(Core.last_translation)) {
          toClipboard = Core.last_translation.map(t => {
            let line = ''
            if (t.pos) {
              line = t.pos + ': '
            }
            line = line + t.meanings.slice(0, 5).join(', ')
            return line
          }).join('; ')
        } else {
          toClipboard = Core.last_translation
        }
        console.log(toClipboard)
        Core.copyToClipboard(toClipboard)
      }
    }
  })
}

Core.registerComponents = (getURL)=>{
  $(function () {
    Core.registerTransoverComponent('popup', getURL)
    Core.registerTransoverComponent('tat_popup', getURL)
  })
}
/**
 * type-and-translate
 * @param asyncGetTranslation
 * @param getTranslationCallback
 * @param disableExtension
 * @param grayOutIcon
 */
Core.addMessageHandlersToWindow = (asyncGetTranslation, getTranslationCallback, disableExtension, grayOutIcon) =>{
  window.addEventListener('message', function (e) {
    console.log('hello')
    // We only accept messages from ourselves
    if (e.source !== window)
      return

    if (e.data.type === 'transoverTranslate') {
      asyncGetTranslation(e.data.text, (response)=>{
        const translation = getTranslationCallback(response)
        if (!translation) {
          return
        }
        const e = {clientX: $(window).width(), clientY: 0}

        Core.last_translation = translation
        let translation_html = TransOver.formatTranslation(translation)
        Core.showPopup(e, translation_html)

      })



    } else if (e.data.type === 'toggle_disable_on_this_page') {
      Core.disable_on_this_page = e.data.disable_on_this_page

      disableExtension()
      grayOutIcon()

      Core.removePopup('transover-type-and-translate-popup')
    } else if (e.data.type === 'tat_close') {
      Core.removePopup('transover-type-and-translate-popup')
    }
  })
}

Core.start = function (getURL, loadAndApplyOptions, asyncGetTranslation, getTranslationCallback, addTATAndCopyPasteListener, disable, grayOutIcon ) {
  Core.registerComponents(getURL)
  Core.loadAndApplyUserOptions(loadAndApplyOptions)
  Core.reloadAndApplyOptionsOnTabSwitch(loadAndApplyOptions)
  Core.startNoiselessMouseMovementsListening()
  Core.startKeyPressListening(asyncGetTranslation, getTranslationCallback)
  Core.startMouseStopHandling(asyncGetTranslation, getTranslationCallback)
  Core.startClickHandling(asyncGetTranslation, getTranslationCallback)
  Core.startMouseMoveHandling()
  Core.removePopupUponScrolling()
  Core.attachTATandCopyPasteHandler(addTATAndCopyPasteListener)
  Core.addMessageHandlersToWindow(asyncGetTranslation, getTranslationCallback, disable, grayOutIcon)
}

export default Core
