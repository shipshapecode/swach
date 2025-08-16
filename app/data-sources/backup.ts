import { applyStandardSourceInjections } from '@ef4/ember-orbit';
import { IndexedDBSource } from '@orbit/indexeddb';
import type {
  InitializedRecord,
  Record,
  RecordIdentity,
  RecordSchema,
} from '@orbit/records';
import { clone } from '@orbit/utils';
import ENV from 'swach/config/environment';

type PalettePOJO = Omit<Record, 'type'> & {
  type: 'palette';
  relationships: {
    colors: {
      data: RecordIdentity[];
    };
  };
  attributes: {
    colorOrder: RecordIdentity[];
  };
};

const { SCHEMA_VERSION } = ENV;

export default {
  create(injections: { schema: RecordSchema }): IndexedDBSource {
    applyStandardSourceInjections(injections);

    const { schema } = injections;
    const backup = new IndexedDBSource({
      name: 'backup',
      defaultTransformOptions: { useBuffer: true },
      ...injections,
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    backup.cache.migrateDB = async (
      _db: IDBDatabase,
      event: IDBVersionChangeEvent,
    ) => {
      const { newVersion, oldVersion, currentTarget } = event;
      const request = currentTarget as IDBRequest;
      const transaction = request.transaction as IDBTransaction;

      console.log(
        `migrating indexeddb from version ${oldVersion} to ${newVersion}`,
      );

      if (oldVersion === 1) {
        const oldColors = await getRecordsFromIDB(transaction, 'color');
        const palettes = await getRecordsFromIDB(transaction, 'palette');

        const newColors: InitializedRecord[] = [];

        for (const color of oldColors) {
          if (color.relationships?.['palettes']) {
            const paletteIdentities = color.relationships['palettes']
              .data as RecordIdentity[];

            delete color.relationships['palettes'];

            if (paletteIdentities?.length) {
              color.relationships['palette'] = { data: paletteIdentities[0] };
              newColors.push(color);

              // We start at i = 1 because we can keep the original color in a single palette.
              for (let i = 1; i < paletteIdentities.length; i++) {
                const paletteIdentity = paletteIdentities[i];
                const colorCopy = clone(color) as InitializedRecord;

                colorCopy.id = schema.generateId('color');
                // @ts-expect-error relationships do actually exist
                colorCopy.relationships.palette.data = paletteIdentity;
                newColors.push(colorCopy);

                const palette = palettes.find(
                  (record): record is PalettePOJO =>
                    record.id === paletteIdentity?.id &&
                    record.type === 'palette',
                );

                if (palette) {
                  const replaceColorIdWithCopy = (c: RecordIdentity) => {
                    return c.id !== color.id
                      ? c
                      : { type: 'color', id: colorCopy.id };
                  };

                  if (palette.relationships?.colors?.data) {
                    // Replace color in palette with color copy
                    palette.relationships.colors.data =
                      palette.relationships.colors.data.map(
                        replaceColorIdWithCopy,
                      );
                  }

                  if (palette.attributes?.['colorOrder']) {
                    // Replace color id in colorOrder
                    palette.attributes['colorOrder'] = palette.attributes[
                      'colorOrder'
                    ].map(replaceColorIdWithCopy);
                  }
                }
              }
            }
          }
        }

        await clearRecordsFromIDB(transaction, 'color');
        await clearRecordsFromIDB(transaction, 'palette');
        await clearRecordsFromIDB(transaction, '__inverseRels__');

        await setRecordsInIDB(transaction, 'color', newColors);
        await setRecordsInIDB(transaction, 'palette', palettes);

        // This is a hack to force the recreation of the inverseRels
        // in the application route, after the model data has been migrated.
        // This would be better handled by adding capabilities to
        // `IndexedDBCache` in `@orbit/indexeddb` so that all changes can be
        // made within the context of the migration transaction.
        // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
        backup.recreateInverseRelationshipsOnLoad = true;
      }

      if (oldVersion < 3) {
        const objectStore = transaction.objectStore('__inverseRels__');

        // Add missing `relatedIdentity` index. This is required.
        objectStore.createIndex('relatedIdentity', 'relatedIdentity', {
          unique: false,
        });
      }
    };

    // Upgrade the schema to the latest version, and thereby, migrate the IDB
    void schema.upgrade({ version: SCHEMA_VERSION });

    return backup;
  },
};

// Note: These IDB utility function could be simplified using a promisified lib
// such as `idb`.
// Better yet, @orbit/indexeddb could allow access to these methods from within
// migrations.
function getRecordsFromIDB(
  transaction: IDBTransaction,
  type: string,
): Promise<InitializedRecord[]> {
  return new Promise((resolve) => {
    const objectStore = transaction.objectStore(type);
    const request = objectStore.openCursor();
    const records: InitializedRecord[] = [];

    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue> | null)
        ?.result;

      if (cursor) {
        const record = cursor.value as InitializedRecord;

        records.push(record);
        cursor.continue();
      } else {
        resolve(records);
      }
    };
  });
}

function clearRecordsFromIDB(
  transaction: IDBTransaction,
  type: string,
): Promise<void> {
  return new Promise((resolve) => {
    const objectStore = transaction.objectStore(type);
    const request = objectStore.clear();

    request.onsuccess = () => {
      resolve();
    };
  });
}

function setRecordsInIDB(
  transaction: IDBTransaction,
  type: string,
  records: InitializedRecord[],
): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const objectStore = transaction.objectStore(type);

    // TODO: correctly type this instead of using `any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const putNext = (): any => {
      if (i < records.length) {
        const record = records[i++];
        const request = objectStore.put(record);

        request.onsuccess = putNext();
      } else {
        resolve();
      }
    };

    putNext();
  });
}
