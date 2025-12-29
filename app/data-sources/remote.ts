import { getOwner } from '@ember/application';

import { applyStandardSourceInjections } from 'ember-orbit';

import { Orbit } from '@orbit/core';
import { Source } from '@orbit/data';
import type {
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  RecordQuery,
  RecordSchema,
  RecordTransformResult,
} from '@orbit/records';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import type SessionService from '../services/session.ts';
import type SupabaseService from '../services/supabase.ts';

const { assert } = Orbit;

interface SupabasePalette {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  is_color_history: boolean;
  is_favorite: boolean;
  is_locked: boolean;
  selected_color_index: number;
  color_order: { type: string; id: string }[];
}

interface SupabaseColor {
  id: string;
  user_id: string;
  palette_id: string;
  created_at: string;
  updated_at: string;
  name: string | null;
  r: number;
  g: number;
  b: number;
  a: number;
}

interface SupabaseSourceInjections {
  schema: RecordSchema;
  name?: string;
  autoActivate?: boolean;
}

export class SupabaseSource extends Source {
  private supabaseService: SupabaseService;
  private session: SessionService;
  private realtimeChannel: RealtimeChannel | null = null;

  constructor(injections: SupabaseSourceInjections) {
    super(injections);

    const owner = getOwner(injections);
    this.supabaseService = owner?.lookup('service:supabase') as SupabaseService;
    this.session = owner?.lookup('service:session') as SessionService;
  }

  get supabase(): SupabaseClient {
    return this.supabaseService.client;
  }

  get isAuthenticated(): boolean {
    return this.session.isAuthenticated;
  }

  get userId(): string | null {
    return this.session.data?.authenticated?.userId ?? null;
  }

  // Public method to query all palettes with colors
  async queryPalettes(): Promise<InitializedRecord[]> {
    if (!this.isAuthenticated) {
      throw new Error('Remote requests require authentication');
    }
    return this.findRecords('palette');
  }

  // Public method to add a record
  async addRecord(record: InitializedRecord): Promise<InitializedRecord> {
    if (!this.isAuthenticated) {
      throw new Error('Remote requests require authentication');
    }
    return this._addRecord(record);
  }

  // Query implementation
  async _query(
    query: RecordQuery,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Record<string, unknown>
  ): Promise<RecordTransformResult<InitializedRecord | InitializedRecord[]>> {
    if (!this.isAuthenticated) {
      throw new Error('Remote requests require authentication');
    }

    const expressions = Array.isArray(query.expressions)
      ? query.expressions
      : [query.expressions];
    const results: InitializedRecord[] = [];

    for (const expression of expressions) {
      if (expression.op === 'findRecords') {
        const type = expression.type as string;
        const records = await this.findRecords(type);
        results.push(...records);
      } else if (expression.op === 'findRecord') {
        const record = expression.record;
        const result = await this.findRecord(record.type, record.id);
        if (result) results.push(result);
      }
    }

    return results;
  }

  // Update implementation
  async _update(
    operations: RecordOperation | RecordOperation[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Record<string, unknown>
  ): Promise<RecordTransformResult<InitializedRecord | InitializedRecord[]>> {
    if (!this.isAuthenticated) {
      throw new Error('Remote requests require authentication');
    }

    const ops = Array.isArray(operations) ? operations : [operations];
    const results: InitializedRecord[] = [];

    for (const op of ops) {
      switch (op.op) {
        case 'addRecord': {
          const record = await this._addRecord(op.record);
          results.push(record);
          break;
        }
        case 'updateRecord': {
          const record = await this.updateRecord(op.record);
          results.push(record);
          break;
        }
        case 'removeRecord': {
          await this.removeRecord(op.record);
          break;
        }
        case 'replaceRelatedRecords': {
          await this.replaceRelatedRecords(
            op.record,
            op.relationship,
            op.relatedRecords
          );
          break;
        }
        case 'replaceRelatedRecord': {
          await this.replaceRelatedRecord(
            op.record,
            op.relationship,
            op.relatedRecord
          );
          break;
        }
        case 'addToRelatedRecords': {
          await this.addToRelatedRecords(
            op.record,
            op.relationship,
            op.relatedRecord
          );
          break;
        }
        case 'removeFromRelatedRecords': {
          await this.removeFromRelatedRecords(
            op.record,
            op.relationship,
            op.relatedRecord
          );
          break;
        }
      }
    }

    return results;
  }

  // Find all records of a type
  private async findRecords(type: string): Promise<InitializedRecord[]> {
    const tableName = this.getTableName(type);

    if (type === 'palette') {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*, colors:colors(*)')
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Supabase query error: ${error.message}`);

      return (data as (SupabasePalette & { colors: SupabaseColor[] })[]).map(
        (p) => this.transformPaletteToOrbit(p, p.colors)
      );
    } else {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Supabase query error: ${error.message}`);

      return (data as SupabaseColor[]).map((c) =>
        this.transformColorToOrbit(c)
      );
    }
  }

  // Find a single record
  private async findRecord(
    type: string,
    id: string
  ): Promise<InitializedRecord | null> {
    const tableName = this.getTableName(type);

    if (type === 'palette') {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*, colors:colors(*)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return this.transformPaletteToOrbit(
        data as SupabasePalette,
        (data as unknown as { colors: SupabaseColor[] }).colors
      );
    } else {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return this.transformColorToOrbit(data as SupabaseColor);
    }
  }

  // Add a record (internal implementation)
  private async _addRecord(
    record: InitializedRecord
  ): Promise<InitializedRecord> {
    const tableName = this.getTableName(record.type);
    const supabaseRecord = this.transformFromOrbit(record);

    const { data, error } = await this.supabase
      .from(tableName)
      .insert(supabaseRecord)
      .select()
      .single();

    if (error) throw new Error(`Supabase insert error: ${error.message}`);

    return record.type === 'palette'
      ? this.transformPaletteToOrbit(data as SupabasePalette, [])
      : this.transformColorToOrbit(data as SupabaseColor);
  }

  // Update a record
  private async updateRecord(
    record: InitializedRecord
  ): Promise<InitializedRecord> {
    const tableName = this.getTableName(record.type);
    const supabaseRecord = this.transformFromOrbit(record);

    // Remove id from update payload
    const { id, ...updateData } = supabaseRecord;

    const { data, error } = await this.supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Supabase update error: ${error.message}`);

    return record.type === 'palette'
      ? this.transformPaletteToOrbit(data as SupabasePalette, [])
      : this.transformColorToOrbit(data as SupabaseColor);
  }

  // Remove a record
  private async removeRecord(record: RecordIdentity): Promise<void> {
    const tableName = this.getTableName(record.type);

    const { error } = await this.supabase
      .from(tableName)
      .delete()
      .eq('id', record.id);

    if (error) throw new Error(`Supabase delete error: ${error.message}`);
  }

  // Replace related records (for palette.colors)
  private async replaceRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ): Promise<void> {
    if (record.type === 'palette' && relationship === 'colors') {
      // Update all colors to point to this palette
      for (const color of relatedRecords) {
        const { error } = await this.supabase
          .from('colors')
          .update({ palette_id: record.id })
          .eq('id', color.id);

        if (error) throw new Error(`Supabase update error: ${error.message}`);
      }
    }
  }

  // Replace a single related record (for color.palette)
  private async replaceRelatedRecord(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ): Promise<void> {
    if (record.type === 'color' && relationship === 'palette') {
      const { error } = await this.supabase
        .from('colors')
        .update({ palette_id: relatedRecord?.id ?? null })
        .eq('id', record.id);

      if (error) throw new Error(`Supabase update error: ${error.message}`);
    }
  }

  // Add to related records
  private async addToRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): Promise<void> {
    if (record.type === 'palette' && relationship === 'colors') {
      const { error } = await this.supabase
        .from('colors')
        .update({ palette_id: record.id })
        .eq('id', relatedRecord.id);

      if (error) throw new Error(`Supabase update error: ${error.message}`);
    }
  }

  // Remove from related records
  private async removeFromRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): Promise<void> {
    if (record.type === 'palette' && relationship === 'colors') {
      // Set palette_id to null (orphan the color)
      const { error } = await this.supabase
        .from('colors')
        .update({ palette_id: null })
        .eq('id', relatedRecord.id);

      if (error) throw new Error(`Supabase update error: ${error.message}`);
    }
  }

  // Transform Supabase palette to Orbit record
  private transformPaletteToOrbit(
    palette: SupabasePalette,
    colors: SupabaseColor[]
  ): InitializedRecord {
    return {
      id: palette.id,
      type: 'palette',
      attributes: {
        createdAt: palette.created_at,
        name: palette.name,
        isColorHistory: palette.is_color_history,
        isFavorite: palette.is_favorite,
        isLocked: palette.is_locked,
        selectedColorIndex: palette.selected_color_index,
        colorOrder: palette.color_order ?? [],
      },
      relationships: {
        colors: {
          data: colors.map((c) => ({ type: 'color', id: c.id })),
        },
      },
    };
  }

  // Transform Supabase color to Orbit record
  private transformColorToOrbit(color: SupabaseColor): InitializedRecord {
    return {
      id: color.id,
      type: 'color',
      attributes: {
        createdAt: color.created_at,
        name: color.name,
        r: color.r,
        g: color.g,
        b: color.b,
        a: color.a,
      },
      relationships: {
        palette: {
          data: color.palette_id
            ? { type: 'palette', id: color.palette_id }
            : null,
        },
      },
    };
  }

  // Transform Orbit record to Supabase format
  private transformFromOrbit(
    record: InitializedRecord
  ): Record<string, unknown> {
    assert('User ID is required for remote operations', !!this.userId);

    const base: Record<string, unknown> = {
      id: record.id,
      user_id: this.userId,
    };

    if (record.type === 'palette') {
      const attrs = record.attributes ?? {};
      return {
        ...base,
        name: attrs['name'] ?? null,
        is_color_history: attrs['isColorHistory'] ?? false,
        is_favorite: attrs['isFavorite'] ?? false,
        is_locked: attrs['isLocked'] ?? false,
        selected_color_index: attrs['selectedColorIndex'] ?? 0,
        color_order: attrs['colorOrder'] ?? [],
      };
    } else if (record.type === 'color') {
      const attrs = record.attributes ?? {};
      const paletteRel = record.relationships?.['palette']?.data as
        | RecordIdentity
        | undefined;
      return {
        ...base,
        palette_id: paletteRel?.id ?? null,
        name: attrs['name'] ?? null,
        r: attrs['r'] ?? 0,
        g: attrs['g'] ?? 0,
        b: attrs['b'] ?? 0,
        a: attrs['a'] ?? 1,
      };
    }

    return base;
  }

  // Get table name from type
  private getTableName(type: string): string {
    return type === 'palette' ? 'palettes' : 'colors';
  }

  // Set up real-time subscriptions
  setupRealtimeSync(onUpdate: (type: string, payload: unknown) => void): void {
    if (this.realtimeChannel) {
      void this.supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'palettes' },
        (payload) => onUpdate('palette', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'colors' },
        (payload) => onUpdate('color', payload)
      )
      .subscribe();
  }

  // Tear down real-time subscriptions
  teardownRealtimeSync(): void {
    if (this.realtimeChannel) {
      void this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
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
