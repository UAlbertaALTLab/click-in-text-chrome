export default {
  except_urls: function(urls) {
    if (urls instanceof Array) {
      localStorage.except_urls = JSON.stringify(urls)
    }
    if (localStorage.except_urls) {
      try {
        return JSON.parse(localStorage.except_urls)
      } catch (e) {
        // from TransOver developer: backwards compatibitlity
        // from Matt: if except_urls is "['www.google.com', 'www.hi.com']"
        // then the returned values will have square brackets in them. Doesn't make sense to me
        return localStorage.except_urls.split(',')
      }
    }
    return []
  },
  only_urls: function(urls) {
    if (urls instanceof Array) {
      localStorage.only_urls = JSON.stringify(urls)
    }
    if (localStorage.only_urls) {
      try {
        return JSON.parse(localStorage.only_urls)
      } catch (e) {
        // backwards compatibitlity
        // from Matt: square brackets?
        return localStorage.only_urls.split(',')
      }
    }
    return []
  },
  // todo: remove target_lang as the only target language is English
  target_lang: function(lang) {
    if (lang) {
      localStorage['target_lang'] = lang
    }
    return localStorage['target_lang']
  },
  // todo: remove from_lang as the only source language is Cree
  from_lang: function(lang) {
    if (lang) {
      localStorage['from_lang'] = lang
    }
    return localStorage['from_lang'] || 'auto'
  },
  // todo: remove reverse translation, it was intended to translate source language back to target language. No longer needed
  reverse_lang: function(lang) {
    if (arguments.length > 0) {
      localStorage['reverse_lang'] = lang
    }
    return localStorage['reverse_lang']
  },
  // todo: figure out what this does
  word_key_only: function(arg) {
    if (arg != undefined) {
      localStorage['word_key_only'] = arg
    }
    return parseInt( localStorage['word_key_only'] )
  },
  // todo: figure out what this does
  selection_key_only: function(arg) {
    if (arg != undefined) {
      localStorage['selection_key_only'] = arg
    }
    return parseInt( localStorage['selection_key_only'] )
  },
  // todo: figure out what this does
  tts: function(arg) {
    if (arg != undefined) {
      localStorage['tts'] = arg
    }
    return parseInt( localStorage['tts'] )
  },
  // todo: figure out what this does
  tts_key: function(arg) {
    if (arg != undefined) {
      localStorage['tts_key'] = arg
    }
    return localStorage['tts_key'] || 'ctrl'
  },
  translate_by: function(arg) {
    if (arg === 'click' || arg === 'point') {
      localStorage.translate_by = arg
    }
    return localStorage.translate_by || 'click'
  },
  delay: function(ms) {
    if (ms !== undefined && !isNaN(parseFloat(ms)) && isFinite(ms)) {
      localStorage['delay'] = ms
    }
    return localStorage['delay'] === undefined ? 700 : parseInt(localStorage['delay'])
  },
  do_not_show_oops: function(arg) {
    if (arg !== undefined) {
      localStorage['do_not_show_oops'] = arg
    }
    return parseInt( localStorage['do_not_show_oops'] )
  },
  popup_show_trigger: function(arg) {
    if (arg != undefined) {
      localStorage['popup_show_trigger'] = arg
    }
    return localStorage['popup_show_trigger'] || 'alt'
  },
  // todo: remove show_from_lang, as the only source language will be cree
  show_from_lang: function(arg) {
    if (arg !== undefined) {
      localStorage['show_from_lang'] = arg
    }
    return localStorage['show_from_lang'] === undefined
      ? true
      : !!parseInt(localStorage['show_from_lang'])
  }
}
