/**
 * @file run this file if you want to start test server and test yourself
 */

import {spawn} from "child_process";


export function startServer(onClose: (...args) => unknown):void {

  spawn('npx', ['http-server', 'dist'], {shell: true})
  const waitOnProcess = spawn('npx', ['wait-on', 'http-get://localhost:8080/test.html'], {shell: true})
  waitOnProcess.on('close', onClose)
}




if (require.main === module) {
  startServer(()=>true)
}
