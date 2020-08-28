const { protocol, BrowserWindow } = require('electron');
const {
  promises: { writeFile }
} = require('fs');
const { fileSync } = require('tmp');
const IDBExportImport = require('indexeddb-export-import');

module.exports = async function migrateData() {
  protocol.registerStringProtocol('serve', (request, callback) => {
    callback({ mimeType: 'text/html', data: '<html></html>' });
  });
  // Navigate to our empty page in a hidden browser window
  let window = new BrowserWindow({ show: false });
  try {
    await window.loadURL('serve://dist');

    const DBOpenRequest = await window.webContents.executeJavaScript(
      `window.indexedDB.open('orbit', 1)`
    );
    console.log(DBOpenRequest);
    DBOpenRequest.onsuccess = () => {
      const idbDatabase = DBOpenRequest.result;

      console.log(idbDatabase);
      IDBExportImport.exportToJsonString(
        idbDatabase,
        async (err, jsonString) => {
          console.log(jsonString);
          if (err) {
            console.error(err);
          } else {
            idbDatabase.close();

            // Create an empty HTML file in a temporary location that we can load via a
            // `file:` URL so we can write our values to the `file:`-scoped localStorage.
            // We don't do this with a protocol handler because we don't want to mess
            // with how `file:` URLs are handled, as it could cause problems when we
            // actually load Ember app over a `file:` URL.
            let tempFile = fileSync();
            await writeFile(tempFile.name, '<html></html>');
            await window.loadFile(tempFile.name);

            if (jsonString) {
              const DBOpenRequest = await window.webContents.executeJavaScript(
                `window.indexedDB.open('orbit', 1)`
              );
              DBOpenRequest.onsuccess = () => {
                const idbDatabase = DBOpenRequest.result;
                IDBExportImport.clearDatabase(idbDatabase, (err) => {
                  if (!err) {
                    // cleared data successfully
                    IDBExportImport.importFromJsonString(
                      idbDatabase,
                      jsonString,
                      async (err) => {
                        if (!err) {
                          idbDatabase.close();
                        }
                      }
                    );
                  }
                });
              };
            }
          }
        }
      );
    };
  } finally {
    window.destroy();
  }
};
