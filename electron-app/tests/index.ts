import { access } from 'node:fs/promises';
import { dirname, join, parse, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  net,
  protocol,
  session,
} from 'electron';
import Store from 'electron-store';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store({
  defaults: {
    firstRunV1: true,
    needsMigration: true,
    showDockIcon: false,
  },
});

// Handle file URLs for asset loading
async function getAssetPath(emberAppDir: string, url: string) {
  const urlPath = fileURLToPath(url);
  const { root } = parse(urlPath);
  const relPath = relative(root, urlPath);
  const appPath = join(emberAppDir, relPath);

  try {
    await access(appPath);
    return appPath;
  } catch {
    return urlPath;
  }
}

function handleFileUrls(emberAppDir: string) {
  protocol.handle('file', async ({ url }) => {
    const assetPath = await getAssetPath(emberAppDir, url);
    return net.fetch(pathToFileURL(assetPath).href, {
      bypassCustomProtocolHandlers: true,
    });
  });
}

// These are the command-line arguments passed to us by test-runner.js
const [, , , testPageURL, testemURL, testemId] = process.argv;

// Set up communication with the testem server
function setupTestem() {
  if (!testemURL) {
    console.log('No testem URL provided, running in standalone mode');
    return;
  }

  const { host: testemHost } = new URL(testemURL);

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const urlObj = new URL(details.url);
    const { hostname } = urlObj;

    if (hostname === 'testemserver') {
      urlObj.host = testemHost;
      callback({ redirectURL: urlObj.toString() });
    } else {
      callback({});
    }
  });
}

// Open the test window using ember-electron approach
function openTestWindow(emberAppDir: string) {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: !process.env.CI,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '..', '..', '.vite', 'build', 'preload.js'),
    },
  });

  delete (window as any).module;

  // Convert the emberAppDir to a file URL and append a '/' so when it's joined
  // with the testPageURL the last path component isn't dropped
  const url = new URL(
    testPageURL || 'tests/index.html?hidepassed',
    `${pathToFileURL(emberAppDir)}/`
  );

  // We need to set this query param so testem can communicate with the server
  if (testemId) {
    url.searchParams.set('testemId', testemId);
  }

  // https://github.com/nodejs/node/issues/9500
  for (const [key, value] of url.searchParams.entries()) {
    if ([null, undefined, ''].includes(value)) {
      url.searchParams.set(key, 'true');
    }
  }

  window.loadURL(url.toString());

  return window;
}

// IPC handlers needed by the app
ipcMain.handle('getAppVersion', async () => {
  return app.getVersion();
});

ipcMain.handle('getPlatform', () => {
  return process.platform;
});

ipcMain.handle('getStoreValue', (_event, key: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return store.get(key) as unknown;
});

ipcMain.handle('getShouldUseDarkColors', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

const emberAppDir = resolve(__dirname, '..', '..', 'dist');

app.on('ready', async function onReady() {
  // Set a global for the preload script to detect test mode
  process.env.ELECTRON_IS_TESTING = 'true';

  await handleFileUrls(emberAppDir);

  // Set up testem communication
  setupTestem();

  // Open the test window - testem.js will handle QUnit integration automatically
  openTestWindow(emberAppDir);
});

app.on('window-all-closed', function onWindowAllClosed() {
  app.quit();
});
