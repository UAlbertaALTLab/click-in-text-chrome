// functions used by the options page
// including functions that populate user settings from local storage

import {options} from '../lib/options'
import {TransOver} from '../lib/transover_utils'

// populates except_url input fields with existing except_urls
function populate_except_urls() {
  function add_exc_url(url?: URL) {
    let button
    let input
    if (url) {
      input = $('<input type="text" class="except_url_input">').prop('size', 100).val(url.toString())
    }
    const rm_callback = function () {
      $(this).closest('tr').fadeOut('fast', function () {
        $(this).remove()
      })
    }

    if (url) {
      button = $('<button>', {text: 'X'}).on('click', rm_callback)
    } else {
      button = $('<button>', {text: '+'}).on('click', function () {
        if ($('.except_url_input', $(this).closest('tr')).val() > '') {
          $(this).text('X').off('click').on('click', rm_callback)
          add_exc_url()
        }
      })
    }

    if (url) {
      $('<tr>', {css: {display: 'none'}}).fadeIn()
        .append($('<td>').append(input))
        .append($('<td>').append(button))
        .appendTo($('#exc_urls_table'))
    }


  }

  const saved_except_urls = options.except_urls

  saved_except_urls.forEach(function (url) {
    add_exc_url(url)
  })
  add_exc_url()
}

// populates only_url input fields with existing only_urls
function populate_only_urls() {
  function add_only_url(url?: URL) {
    let button
    let input
    if (url) input = $('<input type="text" class="only_url_input">').prop('size', 100).val(url.toString())
    const rm_callback = function () {
      $(this).closest('tr').fadeOut('fast', function () {
        $(this).remove()
      })
    }

    if (url) {
      button = $('<button>', {text: 'X'}).click(rm_callback)
    } else {
      button = $('<button>', {text: '+'}).click(function () {
        if ($('.only_url_input', $(this).closest('tr')).val() > '') {
          $(this).text('X').off('click').click(rm_callback)
          add_only_url()
        }
      })
    }
    if (url) {
      $('<tr>', {css: {display: 'none'}}).fadeIn()
        .append($('<td>').append(input))
        .append($('<td>').append(button))
        .appendTo($('#only_urls_table'))
    }

  }

  const saved_only_urls = options.only_urls

  saved_only_urls.forEach(function (url) {
    add_only_url(url)
  })
  add_only_url()
}


function populate_popup_show_trigger() {
  const saved_popup_show_trigger = options.popup_show_trigger

  ;Array.from((new Set(Object.values(TransOver.modifierKeys))).values()).forEach(function (key) {
    $('#word_key_only_key, #selection_key_only_key').each(function () {
      $(this).append($('<option>', {value: key}).text(key).prop('selected', saved_popup_show_trigger === key))
    })
  })

  $('#word_key_only_key, #selection_key_only_key').on('change', function () {
    console.log("on change")
    $('#word_key_only_key, #selection_key_only_key').val((<HTMLInputElement>this).value)
  })
}

$(function () {
  populate_except_urls()
  populate_only_urls()
  populate_popup_show_trigger()
  if (options.translate_by === 'point') {
    $('#delay').prop('disabled', false).parent().removeClass('disabled')
  }

  if (options.word_key_only) {
    $('#delay').prop('disabled', true).parent().addClass('disabled')
  }

  $('#translate_by').val(options.translate_by).on('change', function () {
    if ($(this).val() === 'point' && !$('#word_key_only').prop('checked')) {
      $('#delay').prop('disabled', false).parent().removeClass('disabled')
    } else {
      $('#delay').prop('disabled', true).parent().addClass('disabled')
    }
  })

  $('#word_key_only').prop('checked', options.word_key_only).on('click', function () {
    if ($('#translate_by').val() === 'point' && !$(this).prop('checked')) {
      $('#delay').prop('disabled', false).parent().removeClass('disabled')
    } else {
      $('#delay').prop('disabled', true).parent().addClass('disabled')
    }
  })
  $('#selection_key_only').prop('checked', options.selection_key_only)

  $('#delay').val(options.delay)

  $('#do_not_show_oops').prop('checked', options.do_not_show_oops)

  $('#save_button').on('click', function () {
    options.saveOptions()
  })
  $(document).on('keydown', function (e) {
    if (e.keyCode === 13) {
      options.saveOptions()
    }
  })

  $('#more_options_link').on('click', function () {
    $('#more_options_link').hide()
    $('#more_options').fadeIn()
    return false
  })

  $('.set_hotkey').on('click', function () {
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'})
    return false
  })
})
