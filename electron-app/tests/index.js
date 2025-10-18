const {
  BrowserWindow,
  app,
  ipcMain,
  nativeTheme,
  protocol,
  net,
} = require('electron');
const { pathToFileURL, fileURLToPath } = require('url');
const { access } = require('fs').promises;
const Store = require('electron-store');
const path = require('path');

const store = new Store({
  defaults: {
    firstRunV1: true,
    needsMigration: true,
    showDockIcon: false,
  },
});

// Handle file URLs for asset loading
async function getAssetPath(emberAppDir, url) {
  const urlPath = fileURLToPath(url);
  const { root } = path.parse(urlPath);
  const relPath = path.relative(root, urlPath);
  const appPath = path.join(emberAppDir, relPath);

  try {
    await access(appPath);
    return appPath;
  } catch {
    return urlPath;
  }
}

function handleFileUrls(emberAppDir) {
  if (protocol.handle) {
    protocol.handle('file', async ({ url }) => {
      const assetPath = await getAssetPath(emberAppDir, url);
      return net.fetch(pathToFileURL(assetPath), {
        bypassCustomProtocolHandlers: true,
      });
    });
  } else {
    protocol.interceptFileProtocol('file', async ({ url }, callback) => {
      callback(await getAssetPath(emberAppDir, url));
    });
  }
}

function runTests(emberAppDir) {
  const testWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: !process.env.CI,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  delete testWindow.module;

  // Build test URL
  const testUrl = `file://${emberAppDir}/tests/index.html?hidepassed`;

  console.log('🧪 Starting Ember tests in Electron...');
  console.log(`📁 Loading: ${testUrl}`);

  // Set up console forwarding for test output
  testWindow.webContents.on(
    'console-message',
    (event, level, message, line, sourceId) => {
      if (level === 1) {
        // info level
        console.log(`[TEST] ${message}`);
      } else if (level === 2) {
        // warning level
        console.log(`[WARN] ${message}`);
      } else if (level === 3) {
        // error level
        console.log(`[ERROR] ${message}`);
      }
    }
  );

  // Set up QUnit integration and test reporting
  testWindow.webContents.on('did-finish-load', () => {
    console.log('📄 Test page loaded, setting up QUnit integration...');

    // Wait for QUnit to be available, then set up event handlers
    setTimeout(() => {
      testWindow.webContents
        .executeJavaScript(
          `
        (function setupQUnitReporting() {
          if (typeof QUnit !== 'undefined' && QUnit.testDone) {
            console.info('✅ QUnit detected, setting up test reporting...');
            
            let moduleStats = {};
            let totalTests = 0;
            let passedTests = 0;
            let failedTests = 0;
            let startTime = Date.now();
            
            // Track individual test results
            QUnit.testDone(function(details) {
              totalTests++;
              const status = details.failed === 0 ? 'ok' : 'not ok';
              const testName = (details.module ? details.module + ': ' : '') + details.name;
              const runtime = details.runtime + ' ms';
              
              // Format: ok 57 Electron - [175 ms] - Acceptance | welcome: welcome flow
              console.info(status + ' ' + totalTests + ' Electron - [' + runtime + '] - ' + testName);
              
              if (details.failed === 0) {
                passedTests++;
              } else {
                failedTests++;
                // Log failure details for failed tests
                if (details.assertions) {
                  details.assertions.forEach(function(assertion, i) {
                    if (!assertion.result) {
                      console.info('    # ' + assertion.message);
                      if (assertion.expected !== undefined && assertion.actual !== undefined) {
                        console.info('    # Expected: ' + assertion.expected);
                        console.info('    # Actual: ' + assertion.actual);
                      }
                    }
                  });
                }
              }
              
              // Track module stats
              if (details.module) {
                if (!moduleStats[details.module]) {
                  moduleStats[details.module] = { passed: 0, failed: 0, total: 0 };
                }
                moduleStats[details.module].total++;
                if (details.failed === 0) {
                  moduleStats[details.module].passed++;
                } else {
                  moduleStats[details.module].failed++;
                }
              }
            });

            // Track module completion
            QUnit.moduleDone(function(details) {
              const status = details.failed === 0 ? '✅' : '❌';
              console.info(status + ' Module "' + details.name + '" completed: ' + 
                         details.passed + '/' + details.total + ' passed');
            });

            // Handle test suite completion
            QUnit.done(function(details) {
              const endTime = Date.now();
              const totalTime = endTime - startTime;
              
              console.info('');
              console.info('='.repeat(80));
              console.info('🏁 TEST RUN COMPLETE');
              console.info('='.repeat(80));
              console.info('📊 Results Summary:');
              console.info('   Total Tests: ' + details.total);
              console.info('   ✅ Passed: ' + details.passed + ' (' + Math.round(details.passed/details.total*100) + '%)');
              console.info('   ❌ Failed: ' + details.failed + (details.failed > 0 ? ' (' + Math.round(details.failed/details.total*100) + '%)' : ''));
              console.info('   ⏱️  Runtime: ' + details.runtime + 'ms');
              console.info('   📦 Total Time: ' + totalTime + 'ms');
              console.info('='.repeat(80));
              
              // Store results for main process
              window.electron_test_results = {
                total: details.total,
                passed: details.passed, 
                failed: details.failed,
                runtime: details.runtime,
                success: details.failed === 0
              };
              
              // Signal completion to main process
              console.info('🎯 Tests completed - ' + (details.failed === 0 ? 'SUCCESS' : 'FAILURE'));
            });

            return 'QUnit reporting setup complete';
          } else {
            console.info('⏳ QUnit not ready yet, retrying...');
            setTimeout(setupQUnitReporting, 500);
            return 'QUnit not ready, retrying...';
          }
        })();
      `
        )
        .then((result) => {
          console.log('🔧 QUnit setup result:', result);
        })
        .catch((err) => {
          console.error('❌ Error setting up QUnit:', err);
        });
    }, 1500);
  });

  // Monitor for test completion and handle exit
  const checkForCompletion = () => {
    testWindow.webContents
      .executeJavaScript('window.electron_test_results')
      .then((results) => {
        if (results) {
          console.log('\n🏆 Final Results:', results);

          // Close window
          testWindow.close();

          // Exit with appropriate code after a brief delay
          setTimeout(() => {
            const exitCode = results.success ? 0 : 1;
            console.log(`🚪 Exiting with code ${exitCode}`);
            process.exit(exitCode);
          }, 100);
        } else {
          // Check again in 1 second
          setTimeout(checkForCompletion, 1000);
        }
      })
      .catch((err) => {
        console.error('❌ Error checking test results:', err);
        setTimeout(checkForCompletion, 1000);
      });
  };

  // Load the test page
  testWindow.loadURL(testUrl);

  // Start monitoring for completion after tests have had time to run
  setTimeout(checkForCompletion, 3000);

  return testWindow;
}

// IPC handlers needed by the app
ipcMain.handle('getAppVersion', async () => {
  return app.getVersion();
});

ipcMain.handle('getPlatform', () => {
  return process.platform;
});

ipcMain.handle('getStoreValue', (event, key) => {
  return store.get(key);
});

ipcMain.handle('getShouldUseDarkColors', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

const emberAppDir = path.resolve(__dirname, '..', '..', 'dist');

app.on('ready', async function onReady() {
  await handleFileUrls(emberAppDir);
  runTests(emberAppDir);
});

app.on('window-all-closed', function onWindowAllClosed() {
  app.quit();
});
