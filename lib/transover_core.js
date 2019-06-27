// helper functions
import Options from './options'


const Core = {}



Core.options = {}

Core.loadAndApplyUserOptions =

  (loadOptions)=>{

    Core.options = loadOptions()

  }


Core.reloadAndApplyOptionsOnTabSwitch = (loadOptions) =>{

  //"The visibilitychange event is fired when the content of a tab has become visible or has been hidden."
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      Core.loadAndApplyUserOptions(loadOptions)
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

  $.extend( translation)


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
  s.src = chrome.extension.getURL(script)
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
    console.log('yees')
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
          const mousestop = new $.Event('mousestop')
          Core.last_mouse_stop.x = mousestop.clientX = e.clientX
          Core.last_mouse_stop.y = mousestop.clientY = e.clientY

          $(document).trigger(mousestop)
        }, delay)
      }

    })


  }





export default Core
