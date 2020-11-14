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

//
// const targetName = 'click-in-text.gz'
//
// fsPromise.readdir('dist').then(filePaths =>{
//   return Promise.all(filePaths.map(filename => {
//     return new Promise((resolve, reject) => {
//       const fileContents = fs.createReadStream(path.resolve('dist', filename))
//       const writeStream = fs.createWriteStream(targetName)
//       const zip = zlib.createGzip()
//       fileContents.pipe(zip).pipe(writeStream).on('finish', (err) => {
//         if (err) return reject(err)
//         else resolve()
//       })
//     })
//   }))
//     .then(()=>console.log('Done compressing extension'))
// })
//
