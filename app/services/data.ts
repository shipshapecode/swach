import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { orbit, type Store } from 'ember-orbit';

import type { Coordinator } from '@orbit/coordinator';
import type IndexedDBSource from '@orbit/indexeddb';
import type JSONAPISource from '@orbit/jsonapi';
import type { InitializedRecord, RecordIdentity } from '@orbit/records';

import type Palette from '../data-models/palette.ts';
import type Session from '../services/session.ts';

export default class DataService extends Service {
  @orbit dataCoordinator!: Coordinator;
  @orbit declare store: Store;

  @service declare session: Session;

  @tracked colorHistory: Palette | undefined;
  isActivated = false;

  async activate(): Promise<void> {
    const records = await this.getRecordsFromBackup();

    if (records.length > 0) {
      try {
        await this.store.sync((t) =>
          records.map((r) => {
            if (r?.attributes?.['hex']) {
              delete r.attributes['hex'];
            }

            return t.addRecord(r);
          })
        );
      } catch (error) {
        console.error(
          '[Data Service] Failed to restore from backup due to corrupt data:',
          error
        );
        console.log('[Data Service] Deleting corrupt IndexedDB database...');

        // Delete the entire corrupt database
        const dbName = 'swach-main-backup';
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        await new Promise<void>((resolve, reject) => {
          deleteRequest.onsuccess = () => {
            console.log('[Data Service] Successfully deleted corrupt database');
            resolve();
          };
          deleteRequest.onerror = () => {
            console.error(
              '[Data Service] Failed to delete database:',
              deleteRequest.error
            );
            reject(
              new Error(
                `Failed to delete corrupt database: ${deleteRequest.error}`
              )
            );
          };
          deleteRequest.onblocked = () => {
            console.error(
              '[Data Service] Database deletion blocked - may have open connections'
            );
            reject(new Error('Database deletion blocked by open connections'));
          };
        });
      }
    }

    await this.dataCoordinator.activate();

    this.isActivated = true;
  }

  async synchronize(): Promise<void> {
    if (!this.isActivated) {
      throw new Error(
        'Data service: synchronize cannot be called prior to activate'
      );
    }

    const remotePaletteRecords = await this.getPalettesFromRemote();
    const colorHistoryPalettes = this.store.cache.query<Palette[]>((q) =>
      q
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: true })
    );

    // Ensure that there is one, and only one, palette marked as isColorHistory.
    // - If there are none, create one.
    // - If there are more than one, remove extras, favoring the remote palette.
    if (colorHistoryPalettes.length === 1) {
      this.colorHistory = colorHistoryPalettes[0];
    } else if (colorHistoryPalettes.length === 0) {
      this.colorHistory = await this.store.addRecord<Palette>({
        type: 'palette',
        createdAt: new Date(),
        colorOrder: [],
        isColorHistory: true,
        isFavorite: false,
        isLocked: false,
        selectedColorIndex: 0,
      });
    } else if (colorHistoryPalettes.length > 1) {
      const remoteColorHistoryPalette = remotePaletteRecords.find(
        (p) => p.attributes?.['isColorHistory']
      );

      const preferredColorHistoryPaletteId =
        remoteColorHistoryPalette?.id ?? colorHistoryPalettes[0]?.id;

      const duplicateColorHistoryPalettes: Palette[] = [];

      for (const p of colorHistoryPalettes) {
        if (p.id === preferredColorHistoryPaletteId) {
          this.colorHistory = p;
        } else {
          duplicateColorHistoryPalettes.push(p);
        }
      }

      await this.store.update((t) =>
        duplicateColorHistoryPalettes.map((p) => t.removeRecord(p))
      );
    }
  }

  async reset(): Promise<void> {
    this.colorHistory = undefined;
    await this.dataCoordinator.getSource<IndexedDBSource>('backup').reset();
    await this.store.reset();
  }

  private async getRecordsFromBackup(): Promise<InitializedRecord[]> {
    const backup = this.dataCoordinator.getSource<IndexedDBSource>('backup');
    const records = await backup.query<InitializedRecord[]>((q) =>
      q.findRecords()
    );

    if (records?.length > 0) {
      // If a data migration has been loaded that requires the recreation of
      // inverse relationships, this flag will be set as part of the
      // migration. In order to recreate the inverse relationships, the data
      // will simply be reloaded into the backup db.
      // TODO: This is a bit of a hack that should be replaced with better
      // support for migrations in `IndexedDBCache` in `@orbit/indexeddb`.

      if (
        // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
        // prettier-ignore
        backup.recreateInverseRelationshipsOnLoad
      ) {
        // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
        // prettier-ignore
        backup.recreateInverseRelationshipsOnLoad = false;
        await backup.sync((t) => records.map((r) => t.addRecord(r)));
      }

      return records;
    } else {
      return [];
    }
  }

  private async getPalettesFromRemote(): Promise<InitializedRecord[]> {
    if (this.session.isAuthenticated) {
      const remote = this.dataCoordinator.getSource<JSONAPISource>('remote');
      const remotePaletteRecords = await remote.query<InitializedRecord[]>(
        (q) => q.findRecords('palette'),
        { include: ['colors'] }
      );

      if (remotePaletteRecords?.length > 0) {
        return remotePaletteRecords;
      } else {
        // If there is no remote data, sync all local data to remote. This
        // should be a one-time operation that will happen on initial login
        // after signing up.
        let colors = this.store.source.cache.query<InitializedRecord[]>((q) =>
          q.findRecords('color')
        );
        let palettes = this.store.source.cache.query<InitializedRecord[]>((q) =>
          q.findRecords('palette')
        );

        // Add colors first, then palettes, then relationships between them
        // (TODO: use atomic operations if available).
        const paletteColors: {
          palette: RecordIdentity;
          colors: RecordIdentity[];
        }[] = [];

        colors = colors.map((c) => {
          const { id, type, attributes } = c;

          return { id, type, attributes };
        });
        palettes = palettes.map((p) => {
          const { id, type, attributes, relationships } = p;

          if (relationships?.['colors']?.data) {
            paletteColors.push({
              palette: p,
              colors: relationships['colors'].data as RecordIdentity[],
            });
          }

          return { id, type, attributes };
        });

        if (colors.length > 0) {
          await remote.update<InitializedRecord[]>(
            (t) => colors.map((r) => t.addRecord(r)),
            { parallelRequests: true }
          );
        }

        if (palettes.length > 0) {
          await remote.update<InitializedRecord[]>(
            (t) => palettes.map((r) => t.addRecord(r)),
            { parallelRequests: true }
          );
        }

        if (paletteColors.length > 0) {
          await remote.update<InitializedRecord[]>(
            (t) =>
              paletteColors.map((p) =>
                t.replaceRelatedRecords(p.palette, 'colors', p.colors)
              ),
            { parallelRequests: true }
          );
        }

        // Re-fetch palettes and colors from remote
        return remote.query<InitializedRecord[]>(
          (q) => q.findRecords('palette'),
          { include: ['colors'] }
        );
      }
    } else {
      return [];
    }
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    data: DataService;
  }
}
