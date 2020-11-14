/**
 * Turns all non-ASCII characters in a UTF-8 file into \uXXXX escapes.
 */

const fs = require('fs')

let [, , infile, outfile] = process.argv

let fileContents = fs.readFileSync(infile, 'utf8')

let lines = fileContents.split('\n')
let better = []

for (let line of lines) {
  better.push(line.replace(/[\u0080-\uFFFF]/g, function (c) {
    let hex = c.charCodeAt(0).toString(16)
    let zeros = '0'.repeat(4 - hex.length)
    return '\\u' + zeros + hex
  }))
}

fs.writeFileSync(outfile, better.join('\n'), 'utf8')
