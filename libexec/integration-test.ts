/**
 * @file This script starts dev server and runs cypress tests.
 */
import {spawn} from 'child_process'
import {startServer} from "./test-server";

const server = startServer(async () => {
  // This will be set to 0 if cypress completes successfully.
  let exitCode = 1;
  try {
    console.log('starting cypress tests')

    let cypressAction = 'run';
    if (process.env.OPEN_CYPRESS) {
      cypressAction = 'open';
    }
    const cypressProcess = spawn('npx', ['cypress', cypressAction], {stdio: "inherit"})
    await new Promise<void>((resolve) => {
      cypressProcess.on('close', (code, signal) => {
        exitCode = code;
        if (signal) {
          exitCode = 1;
        }
        resolve();
      });
    });
  } finally {
    server.kill();
  }
  process.exit(exitCode);
})
