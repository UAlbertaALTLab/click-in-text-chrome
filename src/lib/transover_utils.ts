// helper functions

import XRegExp from 'xregexp/src'
import {FailedTranslation, SuccessfulTranslation} from './transover_core'


export const TransOver = {
  modifierKeys: {
    16: 'shift', 17: 'ctrl', 18: 'alt', 224: 'meta', 91: 'command', 93: 'command', 13: 'Return'
  },

  // fixme: are there handy utility types for the returned HTML? There must be.
  /**
   *
   * @return the HTML that we show
   */
  formatTranslation: function (translation: FailedTranslation | SuccessfulTranslation): string {
    let formatted_translation = ''


    if (translation instanceof Array) {
      // translation was successful
      translation.forEach(function (pos_block) {
        const formatted_pos = pos_block.lemma ? '<strong>' + pos_block.lemma + '</strong>: ' : ''
        const formatted_meanings = pos_block.meanings.slice(0, 5).join(', ') + (pos_block.meanings.length > 5 ? '...' : '')
        formatted_translation = formatted_translation + '<div class="pos_translation ' + '">' + formatted_pos + formatted_meanings + '</div>'
      })
    } else {
      // translation is a oops message (translation not found)
      formatted_translation = '<div class="pos_translation ' + '">' + TransOver.escape_html(translation) + '</div>'
    }

    return formatted_translation
  },


  // todo: documentation
  /**
   *
   */
  escape_html: function (text: string): string {
    return text.replace(XRegExp('(<|>|&)', 'g'), function ($0, $1) {
      switch ($1) {
        case '<':
          return '&lt;'
        case '>':
          return '&gt;'
        case '&':
          return '&amp;'
      }
    })
  },

  regexp_escape: function (s: string): string {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  ,

  // todo: is this used at all, delete this and see. Maybe this one is used for TAT popup? (type-and-translate). If that
  //  is the case, then this is code duplication and should be refactored, we already have the same thing in transover_core.ts
  /**
   *
   * @param word
   * @param onresponse
   * @param sendResponse
   */
  translate: function (word: string, onresponse, sendResponse) {

    const options = {
      url: 'https://sapir.artsrn.ualberta.ca/cree-dictionary/click-in-text?q=' + word,
      dataType: 'json',
      success: function on_success(data) {
        onresponse(data, word, sendResponse)
      },
      error: function (xhr, status, e) {
        console.log({e: e, xhr: xhr})
      }
    }
    $.ajax(options)
  }

}
