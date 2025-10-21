import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electron from 'electron';
import treeKill from 'tree-kill';

// Get __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);

//
// This script does double-duty. It can be included from testem.js
// to define an Electron test runner like so:
//
// // testem.js
// export default {
//   "launchers": {
//     "Electron": (await import("./lib/test-runner.js")).default
//   },
//   "launch_in_ci": [
//     "Electron"
//   ],
//   "launch_in_dev": [
//     "Electron"
//   ]
// }
//
// The runner is configured to invoke this script as a command-line executable
// with the proper arguments to run electron and communicate back to testem.
//

export default {
  exe: process.execPath,
  // These arguments are used in `lib/test-support/index.js`, which is called
  // from the test main process (via the blueprint-generated
  // `electron-app/tests/index.js`)
  args: [__filename, '<testPage>', '<baseUrl>', '<id>'],
  protocol: 'browser',
};

async function main() {
  let [, , testPageUrl, testemUrl, testemId] = process.argv;

  // Start electron using our custom electron app
  const electronArgs = [
    path.join(process.cwd(), 'electron-app', 'tests', 'index.ts'),
    '--', // needed because https://github.com/electron/electron/pull/13039
    testPageUrl,
    testemUrl,
    testemId,
  ];

  console.log('Starting electron with args:', electronArgs);

  let electronProcess = spawn(electron, electronArgs, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  // Clean up when we're killed
  process.on('SIGTERM', () => {
    treeKill(electronProcess.pid);
  });

  process.on('SIGINT', () => {
    treeKill(electronProcess.pid);
  });

  electronProcess.on('exit', (code) => {
    process.exit(code);
  });
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
