import { getOwner } from '@ember/application';

import { applyStandardSourceInjections } from 'ember-orbit';

import type { InitializedRecord, RecordSchema } from '@orbit/records';
import { SupabaseSource as BaseSupabaseSource } from 'orbit-supabase';

import type SessionService from '../services/session.ts';
import type SupabaseService from '../services/supabase.ts';

interface SupabaseSourceInjections {
  schema: RecordSchema;
  name?: string;
  autoActivate?: boolean;
}

export class SupabaseSource extends BaseSupabaseSource {
  constructor(injections: SupabaseSourceInjections) {
    const owner = getOwner(injections);
    const supabaseService = owner?.lookup(
      'service:supabase'
    ) as SupabaseService;
    const session = owner?.lookup('service:session') as SessionService;

    super({
      ...injections,
      supabase: supabaseService.client,
      getUserId: () => session.data?.authenticated?.userId ?? null,
      typeMap: {
        palette: {
          tableName: 'palettes',
          attributes: {
            createdAt: { column: 'created_at' },
            updatedAt: { column: 'updated_at' },
            isColorHistory: { column: 'is_color_history' },
            isFavorite: { column: 'is_favorite' },
            isLocked: { column: 'is_locked' },
            selectedColorIndex: { column: 'selected_color_index' },
            index: { column: 'sort_index' },
            colorOrder: { column: 'color_order' },
          },
          relationships: {
            colors: {
              type: 'hasMany',
              foreignKey: 'palette_id',
              inverseType: 'color',
            },
          },
          rls: {
            enabled: true,
            userIdColumn: 'user_id',
          },
        },
        color: {
          tableName: 'colors',
          attributes: {
            createdAt: { column: 'created_at' },
            updatedAt: { column: 'updated_at' },
          },
          relationships: {
            palette: {
              type: 'hasOne',
              foreignKey: 'palette_id',
              inverseType: 'palette',
            },
          },
          rls: {
            enabled: true,
            userIdColumn: 'user_id',
          },
        },
      },
    });
  }
}

export default {
  create(
    injections: SupabaseSourceInjections = { schema: {} as RecordSchema }
  ) {
    applyStandardSourceInjections(injections);

    injections.name = 'remote';
    injections.autoActivate = false;

    return new SupabaseSource(injections);
  },
};
