import * as fs from 'fs'
import {PathLike} from "fs";
const fsPromise = fs.promises

async function processFile(infile:PathLike, outfile:PathLike):Promise<void> {


  const fileContents = await fsPromise.readFile(infile, 'utf8')

  const lines = fileContents.split('\n')
  const better = []

  for (const line of lines) {
    better.push(line.replace(/[\u0080-\uFFFF]/g, function (c) {
      const hex = c.charCodeAt(0).toString(16)
      const zeros = '0'.repeat(4 - hex.length)
      return '\\u' + zeros + hex
    }))
  }
  return fsPromise.writeFile(outfile, better.join('\n'), 'utf8')
}

export {processFile}