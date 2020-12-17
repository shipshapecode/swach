declare module 'ember-local-storage' {
  export declare function storageFor(
    key: string,
    modelName?: string,
    options: {} = {}
  ): Function;
}

declare module 'ember-local-storage/test-support/reset-storage' {
  export = function resetStorages(): void {};
}
