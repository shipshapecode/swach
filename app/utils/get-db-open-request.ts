import ENV from 'swach/config/environment';

const { SCHEMA_VERSION } = ENV;

export function getDBOpenRequest(): IDBOpenDBRequest {
  return window.indexedDB.open('orbit', SCHEMA_VERSION);
}
