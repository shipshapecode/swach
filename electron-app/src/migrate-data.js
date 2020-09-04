const { protocol, BrowserWindow } = require('electron');
const IDBExportImport = require('indexeddb-export-import');

module.exports = async function migrateData(mb) {
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

    return jsonString;
  } finally {
    window.destroy();
  }
};
