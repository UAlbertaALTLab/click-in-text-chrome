/**
 * @file Chrome 75 (on Mac, at least) does not like loading the minified contentscript, despite the fact that it is properly UTF-8 encoded. As a workaround, we convert all of its non-ASCII characters to \uXXXX escapes.
 */

const path = require('path')
const fs = require('fs')
const fsPromise = fs.promises
const {processFile} = require('./askiy.js')



const fileToBeCleaned = path.resolve('dist', 'contentscript.js')
const tmpFile = path.resolve('dist', 'contentscript.js-utf8')
fsPromise.rename(fileToBeCleaned, tmpFile)
  .then(()=>processFile(tmpFile, fileToBeCleaned))
  .then(()=>fsPromise.rm(tmpFile))
