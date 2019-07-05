// functions used by the options page
// including functions that populate user settings from local storage

import Options from './options'
import TransOver from './transover_utils'

// populates except_url input fields with existing except_urls
function populate_except_urls() {
  function add_exc_url(url) {
    let button
    const input = $('<input type="text" class="except_url_input">').attr('size', 100).val(url)
    const rm_callback = function() { $(this).closest('tr').fadeOut('fast', function() {$(this).remove()}) }

    if (url) {
      button = $('<button>', {text: 'X'}).click(rm_callback)
    }
    else {
      button = $('<button>', {text: '+'}).click(function() {
        if ($('.except_url_input', $(this).closest('tr') ).val() > '') {
          $(this).text('X').off('click').click(rm_callback)
          add_exc_url()
        }
      })
    }
    $('<tr>', {css: {display: 'none'}}).fadeIn()
      .append($('<td>').append(input))
      .append($('<td>').append(button))
      .appendTo($('#exc_urls_table'))
  }

  const saved_except_urls = Options.except_urls()

  saved_except_urls.forEach(function(url) {
    add_exc_url(url)
  })
  add_exc_url()
}

// populates only_url input fields with existing only_urls
function populate_only_urls() {
  function add_only_url(url) {
    let button
    const input = $('<input type="text" class="only_url_input">').attr('size', 100).val(url)
    const rm_callback = function() { $(this).closest('tr').fadeOut('fast', function() {$(this).remove()}) }

    if (url) {
      button = $('<button>', {text: 'X'}).click(rm_callback)
    }
    else {
      button = $('<button>', {text: '+'}).click(function() {
        if ($('.only_url_input', $(this).closest('tr') ).val() > '') {
          $(this).text('X').off('click').click(rm_callback)
          add_only_url()
        }
      })
    }
    $('<tr>', {css: {display: 'none'}}).fadeIn()
      .append($('<td>').append(input))
      .append($('<td>').append(button))
      .appendTo($('#only_urls_table'))
  }

  const saved_only_urls = Options.only_urls()

  saved_only_urls.forEach(function(url) {
    add_only_url(url)
  })
  add_only_url()
}



function populate_popup_show_trigger() {
  const saved_popup_show_trigger = Options.popup_show_trigger()

  ;[...new Set(Object.values(TransOver.modifierKeys))].forEach(function(key) {
    $('#word_key_only_key, #selection_key_only_key').each(function() {
      $(this).append($('<option>', {value: key}).text(key).prop('selected', saved_popup_show_trigger === key))
    })
  })

  $('#word_key_only_key, #selection_key_only_key').change(function() {
    $('#word_key_only_key, #selection_key_only_key').val(this.value)
  })
}

$(function() {
  populate_except_urls()
  populate_only_urls()
  populate_popup_show_trigger()

  if (Options.translate_by() === 'point') {
    $('#delay').attr('disabled', false).parent().removeClass('disabled')
  }

  if (Options.word_key_only()) {
    $('#delay').attr('disabled', true).parent().addClass('disabled')
  }

  $('#translate_by').val(Options.translate_by()).change(function() {
    if ($(this).val() === 'point' && !$('#word_key_only').attr('checked')) {
      $('#delay').attr('disabled', false).parent().removeClass('disabled')
    }
    else {
      $('#delay').attr('disabled', true).parent().addClass('disabled')
    }
  })

  $('#word_key_only').attr('checked', !!Options.word_key_only()).click(function() {
    if ($('#translate_by').val() === 'point' && !$(this).attr('checked')) {
      $('#delay').attr('disabled', false).parent().removeClass('disabled')
    }
    else {
      $('#delay').attr('disabled', true).parent().addClass('disabled')
    }
  })
  $('#selection_key_only').attr('checked', !!Options.selection_key_only())

  $('#delay').val(Options.delay())


  $('#do_not_show_oops').attr('checked', !!Options.do_not_show_oops())

  $('#save_button').click(function() { Options.save_options() })
  $(document).on('keydown', function(e) {
    if (e.keyCode === 13) {
      Options.save_options()
    }
  })

  $('#more_options_link').on('click', function() {
    $('#more_options_link').hide()
    $('#more_options').fadeIn()
    return false
  })

  $('.set_hotkey').on('click', function() {
    chrome.tabs.create({url:'chrome://extensions/configureCommands'})
    return false
  })
})
