import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { net, protocol } from 'electron';

//
// Patch asset loading -- Ember apps use absolute paths to reference their
// assets, e.g. `<img src="/images/foo.jpg">`. When the current URL is a `file:`
// URL, that ends up resolving to the absolute filesystem path `/images/foo.jpg`
// rather than being relative to the root of the Ember app. So, we intercept
// `file:` URL requests and look to see if they point to an asset when
// interpreted as being relative to the root of the Ember app. If so, we return
// that path, and if not we leave them as-is, as their absolute path.
//
export async function getAssetPath(emberAppDir: string, url: string) {
  const urlPath = fileURLToPath(url);
  // Get the root of the path -- should be '/' on MacOS or something like
  // 'C:\\' on Windows
  const { root } = path.parse(urlPath);
  // Get the relative path from the root to the full path
  const relPath = path.relative(root, urlPath);
  // Join the relative path with the Ember app directory
  const appPath = path.join(emberAppDir, relPath);

  try {
    await access(appPath);
    return appPath;
  } catch {
    return urlPath;
  }
}

export default function handleFileURLs(emberAppDir: string) {
  protocol.handle('file', async ({ url }) => {
    const assetPath = await getAssetPath(emberAppDir, url);
    return net.fetch(pathToFileURL(assetPath).href, {
      bypassCustomProtocolHandlers: true,
    });
  });
}
