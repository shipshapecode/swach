import { getOwner } from '@ember/application';

import { applyStandardSourceInjections } from 'ember-orbit';

import { Source } from '@orbit/source';
import { buildSerializerSettingsFor } from '@orbit/serializers';

export default {
  create(injections = {}) {
    applyStandardSourceInjections(injections);

    const app = getOwner(injections);
    const session = app.lookup('service:session');
    const supabaseService = app.lookup('service:supabase');

    class SupabaseSource extends Source {
      constructor() {
        super(injections);
        this.supabase = supabaseService.client;
      }

      async pull(transformOrOperations) {
        if (!session.isAuthenticated) {
          throw new Error('Remote requests require authentication');
        }

        // For now, we'll implement basic query functionality
        // This would need to be expanded based on the specific Orbit.js operations
        const operations = Array.isArray(transformOrOperations)
          ? transformOrOperations
          : [transformOrOperations];

        const results = [];

        for (const operation of operations) {
          if (operation.op === 'findRecords') {
            const records = await this.findRecords(
              operation.type,
              operation.options
            );
            results.push(...records);
          } else if (operation.op === 'findRecord') {
            const record = await this.findRecord(
              operation.type,
              operation.id,
              operation.options
            );
            if (record) results.push(record);
          }
        }

        return results;
      }

      async push(transformOrOperations) {
        if (!session.isAuthenticated) {
          throw new Error('Remote requests require authentication');
        }

        const operations = Array.isArray(transformOrOperations)
          ? transformOrOperations
          : [transformOrOperations];

        const results = [];

        for (const operation of operations) {
          if (operation.op === 'addRecord') {
            const record = await this.addRecord(
              operation.record,
              operation.options
            );
            results.push(record);
          } else if (operation.op === 'updateRecord') {
            const record = await this.updateRecord(
              operation.record,
              operation.options
            );
            results.push(record);
          } else if (operation.op === 'removeRecord') {
            await this.removeRecord(operation.record, operation.options);
          }
        }

        return results;
      }

      async findRecords(type, options = {}) {
        const tableName = this.pluralize(type);
        let query = this.supabase.from(tableName).select('*');

        if (options.include) {
          // Handle relationships - this would need more sophisticated handling
          for (const relation of options.include) {
            query = query.select(`${relation}(*)`);
          }
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Supabase query error: ${error.message}`);
        }

        return data.map((record) => this.transformToOrbitRecord(record, type));
      }

      async findRecord(type, id, options = {}) {
        const tableName = this.pluralize(type);
        let query = this.supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (options.include) {
          for (const relation of options.include) {
            query = query.select(`${relation}(*)`);
          }
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Supabase query error: ${error.message}`);
        }

        return this.transformToOrbitRecord(data, type);
      }

      async addRecord(record, options = {}) {
        const tableName = this.pluralize(record.type);
        const supabaseRecord = this.transformFromOrbitRecord(record);

        const { data, error } = await this.supabase
          .from(tableName)
          .insert(supabaseRecord)
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase insert error: ${error.message}`);
        }

        return this.transformToOrbitRecord(data, record.type);
      }

      async updateRecord(record, options = {}) {
        const tableName = this.pluralize(record.type);
        const supabaseRecord = this.transformFromOrbitRecord(record);

        const { data, error } = await this.supabase
          .from(tableName)
          .update(supabaseRecord)
          .eq('id', record.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase update error: ${error.message}`);
        }

        return this.transformToOrbitRecord(data, record.type);
      }

      async removeRecord(record, options = {}) {
        const tableName = this.pluralize(record.type);

        const { error } = await this.supabase
          .from(tableName)
          .delete()
          .eq('id', record.id);

        if (error) {
          throw new Error(`Supabase delete error: ${error.message}`);
        }
      }

      transformToOrbitRecord(supabaseRecord, type) {
        return {
          id: supabaseRecord.id,
          type: this.singularize(type),
          attributes: this.extractAttributes(supabaseRecord, type),
          relationships: this.extractRelationships(supabaseRecord, type),
        };
      }

      transformFromOrbitRecord(orbitRecord) {
        const supabaseRecord = {
          id: orbitRecord.id,
          ...orbitRecord.attributes,
        };

        // Add user_id if authenticated
        if (this.supabase.auth.user) {
          supabaseRecord.user_id = this.supabase.auth.user.id;
        }

        return supabaseRecord;
      }

      extractAttributes(record, type) {
        const attributes = { ...record };

        // Remove Orbit.js specific fields and relationships
        delete attributes.id;
        delete attributes.created_at; // This is handled by Supabase
        delete attributes.user_id; // This is handled automatically

        // Handle type-specific attribute mapping
        if (type === 'palette') {
          return {
            name: attributes.name,
            isColorHistory: attributes.is_color_history,
            isFavorite: attributes.is_favorite,
            isLocked: attributes.is_locked,
            selectedColorIndex: attributes.selected_color_index,
            colorOrder: attributes.color_order,
            createdAt: attributes.created_at,
          };
        }

        if (type === 'color') {
          return {
            name: attributes.name,
            r: attributes.r,
            g: attributes.g,
            b: attributes.b,
            a: attributes.a,
            createdAt: attributes.created_at,
          };
        }

        return attributes;
      }

      extractRelationships(record, type) {
        const relationships = {};

        // Extract relationships based on type
        if (type === 'palette' && record.colors) {
          relationships.colors = {
            data: record.colors.map((color) => ({
              type: 'color',
              id: color.id,
            })),
          };
        }

        if (type === 'color' && record.palette_id) {
          relationships.palette = {
            data: { type: 'palette', id: record.palette_id },
          };
        }

        return relationships;
      }

      pluralize(word) {
        // Simple pluralization - could use ember-inflector if needed
        if (word.endsWith('y')) {
          return word.slice(0, -1) + 'ies';
        }
        return word + 's';
      }

      singularize(word) {
        // Simple singularization - could use ember-inflector if needed
        if (word.endsWith('ies')) {
          return word.slice(0, -3) + 'y';
        }
        if (word.endsWith('s')) {
          return word.slice(0, -1);
        }
        return word;
      }
    }

    injections.name = 'remote';
    injections.SourceClass = SupabaseSource;
    injections.autoActivate = false;

    return new SupabaseSource(injections);
  },
};
