// this file defines helper functions that read/write user options in user's local storage
let Options = {}

Options.except_urls = function(urls) {
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
}
Options.only_urls = function(urls) {
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
}

Options.word_key_only = function(arg) {
  if (arg !== undefined) {
    localStorage['word_key_only'] = arg
  }
  return parseInt( localStorage['word_key_only'] )
}

Options.selection_key_only =function(arg) {
  if (arg !== undefined) {
    localStorage['selection_key_only'] = arg
  }
  return parseInt( localStorage['selection_key_only'] )
}


Options.translate_by = function(arg) {
  if (arg === 'click' || arg === 'point') {
    localStorage.translate_by = arg
  }
  return localStorage.translate_by || 'click'
}
Options.delay = function(ms) {
  if (ms !== undefined && !isNaN(parseFloat(ms)) && isFinite(ms)) {
    localStorage['delay'] = ms
  }
  return localStorage['delay'] === undefined ? 700 : parseInt(localStorage['delay'])
}

Options.do_not_show_oops = function(arg) {
  if (arg !== undefined) {
    localStorage['do_not_show_oops'] = arg
  }
  return parseInt( localStorage['do_not_show_oops'] )
}
Options.popup_show_trigger = function(arg) {
  if (arg !== undefined) {
    localStorage['popup_show_trigger'] = arg
  }
  return localStorage['popup_show_trigger'] || 'alt'
}



// This function is called when the user click on the "save" button on options page.
Options.save_options = function(){




  // get the urls of pages user don't want to use the extension on
  function get_except_urls() {
    let except_urls

    // empty input fields will be left out
    except_urls = $('.except_url_input').filter(function() {
      return this.value
    }).map(function() {
      return this.value
    }).get()

    return except_urls
  }

  // get the urls of pages user only want to use the extension on
  function get_only_urls() {
    let only_urls

    // empty input fields will be left out
    only_urls = $('.only_url_input').filter(function() {
      return this.value
    }).map(function() {
      return this.value
    }).get()

    return only_urls
  }

  // store options in local storage
  Options.translate_by($('#translate_by').val()) // clicking or pointing
  Options.except_urls(get_except_urls())
  Options.only_urls(get_only_urls())
  Options.word_key_only($('#word_key_only:checked').val() ? 1 : 0) // show translation only when a key is held
  Options.selection_key_only($('#selection_key_only:checked').val() ? 1 : 0) // show selection translation only when a key is held
  Options.delay($('#delay').val())
  Options.do_not_show_oops($('#do_not_show_oops:checked').val() ? 1 : 0)
  Options.popup_show_trigger($('#word_key_only_key').val()) // only show translation when I hold wot key

  $('#status').fadeIn().delay(3000).fadeOut()
}



export default Options