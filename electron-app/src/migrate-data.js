const { protocol, BrowserWindow } = require('electron');
const {
  promises: { writeFile }
} = require('fs');
const { fileSync } = require('tmp');
const IDBExportImport = require('indexeddb-export-import');

module.exports = async function migrateData() {
  console.log('****start migrating data****');
  protocol.registerStringProtocol('serve', (request, callback) => {
    callback({ mimeType: 'text/html', data: '<html></html>' });
  });
  // Navigate to our empty page in a hidden browser window
  let window = new BrowserWindow({ show: false });
  try {
    await window.loadURL('serve://dist');
    console.log('serve window loaded');

    const jsonString = await window.webContents.executeJavaScript(
      `
      /**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idbDatabase - to export from
 * @param {function(Object?, string?)} cb - callback with signature (error, jsonString)
 */
function exportToJsonString(idbDatabase, cb) {
  const exportObject = {};
  const size = new Set(idbDatabase.objectStoreNames).size;
  if (size === 0) {
    cb(null, JSON.stringify(exportObject));
  } else {
    const transaction = idbDatabase.transaction(
      idbDatabase.objectStoreNames,
      'readonly'
    );
    transaction.onerror = (event) => cb(event, null);

    const objectStoreNames = Array.from(new Set(idbDatabase.objectStoreNames));

    objectStoreNames.forEach((storeName) => {
      const allObjects = [];
      transaction.objectStore(storeName).openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          allObjects.push(cursor.value);
          cursor.continue();
        } else {
          exportObject[storeName] = allObjects;
          if (objectStoreNames.length === Object.keys(exportObject).length) {
            cb(null, JSON.stringify(exportObject));
          }
        }
      };
    });
  }
}

/**
 * Import data from JSON into an IndexedDB database. This does not delete any existing data
 *  from the database, so keys could clash
 *
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 */
function importFromJsonString(idbDatabase, jsonString, cb) {
  const transaction = idbDatabase.transaction(
    idbDatabase.objectStoreNames,
    'readwrite'
  );
  transaction.onerror = (event) => cb(event);

  const importObject = JSON.parse(jsonString);
  const objectStoreNames = new Set(idbDatabase.objectStoreNames);
  Array.from(objectStoreNames).forEach((storeName) => {
    let count = 0;
    const aux = Array.from(importObject[storeName]);
    if (importObject[storeName] && aux.length > 0) {
      aux.forEach((toAdd) => {
        const request = transaction.objectStore(storeName).add(toAdd);
        request.onsuccess = () => {
          count++;
          if (count === importObject[storeName].length) {
            // added all objects for this store
            delete importObject[storeName];
            if (Object.keys(importObject).length === 0) {
              // added all object stores
              cb(null);
            }
          }
        };
        request.onerror = (event) => {
          console.log(event);
        };
      });
    } else {
      delete importObject[storeName];
      if (Object.keys(importObject).length === 0) {
        // added all object stores
        cb(null);
      }
    }
  });
}

/**
 * Clears a database of all data
 *
 * @param {IDBDatabase} idbDatabase - to delete all data from
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 */
function clearDatabase(idbDatabase, cb) {
  const transaction = idbDatabase.transaction(
    idbDatabase.objectStoreNames,
    'readwrite'
  );
  const size = new Set(idbDatabase.objectStoreNames).size;
  transaction.onerror = (event) => cb(event);

  let count = 0;
  Array.from(idbDatabase.objectStoreNames).forEach(function (storeName) {
    transaction.objectStore(storeName).clear().onsuccess = () => {
      count++;
      if (count === size) {
        // cleared all object stores
        cb(null);
      }
    };
  });
}

async function getJsonForIndexedDb() {
  console.log('called getJsonForIndexedDb');
  const DBOpenRequest = window.indexedDB.open('orbit', 1);

  return await new Promise((resolve, reject) => {
    DBOpenRequest.onsuccess = () => {
      const idbDatabase = DBOpenRequest.result;
      exportToJsonString(idbDatabase, async (err, jsonString) => {
        console.log('***jsonString***', jsonString);
        if (err) {
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
      const theWindow = await window.webContents.executeJavaScript(`window`);

      const DBOpenRequest = theWindow.indexedDB.open('orbit', 1);
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
  } finally {
    window.destroy();
  }
};
