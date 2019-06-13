const TransOver = {}

TransOver.modifierKeys = {
  16: 'shift', 17: 'ctrl', 18: 'alt', 224: 'meta', 91: 'command', 93: 'command', 13: 'Return'
}

// This function deserializes serialized stuff. But it also accepts single strings and returns them as is.
TransOver.deserialize = function(text) {
  let res

  try {
    res = JSON.parse(text)
  }
  catch (e) {
    // that means text is a string (including "") as opposed to a serialized object
    if (e.toString().match(/SyntaxError/)) {
      res = text
    }
    else {
      throw e
    }
  }
  return res
}

// todo: remove textDirection, from_lang, options
TransOver.formatTranslation = function(translation, textDirection, from_lang, options) {
  let formatted_translation = ''

  // todo: figure out in which case <translation> will be a array/string
  if (translation instanceof Array) {
    translation.forEach(function(pos_block) {
      const formatted_pos = pos_block.pos ? '<strong>'+pos_block.pos+'</strong>: ' : ''
      const formatted_meanings = pos_block.meanings.slice(0,5).join(', ') + ( pos_block.meanings.length > 5 ? '...' : '' )
      formatted_translation = formatted_translation + '<div class="pos_translation ' + '">' + formatted_pos + formatted_meanings + '</div>'
    })
  }
  else {
    formatted_translation = '<div class="pos_translation ' + '">' + TransOver.escape_html(translation) + '</div>'
  }

  // This block shows a good way to add footers to the popup box. Was originally used for translation source language
  // const fromLang = TransOverLanguages[from_lang]
  // if (fromLang && options.show_from_lang) {
  //   formatted_translation += `
  //     <div class="from_lang ${rtl}">
  //       <strong>translated from:</strong>
  //       <span> ${fromLang.label}</span>
  //     </div>
  //   `
  // }

  return formatted_translation
}

TransOver.escape_html = function(text) {
  return text.replace(XRegExp('(<|>|&)', 'g'), function ($0, $1) {
    switch ($1) {
    case '<': return '&lt;'
    case '>': return '&gt;'
    case '&': return '&amp;'
    }
  })
}

TransOver.regexp_escape = function(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

export default TransOver
