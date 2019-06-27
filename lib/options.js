// this file defines helper functions that read/write user options in user's local storage

export default {
  except_urls: function(urls) {
    if (urls instanceof Array) {
      localStorage.except_urls = JSON.stringify(urls)
    }
    if (localStorage.except_urls) {
      try {
        return JSON.parse(localStorage.except_urls)
      } catch (e) {
        return []
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
        return []
      }
    }
    return []
  },

  word_key_only: function(arg) {
    if (arg !== undefined) {
      localStorage['word_key_only'] = arg
    }
    return parseInt( localStorage['word_key_only'] )
  },

  selection_key_only: function(arg) {
    if (arg !== undefined) {
      localStorage['selection_key_only'] = arg
    }
    return parseInt( localStorage['selection_key_only'] )
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
    if (arg !== undefined) {
      localStorage['popup_show_trigger'] = arg
    }
    return localStorage['popup_show_trigger'] || 'alt'
  },
}
