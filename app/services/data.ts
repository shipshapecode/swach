import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { Store } from 'ember-orbit';
import Session from 'ember-simple-auth/services/session';

import { Coordinator } from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import JSONAPISource from '@orbit/jsonapi';
import { InitializedRecord, RecordIdentity } from '@orbit/records';

import Palette from 'swach/data-models/palette';

export default class DataService extends Service {
  @service dataCoordinator!: Coordinator;
  @service session!: Session;
  @service store!: Store;
  @tracked colorHistory: Palette | undefined;
  isActivated = false;

  backup = this.dataCoordinator.getSource<IndexedDBSource>('backup');
  remote = this.dataCoordinator.getSource<JSONAPISource>('remote');

  async activate(): Promise<void> {
    const records = await this.getRecordsFromBackup();

    if (records.length > 0) {
      await this.store.sync((t) => records.map((r) => t.addRecord(r)));
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
        selectedColorIndex: 0
      });
    } else if (colorHistoryPalettes.length > 1) {
      const remoteColorHistoryPalette = remotePaletteRecords.find(
        (p) => p.attributes?.isColorHistory
      );

      const preferredColorHistoryPaletteId =
        remoteColorHistoryPalette?.id ?? colorHistoryPalettes[0].id;

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
    await this.backup.reset();
    await this.store.reset();
  }

  private async getRecordsFromBackup(): Promise<InitializedRecord[]> {
    const records = await this.backup.query<InitializedRecord[]>((q) =>
      q.findRecords()
    );

    if (records?.length > 0) {
      // If a data migration has been loaded that requires the recreation of
      // inverse relationships, this flag will be set as part of the
      // migration. In order to recreate the inverse relationships, the data
      // will simply be reloaded into the backup db.
      // TODO: This is a bit of a hack that should be replaced with better
      // support for migrations in `IndexedDBCache` in `@orbit/indexeddb`.
      // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
      if (this.backup.recreateInverseRelationshipsOnLoad) {
        // @ts-expect-error This is a hacked property until we have a real one to use in ember-orbit
        this.backup.recreateInverseRelationshipsOnLoad = false;
        await this.backup.sync((t) => records.map((r) => t.addRecord(r)));
      }
      return records;
    } else {
      return [];
    }
  }

  private async getPalettesFromRemote(): Promise<InitializedRecord[]> {
    if (this.session.isAuthenticated) {
      const remotePaletteRecords = await this.remote.query<InitializedRecord[]>(
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
          if (relationships?.colors?.data) {
            paletteColors.push({
              palette: p,
              colors: relationships.colors.data as RecordIdentity[]
            });
          }
          return { id, type, attributes };
        });

        if (colors.length > 0) {
          await this.remote.update<InitializedRecord[]>(
            (t) => colors.map((r) => t.addRecord(r)),
            { parallelRequests: true }
          );
        }
        if (palettes.length > 0) {
          await this.remote.update<InitializedRecord[]>(
            (t) => palettes.map((r) => t.addRecord(r)),
            { parallelRequests: true }
          );
        }
        if (paletteColors.length > 0) {
          await this.remote.update<InitializedRecord[]>(
            (t) =>
              paletteColors.map((p) =>
                t.replaceRelatedRecords(p.palette, 'colors', p.colors)
              ),
            { parallelRequests: true }
          );
        }

        // Re-fetch palettes and colors from remote
        return this.remote.query<InitializedRecord[]>(
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
