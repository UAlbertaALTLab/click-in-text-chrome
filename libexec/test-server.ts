/**
 * @file run this file if you want to start test server and test yourself
 */

import {spawn} from "child_process";
import {existsSync} from "fs";


export function startServer(onClose: (...args) => unknown):void {
  if (!existsSync('dist/test.html')) {
    throw new Error("dist/test.html not found; do you need to run a build first?")
  }

  spawn('npx', ['http-server', 'dist', '-p', '8080'], {shell: true})
  const waitOnProcess = spawn('npx', ['wait-on', 'http-get://localhost:8080/test.html'], {shell: true})
  waitOnProcess.on('close', onClose)
}




if (require.main === module) {
  startServer(()=>true)
}
