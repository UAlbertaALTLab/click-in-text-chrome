/**
 * @file This script starts dev server and runs cypress tests.
 */
import {spawn} from 'child_process'
import {startServer} from "./test-server";

startServer(() => {
  console.log('starting cypress tests')

  const cypressProcess = spawn('npx', ['cypress', 'run'], {shell: true})
  // fixme: we can maybe add stdio option to replace the two lines below
  //  see https://nodejs.org/api/child_process.html#child_process_options_stdio
  //  However, I tried stdio:'pipe', stdio: ['pipe', 'pipe', 'pipe'], and stdio: ['ignore', 'pipe', 'pipe']
  //  None of them shows realtime output of cypress while running `$ yarn test`
  cypressProcess.stdout.on('data', data => console.log(data.toString()))
  cypressProcess.stderr.on('data', data => console.error(data.toString()))
  cypressProcess.on('close', code => process.exit(code))
})
