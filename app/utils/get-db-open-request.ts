import ENV from 'Swach/config/environment';

const { SCHEMA_VERSION } = ENV;

export function getDBOpenRequest(): IDBOpenDBRequest {
  return window.indexedDB.open('orbit', SCHEMA_VERSION);
}
