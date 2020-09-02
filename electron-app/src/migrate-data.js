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

    const jsonString = await window.webContents.executeJavaScript(
      `
      ${IDBExportImport.exportToJsonString.toString()}

      function getJsonForIndexedDb() {
        const DBOpenRequest = window.indexedDB.open('orbit', 1);
      
        return new Promise((resolve, reject) => {
          DBOpenRequest.onsuccess = () => {
            const idbDatabase = DBOpenRequest.result;
            exportToJsonString(idbDatabase, (err, jsonString) => {
              if (err) {
                idbDatabase.close();
                reject(err);
              } else {
                idbDatabase.close();
                resolve(jsonString);
              }
            });
          };
        });
      }
      
      getJsonForIndexedDb();
      `
    );

    console.log('$$$$$$$$$', jsonString);

    // Create an empty HTML file in a temporary location that we can load via a
    // `file:` URL so we can write our values to the `file:`-scoped localStorage.
    // We don't do this with a protocol handler because we don't want to mess
    // with how `file:` URLs are handled, as it could cause problems when we
    // actually load Ember app over a `file:` URL.
    let tempFile = fileSync();
    await writeFile(tempFile.name, '<html></html>');
    await window.loadFile(tempFile.name);

    if (jsonString) {
      // TODO: figure out why this import refuses to work
      // const result = await window.webContents.executeJavaScript(
      //   `
      //   ${IDBExportImport.importFromJsonString.toString()}
      //   ${IDBExportImport.clearDatabase.toString()}
      //   function restoreJsonForIndexedDb() {
      //     const DBOpenRequest = window.indexedDB.open('orbit', 1);
      //     return new Promise((resolve, reject) => {
      //       DBOpenRequest.onsuccess = () => {
      //         const idbDatabase = DBOpenRequest.result;
      //         clearDatabase(idbDatabase, (err) => {
      //           if (!err) {
      //             // cleared data successfully
      //             importFromJsonString(
      //               idbDatabase,
      //               ${jsonString},
      //               (err) => {
      //                 if (err) {
      //                   idbDatabase.close();
      //                   reject(err);
      //                 } else {
      //                   idbDatabase.close();
      //                   resolve();
      //                 }
      //               }
      //             );
      //           } else {
      //             reject(err);
      //           }
      //         });
      //       };
      //     });
      //   }
      //   restoreJsonForIndexedDb();
      // `
      // );
      // console.log('*****END*******', result);
    }
  } finally {
    window.destroy();
  }
};
