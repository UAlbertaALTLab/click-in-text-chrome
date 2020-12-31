/*
* @file Assuming a ./dist folder, this file zips ./dist to a publishable chrome-extension. This script also removes excluded test files which are only necessary in cypress testing.
 */

import * as fs from 'fs'
const fsPromise = fs.promises
import * as path from 'path'
import * as recursiveReadDir from 'recursive-readdir'
import * as JSZip from 'jszip'


const outName = 'click-in-text.zip'

const excludedFiles = ['test.js', 'test.html', 'embedded.js']

const zip = new JSZip()
// ignore files named "foo.cs" or files that end in ".html".
recursiveReadDir('dist', excludedFiles, function (err, filePaths) {
  Promise.all(
    filePaths.map(filePath => fsPromise.readFile(filePath)
      .then(fileContent => {

        // `shift()` removes the 'dist' parent
        const filePathComponents = filePath.split(path.sep)
        filePathComponents.shift()
        zip.file(filePathComponents.join(path.sep), fileContent)
      }
      )
    )
  ).then(() => zip.generateNodeStream({
    type: 'nodebuffer',
    streamFiles: true
  }).pipe(fs.createWriteStream(outName)).on('finish', () => console.log(`${outName} written`)))
})