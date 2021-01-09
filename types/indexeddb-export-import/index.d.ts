declare module 'indexeddb-export-import' {
  export declare function exportToJsonString(
    idbDatabase: IDBDatabase,
    cb: (error: Event | null, jsonString: string) => void
  );
  export declare function importFromJsonString(
    idbDatabase: IDBDatabase,
    jsonString: string,
    cb: (error: Event | null) => void
  );
  export declare function clearDatabase(
    idbDatabase: IDBDatabase,
    cb: (error: Event | null) => void
  );
}
