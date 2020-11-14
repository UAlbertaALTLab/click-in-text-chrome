/*
* @file Assuming a ./dist folder, this file zips ./dist to a publishable chrome-extension. This script also removes excluded test files which are only necessary in cypress testing.
 */

const fs = require('fs')
const fsPromise = fs.promises
const path = require('path')
const recursiveReadDir = require('recursive-readdir')
const JSZip = require('jszip')


const outName = 'click-in-text.zip'

const excludedFiles = ['test.js', 'test.html']

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