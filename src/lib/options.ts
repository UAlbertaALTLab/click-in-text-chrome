// this file defines helper functions that read/write user options in user's local storage


// Note localStorage only stores strings. When we get them out we use JSON.parse
// when we set localStorage using localStorage[a] = b, if b is a boolean or string, localStorage will help us serialize
// but otherwise, we need to do localStorage[a] = JSON.stringify(b)
// consider adding cache to avoid repeated parsing from localStorage?
/**
 * Getters and setters here interacts with localStorage.
 * Note when localStorage has undefined fields, getters always return the default setting for the field
 */
class Options {


  // consider further specify the types (instead of `string`). It's better to have a union type of some keycode literals
  /**
   * only show translation when I hold the trigger key
   */
  get popup_show_trigger(): string {
    return localStorage['popup_show_trigger'] ?? 'alt'
  }

  set popup_show_trigger(value: string) {
    localStorage['popup_show_trigger'] = value
  }

  get do_not_show_oops(): boolean {
    const stored = localStorage['do_not_show_oops']
    if (stored == undefined) return false
    return stored == 'true'
  }

  set do_not_show_oops(value: boolean) {
    localStorage['do_not_show_oops'] = value
  }

  get delay(): number {
    const stored = localStorage["delay"]
    if (stored == undefined) return 700
    return parseInt(stored)
  }

  set delay(ms: number) {
    if (!isNaN(ms) && isFinite(ms)) {
      localStorage['delay'] = ms
    } else {
      console.error(`Out of bound number ${ms} passed into setter of delay `)
    }

  }

  get translate_by(): "click" | "point" {
    return localStorage.translate_by ?? 'click'
  }

  set translate_by(value: "click" | "point") {
    localStorage.translate_by = value
  }

  /**
   * show translation of selected/highlighted part only when a key is held?
   */
  get selection_key_only(): boolean {
    const stored = localStorage['selection_key_only']
    if (stored == undefined) return false
    return stored == 'true'
  }

  set selection_key_only(value: boolean) {
    localStorage['selection_key_only'] = value
  }

  /**
   * show translation only when a key is held?
   */
  get word_key_only(): boolean {
    const stored = localStorage['word_key_only']
    if (stored == undefined) return false
    return stored == 'true'
  }


  set word_key_only(value: boolean) {
    localStorage['word_key_only'] = value
  }

  get only_urls(): URL[] {
    if (localStorage["only_urls"] == undefined) return []
    try {
      return JSON.parse(localStorage.only_urls).map(url => new URL(url))
    } catch (e) { // shouldn't be possible
      return []
    }
  }

  set only_urls(value: URL[]) {
    if (value instanceof Array) {
      // URL instances stringifies nicely
      localStorage.only_urls = JSON.stringify(value)
    } else {
      console.error("Attempting to set a non-array only_urls")
    }
  }

  get except_urls(): URL[] {
    if (localStorage["except_urls"] == undefined) return []
    try {
      return JSON.parse(localStorage.except_urls).map(urlString => new URL(urlString))
    } catch (e) { // shouldn't be possible
      return []
    }
  }

  set except_urls(value: URL[]) {
    if (value instanceof Array) {
      localStorage.except_urls = JSON.stringify(value)
    } else {
      console.error("Attempting to set a non-array except_urls")
    }
  }


  // todo: move this function to browser and embedded
// This function is called when the user click on the "save" button on options page.
  /**
   * Assuming the current document has all the options input elements, get the options. And save them to localStorage
   */
  saveOptions(): void {


    // get the urls of pages user don't want to use the extension on
    function get_except_urls() {


      // empty input fields will be left out
      return $('.except_url_input').filter(function () {
        return isValidHTTPUrl((<HTMLInputElement>this).value)
      }).map(function () {
        return new URL((<HTMLInputElement>this).value)
      }).get()
    }

    // get the urls of pages user only want to use the extension on
    function get_only_urls() {

      // empty input fields will be left out
      return $('.only_url_input').filter(function () {
        return isValidHTTPUrl((<HTMLInputElement>this).value)
      }).map(function () {
        return new URL((<HTMLInputElement>this).value)
      }).get()
    }

    // todo: get rid of the casting (`as`) and introduce check, perhaps by type guard
    // store options in local storage
    this.translate_by = $('#translate_by').val() as "click" | "point"
    this.except_urls = get_except_urls()
    this.only_urls = get_only_urls()
    this.word_key_only = !!$('#word_key_only:checked').val()
    this.selection_key_only = !!$('#selection_key_only:checked').val()
    this.delay = parseInt($('#delay').val() as string)
    this.do_not_show_oops = !!$('#do_not_show_oops:checked').val()
    this.popup_show_trigger = $('#word_key_only_key').val() as string

    $('#status').fadeIn().delay(3000).fadeOut()
  }

}


function isValidHTTPUrl(maybeURL: string): boolean {
  let url;
  try {
    url = new URL(maybeURL);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * get/set options from/to localStorage
 */
export const options = new Options()








