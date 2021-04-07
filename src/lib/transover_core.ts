import {TransOver} from './transover_utils'
import XRegExp from 'xregexp/src'
import {SerializedSearchResult} from '@altlab/types'
import {options} from "./options";
/// <reference path="html_loader.d.ts"/>
import popup from './popup.html'
import tatPopup from './tat_popup.html'
import Node = JQuery.Node;

// these scripts are appended to the <head> of html each time a tab is refreshed/opened
/// <reference path="raw_loader.d.ts"/>
import popupScript from 'raw-loader!ts-loader!./popup.raw'
import tatPopupScript from 'raw-loader!ts-loader!./tat_popup.raw'


const popupTemplate = buildTemplateFromString(popup)
const tatPopupTemplate = buildTemplateFromString(tatPopup)


const templateIds = {
  'transover-popup': popupTemplate.id,
  'transover-type-and-translate-popup': tatPopupTemplate.id
}


const templates: { [p: string]: HTMLTemplateElement } = {
  [popupTemplate.id]: popupTemplate,
  [tatPopupTemplate.id]: tatPopupTemplate
}


/**
 *
 * @param templateString A string that contains a single <template></template> element
 */
function buildTemplateFromString(templateString: string): HTMLTemplateElement {

  // TIL: comments outside of templates count as Jquery nodes too...
  // So, iterating is necessary even if the html only has one <template> string
  for (const node of $.parseHTML(templateString)) {
    if (node instanceof HTMLTemplateElement) {
      return node
    }
  }

  console.error("Can not parse template from string:")
  console.error(templateString)

}


/**
 * The function that handles parsedResponse
 */
type SendParsedResponse = (parsedResponse: ReturnType<ResponseParser>) => unknown;


export type FailedTranslation = '' | 'Oops.. No translation found.'
export type SuccessfulTranslation = { lemma: string, meanings: string[] }[]

// We parse `SerializedSearchResult` from API to this type here.
// suggestion: do we need this step? Can we just use `SerializedSearchResult`?
/**
 * The data our extension needs to present.
 */
interface ParsedResponse {
  /**
   * This is set to false when the response is not in the expected format or the response is in the expected format but
   * the result is empty.
   */
  succeeded: boolean

  /**
   * The word we grabbed from a page
   */
  word: string

  // might be a misnomer
  /**
   * The final thing we show on a popup
   */
  translation: FailedTranslation | SuccessfulTranslation
}

/**
 * The callback that handles response from itwewina (the API endpoint that provides dictionary functionality)
 * @param data: data received from jquery's ajax get request
 * @param word: the word that was used to lookup dictionary entries
 * @param sendParsedResponse: what to do next with the parsed response.
 */
type ResponseParser = (data: { "results": SerializedSearchResult[] }, word: string) => ParsedResponse;


const Core = {

  // where translate api happens
  callAPI(
      word: string,
      responseParser: ResponseParser,
      sendParsedResponse: SendParsedResponse,
      options?: {apiUrl: string}
  ): void {
    const apiUrl = options?.apiUrl ?? 'https://itwewina.altlab.app/click-in-text/?q=';

    if (!word) {
      return;
    }

    const ajaxRequestSettings = {
      url: apiUrl + encodeURIComponent(word),
      dataType: 'json',
      success: function on_success(data) {
        const parsedResponse = responseParser(data, word)
        sendParsedResponse(parsedResponse)
      },
      error: function (xhr, status, e) {
        console.error({e: e, xhr: xhr})
      }
    }
    $.ajax(ajaxRequestSettings)
  },

  parseAPIResponse(data: { "results": SerializedSearchResult[] }, word: string): ParsedResponse {
    // for click-in-text api response, see this schema file:
    // https://github.com/UAlbertaALTLab/cree-intelligent-dictionary/blob/master/CreeDictionary/API/schema.py
    // Each result is described by SerializedSearchResult


    let translation: FailedTranslation | SuccessfulTranslation
    let succeeded: boolean;

    if (!data.results || data.results.length === 0) {
      succeeded = false
      if (options.do_not_show_oops) {
        translation = ''
      } else {
        translation = 'Oops.. No translation found.'
      }
    } else {
      succeeded = true


      translation = data.results.map(function (result) {

        const definition_list: string[] = []
        result.lemma_wordform.definitions.forEach(function (definition) {
            definition_list.push(definition.text + '; ' + definition.source_ids.join(' '))
          }
        )
        return {lemma: result.lemma_wordform.text, meanings: definition_list}
      })

    }


    return {succeeded, translation, word}
  },

  /**
   * check if the current url (window.location.href) is ignored
   * @param options from local storage
   */
  ignoreThisPage(options: { except_urls: string[], only_urls: string[] }): boolean {
    const isBlacklisted = $.grep(options.except_urls, function (url) {
      return RegExp(url).test(window.location.href)
    }).length > 0
    const isWhitelisted = $.grep(options.only_urls, function (url) {
        return RegExp(url).test(window.location.href)
      }).length > 0 ||
      options.only_urls.length === 0
    return isBlacklisted || !isWhitelisted
  },

  timer25: undefined,
  disable_on_this_page: false,

  start: (addSaveOptionsHandler: AddSaveOptionsHandler, getTranslation: GetTranslation, addTATAndCopyPasteListener: (TATAndCopyPasteHandler) => void, disableExtension: (...args) => unknown, grayOutIcon: (...args) => unknown): void => {
    registerComponents()
    addSaveOptionsHandler(() => {
      options.saveOptions()
    })
    startNoiselessMouseMovementsListening()
    startKeyPressListening(getTranslation)
    startMouseStopHandling(getTranslation)
    startClickHandling(getTranslation)
    startMouseMoveHandling()
    removePopupUponScrolling()
    attachTATAndCopyPasteHandler(addTATAndCopyPasteListener)
    addMessageHandlersToWindow(getTranslation, disableExtension, grayOutIcon)
  }
}


/**
 * responsible to call `saveOptions` that saves options of current page
 */
type AddSaveOptionsHandler = { (saveOptions: () => void) }


/**
 * Attaches an invisible popup without content to current web-page.
 * @param nodeType either 'transover-type-and-translate-popup' or 'transover-popup'
 * @param popupHTML Note under chrome, this javascript will be running on user opened web-page. Our popup.html is located elsewhere and has to be fetched using chrome API getURL
 * @returns {*|jQuery.fn.init|jQuery|HTMLElement} The newly attached popup element for subsequent content loading and modifying
 */
function createPopup(nodeType, popupHTML) {

  document.documentElement.appendChild(popupHTML)
  return $('<' + nodeType + '>')
}


function removePopup(nodeType) {
  $(nodeType).each(function () {

    $(this.shadowRoot.querySelector('main'))
      .fadeOut('fast', () => this.remove()
      )
  })
  $('#' + templateIds[nodeType]).remove()
}


/**
 * Attaches javascript as <script> elements to the <head> of current html.
 */
function appendScriptToHead(js: string) {

  const s = document.createElement('script')
  s.type = 'text/javascript'
  s.innerHTML = js
  document.head.appendChild(s)
}


function copyToClipboard(text) {
  const input = document.createElement('input')
  input.style.position = 'fixed'
  input.style.opacity = '0'
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
 * @return
 */
function calculatePosition(x, y, $popup) {
  let calculatedX: number
  let calculatedY: number
  const margin = 5
  const anchor = 10
  const outerWidth = Number($popup.attr('outer-width'))
  const outerHeight = Number($popup.attr('outer-height'))

  // show popup to the right of the word if it fits into window this way
  if (x + anchor + outerWidth + margin < $(window).width()) {
    calculatedX = x + anchor
  }
  // show popup to the left of the word if it fits into window this way
  else if (x - anchor - outerWidth - margin > 0) {
    calculatedX = x - anchor - outerWidth
  }
  // show popup at the very left if it is not wider than window
  else if (outerWidth + margin * 2 < $(window).width()) {
    calculatedX = margin
  }
  // resize popup width to fit into window and position it the very left of the window
  else {
    const non_content_x = outerWidth - Number($popup.attr('content-width'))

    $popup.attr('content-width', $(window).width() - margin * 2 - non_content_x)
    $popup.attr('content-height', Number($popup.attr('content-height')) + 4)
    calculatedX = margin
  }

  // show popup above the word if it fits into window this way
  if (y - anchor - outerHeight - margin > 0) {
    calculatedY = y - anchor - outerHeight
  }
  // show popup below the word if it fits into window this way
  else if (y + anchor + outerHeight + margin < $(window).height()) {
    calculatedY = y + anchor
  }
  // show popup at the very top of the window
  else {
    calculatedY = margin
  }

  return {x: calculatedX, y: calculatedY}
}


function showPopup(e, content) {
  removePopup('transover-type-and-translate-popup')

  const $popup = createPopup('transover-popup', templates[templateIds['transover-popup']])
  $('body').append($popup)

  $popup.on('transover-popup_content_updated', function () {
    const pos = calculatePosition(e.clientX, e.clientY, $popup)
    $popup
      .each(function () {
        $(this.shadowRoot.querySelector('main')).hide()
      })
      .attr({top: pos.y, left: pos.x})
      .each(function () {
        $(this.shadowRoot.querySelector('main')).fadeIn('fast')
      })
  })
  $popup.attr('content', content)
}

// used to determine whether a mousemove is a tremor
const last_mouse_stop = {x: 0, y: 0}


function startNoiselessMouseMovementsListening() {

  // setup mousestop event
  $(document).on('mousemove_without_noise', function (e) {

    removePopup('transover-popup')

    clearTimeout(Core.timer25)


    let delay = options.delay
    if (window.getSelection().toString()) {

      if (options.selection_key_only) {
        delay = 200
      }
    } else {
      if (options.word_key_only) {
        delay = 200
      }
    }

    Core.timer25 = setTimeout(function () {
      delay = options.delay
      const mousestop = new $.Event('mousestop')
      last_mouse_stop.x = mousestop.clientX = e.clientX
      last_mouse_stop.y = mousestop.clientY = e.clientY

      $(document).trigger(mousestop)
    }, delay)


  })
}

let show_popup_key_pressed = false
let last_translation: FailedTranslation | SuccessfulTranslation = ''

/**
 * A non-blocking function that (calls API) and gets translation
 */
type GetTranslation = { (selection: string, callback: { (parsedResponse: ParsedResponse): void }): void }

/**
 *
 * @param getTranslation
 */
function startKeyPressListening(getTranslation: GetTranslation) {

  $(document).on('keydown', function (e) {
    // respect "translate only when xx key is held" option

    if (TransOver.modifierKeys[e.keyCode] === options.popup_show_trigger) {
      show_popup_key_pressed = true
      const selection = window.getSelection().toString()

      if (options.selection_key_only && selection) {
        // debug('Got selection_key_only')

        getTranslation(selection, (response) => {
          const translation = response.translation
          if (!translation) {
            return
          }
          const xy = {clientX: last_mouse_stop.x, clientY: last_mouse_stop.y}
          last_translation = translation
          const translation_html = TransOver.formatTranslation(translation)
          showPopup(xy, translation_html)
        })

      }
    }


    // Hide tat popup on escape
    if (e.keyCode === 27) {
      removePopup('transover-type-and-translate-popup')
    }
  }).on('keyup', function (e) {
    if (TransOver.modifierKeys[e.keyCode] === options.popup_show_trigger) {
      show_popup_key_pressed = false
    }
  })


}

function withOptionsSatisfied(e, do_stuff) {
  //respect 'translate only when alt pressed' option
  // console.log('word_key_only?', options.word_key_only)
  if (options.word_key_only && !show_popup_key_pressed) return

  //respect "don't translate these sites"
  if (Core.disable_on_this_page) return

  do_stuff()

}


function isInputElementOrTextArea(e: Element): e is HTMLTextAreaElement | HTMLInputElement {
  return /INPUT|TEXTAREA/.test(e.nodeName)
}

function isHTMLElement(e: Element): e is HTMLElement {
  return e instanceof HTMLElement
}


/**
 * This function extracts the word under cursor and shows the popup with translation.
 * @param e
 * @param asyncGetTranslation
 */
function extractWordAndShowPopup(e, asyncGetTranslation: GetTranslation) {

  function getHitWord(e) {

    function restorable(node, do_stuff) {
      $(node).wrap('<transwrapper />')
      const res = do_stuff(node)
      const $transwrapper = $('transwrapper')
      $transwrapper.replaceWith(TransOver.escape_html($transwrapper.text()))
      return res
    }

    function getExactTextNode(nodes, e) {
      $(text_nodes).wrap('<transblock />')
      let hit_text_node = document.elementFromPoint(e.clientX, e.clientY)

      //means we hit between the lines
      if (hit_text_node.nodeName !== 'TRANSBLOCK') {
        $(text_nodes).unwrap()
        return null
      }

      hit_text_node = hit_text_node.childNodes[0] as Element
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
      return this.nodeType === Node.TEXT_NODE && XRegExp(word_re).test(this.nodeValue)
    })

    if (text_nodes.length === 0) {
      // debug('no text')
      return ''
    }

    const hit_text_node = getExactTextNode(text_nodes, e)
    if (!hit_text_node) {
      // debug('hit between lines')
      return ''
    }

    return restorable(hit_text_node, function () {
      let hw = ''

      function getHitText(node, parent_font_style) {
        // console.log('getHitText: \'' + node.textContent + '\'')

        if (XRegExp(word_re).test(node.textContent)) {
          $(node).replaceWith(function () {
            return this.textContent.replace(XRegExp('^(.{' + Math.round(node.textContent.length / 2) + '}(?:\\p{L}|[\'’](?=\\p{L}))*)(.*)', 's'), function ($0, $1, $2) {
              return '<transblock>' + TransOver.escape_html($1) + '</transblock><transblock>' + TransOver.escape_html($2) + '</transblock>'
            })
          })

          $('transblock').css(parent_font_style)

          const next_node = document.elementFromPoint(e.clientX, e.clientY).childNodes[0]

          if (next_node.textContent === node.textContent) {
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
        if (hit_word_elem.nodeName !== 'TRANSOVER') {
          // debug('missed!')
        } else {
          hw = $(hit_word_elem).text()
          // debug('got it: \'' + hw + '\'')
        }
      }

      return hw
    })
  }

  const selection = window.getSelection()

  const hit_elem = document.elementFromPoint(e.clientX, e.clientY)

  // happens sometimes on page resize (I think)
  if (!hit_elem) {
    return
  }

  //skip inputs and editable divs
  if (isInputElementOrTextArea(hit_elem) || (isHTMLElement(hit_elem) && hit_elem.isContentEditable)
    || $(hit_elem).parents().filter(function () {
      return this.isContentEditable
    }).length > 0) {
    return
  }

  let word = ''
  if (selection.toString()) {


    let sel_container = selection.getRangeAt(0).commonAncestorContainer

    while (sel_container.nodeType !== Node.ELEMENT_NODE) {
      sel_container = sel_container.parentNode
    }


    if (
      // only choose selection if mouse stopped within immediate parent of selection
      ($(hit_elem).is(<Element>sel_container) || $.contains(<Element>sel_container, hit_elem))
      // and since it can still be quite a large area
      // narrow it down by only choosing selection if mouse points at the element that is (partially) inside selection
      && selection.containsNode(hit_elem, true)
      // But what is the point for the first part of condition? Well, without it, pointing at body for instance would also satisfy the second part
      // resulting in selection translation showing up in random places
    ) {
      word = selection.toString()
    } else if (options.translate_by === 'point') {
      word = getHitWord(e)
    }
  } else {
    word = getHitWord(e)
  }
  if (word !== '') {
    asyncGetTranslation(word, (response) => {

      const translation = response.translation

      if (!translation) {
        // debug('skipping empty translation')
        return
      }
      last_translation = translation
      const translation_html = TransOver.formatTranslation(translation)
      showPopup(e, translation_html)


    })

  }
}

function startMouseStopHandling(asyncGetTranslation) {
  $(document).on('mousestop', function (e) {

    // console.log('string:', window.getSelection().toString())
    withOptionsSatisfied(e, function () {
      // console.log('sTriNG:', window.getSelection().toString())
      // translate selection unless 'translate selection on alt only' is set
      if (window.getSelection().toString()) {
        if (!options.selection_key_only || show_popup_key_pressed) {

          extractWordAndShowPopup(e, asyncGetTranslation)
        }

      } else {
        if (options.translate_by === 'point') {
          extractWordAndShowPopup(e, asyncGetTranslation)
        }
      }
    })
  })
}


function startClickHandling(asyncGetTranslation: GetTranslation) {

  $(document).on('click', function (e) {

    withOptionsSatisfied(e, function () {
      if (options.translate_by !== 'click')
        return

      // don't translate when
      // console.log('closest', $(e.target).closest('button'))
      if ($(e.target).closest('a').length > 0)
        return
      if ($(e.target).closest('button').length > 0)
        return
      extractWordAndShowPopup(e, asyncGetTranslation)
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
function hasMouseReallyMoved(e) { //or is it a tremor?
  // console.log(e.clientX, e.clientY)
  const left_boundry = Math.round(last_mouse_stop.x) - 5,
    right_boundry = Math.round(last_mouse_stop.x) + 5,
    top_boundry = Math.round(last_mouse_stop.y) - 5,
    bottom_boundry = Math.round(last_mouse_stop.y) + 5

  return e.clientX > right_boundry || e.clientX < left_boundry || e.clientY > bottom_boundry || e.clientY < top_boundry
}


function startMouseMoveHandling() {
  $(document).on('mousemove',
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


function removePopupUponScrolling() {

  $(document).on('scroll', function () {
    removePopup('transover-popup')
  })


}


type TATAndCopyPasteHandler = { (request: 'open_type_and_translate' | 'copy-translation-to-clipboard'): void }


/**
 *
 * @param addListener We will supply a callback to the function. The callback opens TAT popup and handle copy-pasting.
 * `addListener` is responsible to call this callback when TAT or CopyPaste request is received.
 */
function attachTATAndCopyPasteHandler(addListener: (handler: TATAndCopyPasteHandler) => void) {
  addListener(function (request) {
    // detects whether window is in an iframe
    if (window !== window.top) return
    if (request === 'open_type_and_translate') {
      if ($('transover-type-and-translate-popup').length === 0) {
        const $popup = createPopup('transover-type-and-translate-popup', templates[templateIds['transover-type-and-translate-popup']])
        $popup.attr('data-disable_on_this_page', Core.disable_on_this_page.toString())
        $('body').append($popup)
        $popup.each(function () {
          $(this.shadowRoot.querySelector('main')).hide().fadeIn('fast')
        })
      } else {
        removePopup('transover-type-and-translate-popup')
      }
    } else if (request === 'copy-translation-to-clipboard') {
      // debug('received copy-translation-to-clipboard')

      if (last_translation) {
        let toClipboard
        if (Array.isArray(last_translation)) {
          toClipboard = last_translation.map(t => {
            let line = ''
            if (t.lemma) {
              line = t.lemma + ': '
            }
            line = line + t.meanings.slice(0, 5).join(', ')
            return line
          }).join('; ')
        } else {
          toClipboard = last_translation
        }
        copyToClipboard(toClipboard)
      }
    }
  })
}

/**
 * In extensions, this function is supposed to be run upon loading/refreshing of any new tab/page.
 *
 * It attaches popup.raw.ts, tat_popup.raw.ts ("type-and-translate popup") as <script> elements to the <head>.
 *
 *    The scripts create handlers that
 *    handles API calling, popup creation, destruction.
 *    Noticeably, popup creation is done by instantiating html templates saved in global `templates` object
 *
 * By how chrome plugin works, all the extension javascript (and html if any) files are stored in a different context
 * (different from user opened web-pages/tabs). Chrome API getURL is needed to access them
 */
function registerComponents() {
  $(function () {
    appendScriptToHead(popupScript)
    appendScriptToHead(tatPopupScript)
  })
}

/**
 * type-and-translate
 * @param asyncGetTranslation
 * @param disableExtension
 * @param grayOutIcon
 */
function addMessageHandlersToWindow(asyncGetTranslation: GetTranslation, disableExtension, grayOutIcon) {
  window.addEventListener('message', function (e) {
    // We only accept messages from ourselves
    if (e.source !== window)
      return

    if (e.data.type === 'transoverTranslate') {
      asyncGetTranslation(e.data.text, (response) => {
        const translation = response.translation
        if (!translation) {
          return
        }
        const e = {clientX: $(window).width(), clientY: 0}

        last_translation = translation
        const translation_html = TransOver.formatTranslation(translation)
        showPopup(e, translation_html)

      })


    } else if (e.data.type === 'toggle_disable_on_this_page') {
      Core.disable_on_this_page = e.data.disable_on_this_page

      disableExtension()
      grayOutIcon()

      removePopup('transover-type-and-translate-popup')
    } else if (e.data.type === 'tat_close') {
      removePopup('transover-type-and-translate-popup')
    }
  })
}

export default Core
