/**
 * @file This script starts dev server and runs cypress tests.
 */

const { spawn } = require('child_process')

spawn('npx', ['http-server', 'dist'], {shell: true})
const waitOnProcess = spawn('npx', ['wait-on', 'http-get://localhost:8080/test.html'], {shell:true})

waitOnProcess.on('close', () => {
  console.log('starting cypress tests')
  
  const cypressProcess = spawn('npx', ['cypress', 'run', '--spec', 'cypress/integration/*'], {shell:true})
  cypressProcess.stdout.on('data', data=>console.log(data.toString()))
  cypressProcess.stderr.on('data', data=>console.error(data.toString()))
  cypressProcess.on('close', code=>process.exit(code))
})
