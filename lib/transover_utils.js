// helper functions

const TransOver = {}

TransOver.modifierKeys = {
  16: 'shift', 17: 'ctrl', 18: 'alt', 224: 'meta', 91: 'command', 93: 'command', 13: 'Return'
}

// This function deserializes serialized stuff. Plus it also accepts single strings and returns them as is.
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

TransOver.formatTranslation = function(translation) {
  let formatted_translation = ''


  if (translation instanceof Array) {
    // translation was successful
    translation.forEach(function(pos_block) {
      const formatted_pos = pos_block.pos ? '<strong>'+pos_block.pos+'</strong>: ' : ''
      const formatted_meanings = pos_block.meanings.slice(0,5).join(', ') + ( pos_block.meanings.length > 5 ? '...' : '' )
      formatted_translation = formatted_translation + '<div class="pos_translation ' + '">' + formatted_pos + formatted_meanings + '</div>'
    })
  }
  else {
    // translation is a oops message (translation not found)
    formatted_translation = '<div class="pos_translation ' + '">' + TransOver.escape_html(translation) + '</div>'
  }

  return formatted_translation
}
// helper function
TransOver.escape_html = function(text) {
  return text.replace(XRegExp('(<|>|&)', 'g'), function ($0, $1) {
    switch ($1) {
    case '<': return '&lt;'
    case '>': return '&gt;'
    case '&': return '&amp;'
    }
  })
}

// dayum this function is trippin'
TransOver.regexp_escape = function(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}


// where translate api happens
TransOver.translate = function translate(word, onresponse, sendResponse) {

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




export default TransOver
