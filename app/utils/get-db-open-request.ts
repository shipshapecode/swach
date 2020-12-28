export function getDBOpenRequest(): IDBOpenDBRequest {
  return window.indexedDB.open('orbit', 1);
}
