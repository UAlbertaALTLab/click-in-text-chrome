/**
 * @file run this file if you want to start test server and test yourself
 */

import {ChildProcess, spawn} from "child_process";
import {existsSync} from "fs";


export function startServer(onClose: (...args) => unknown): ChildProcess {
  if (!existsSync('dist/test.html')) {
    throw new Error("dist/test.html not found; do you need to run a build first?")
  }

  const process = spawn('npx', ['ws', '-p', '8080', '-d', 'dist'],
      {stdio: "inherit", shell: true})
  const waitOnProcess = spawn('npx', ['wait-on', 'http-get://localhost:8080/test.html'],
      {stdio: "inherit", shell: true})
  waitOnProcess.on('close', onClose)
  return process;
}




if (require.main === module) {
  startServer(()=>true)
}
