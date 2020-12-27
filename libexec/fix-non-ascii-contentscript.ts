/**
 * @file Chrome 75 (on Mac, at least) does not like loading the minified contentscript, despite the fact that it is properly UTF-8 encoded. As a workaround, we convert all of its non-ASCII characters to \uXXXX escapes.
 */

import * as fs from 'fs'
const fsPromise = fs.promises
import * as path from 'path'
import {processFile} from './askiy'



const fileToBeCleaned = path.resolve('dist', 'contentscript.js')
const tmpFile = path.resolve('dist', 'contentscript.js-utf8')
fsPromise.rename(fileToBeCleaned, tmpFile)
  .then(()=>processFile(tmpFile, fileToBeCleaned))
  .then(()=>fsPromise.rm(tmpFile))
