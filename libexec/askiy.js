const fs = require('fs')
const fsPromise = fs.promises

// todo: use Pathlike from fs once we have typescript

/**
 * Turns all non-ASCII characters in a UTF-8 file into \uXXXX escapes.
 *
 * @param {Pathlike} infile
 * @param {Pathlike} outfile
 */
async function processFile(infile, outfile) {


  let fileContents = await fsPromise.readFile(infile, 'utf8')

  let lines = fileContents.split('\n')
  let better = []

  for (let line of lines) {
    better.push(line.replace(/[\u0080-\uFFFF]/g, function (c) {
      let hex = c.charCodeAt(0).toString(16)
      let zeros = '0'.repeat(4 - hex.length)
      return '\\u' + zeros + hex
    }))
  }
  return fsPromise.writeFile(outfile, better.join('\n'), 'utf8')
}

module.exports = {processFile}