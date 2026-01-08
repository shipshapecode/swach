import { module, test } from 'qunit';

import type { InitializedRecord } from '@orbit/records';

import { SupabaseSource } from 'Swach/data-sources/remote';

module('Unit | Data Source | remote', function () {
  test('transformPaletteToOrbit correctly maps all attributes', function (assert) {
    const mockSupabasePalette = {
      id: 'test-palette-id',
      user_id: 'test-user-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      name: 'Test Palette',
      is_color_history: false,
      is_favorite: true,
      is_locked: false,
      selected_color_index: 2,
      sort_index: 5,
      color_order: [
        { type: 'color', id: 'color-1' },
        { type: 'color', id: 'color-2' },
      ],
    };

    const mockColors = [
      {
        id: 'color-1',
        user_id: 'test-user-id',
        palette_id: 'test-palette-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        name: 'Red',
        r: 255,
        g: 0,
        b: 0,
        a: 1,
      },
      {
        id: 'color-2',
        user_id: 'test-user-id',
        palette_id: 'test-palette-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        name: 'Blue',
        r: 0,
        g: 0,
        b: 255,
        a: 1,
      },
    ];

    // Access the private method via reflection for testing
    // @ts-expect-error - accessing private method for testing
    const transformPaletteToOrbit = SupabaseSource.prototype.transformPaletteToOrbit;
    const result: InitializedRecord = transformPaletteToOrbit.call(
      {},
      mockSupabasePalette,
      mockColors
    );

    assert.strictEqual(result.id, 'test-palette-id', 'id is mapped correctly');
    assert.strictEqual(result.type, 'palette', 'type is set to palette');

    // Check attributes
    assert.strictEqual(
      result.attributes?.['createdAt'],
      '2024-01-01T00:00:00Z',
      'createdAt is mapped'
    );
    assert.strictEqual(
      result.attributes?.['updatedAt'],
      '2024-01-02T00:00:00Z',
      'updatedAt is mapped'
    );
    assert.strictEqual(
      result.attributes?.['name'],
      'Test Palette',
      'name is mapped'
    );
    assert.strictEqual(
      result.attributes?.['isColorHistory'],
      false,
      'isColorHistory is mapped'
    );
    assert.strictEqual(
      result.attributes?.['isFavorite'],
      true,
      'isFavorite is mapped'
    );
    assert.strictEqual(
      result.attributes?.['isLocked'],
      false,
      'isLocked is mapped'
    );
    assert.strictEqual(
      result.attributes?.['selectedColorIndex'],
      2,
      'selectedColorIndex is mapped'
    );
    assert.strictEqual(
      result.attributes?.['index'],
      5,
      'index (sort_index) is mapped'
    );
    assert.deepEqual(
      result.attributes?.['colorOrder'],
      [
        { type: 'color', id: 'color-1' },
        { type: 'color', id: 'color-2' },
      ],
      'colorOrder is mapped'
    );

    // Check relationships
    assert.deepEqual(
      result.relationships?.['colors']?.data,
      [
        { type: 'color', id: 'color-1' },
        { type: 'color', id: 'color-2' },
      ],
      'colors relationship is mapped'
    );
  });

  test('transformColorToOrbit correctly maps all attributes', function (assert) {
    const mockSupabaseColor = {
      id: 'color-1',
      user_id: 'test-user-id',
      palette_id: 'test-palette-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      name: 'Red',
      r: 255,
      g: 128,
      b: 64,
      a: 0.75,
    };

    // Access the private method via reflection for testing
    // @ts-expect-error - accessing private method for testing
    const transformColorToOrbit = SupabaseSource.prototype.transformColorToOrbit;
    const result: InitializedRecord = transformColorToOrbit.call(
      {},
      mockSupabaseColor
    );

    assert.strictEqual(result.id, 'color-1', 'id is mapped correctly');
    assert.strictEqual(result.type, 'color', 'type is set to color');

    // Check attributes
    assert.strictEqual(
      result.attributes?.['createdAt'],
      '2024-01-01T00:00:00Z',
      'createdAt is mapped'
    );
    assert.strictEqual(
      result.attributes?.['updatedAt'],
      '2024-01-02T00:00:00Z',
      'updatedAt is mapped'
    );
    assert.strictEqual(result.attributes?.['name'], 'Red', 'name is mapped');
    assert.strictEqual(result.attributes?.['r'], 255, 'r is mapped');
    assert.strictEqual(result.attributes?.['g'], 128, 'g is mapped');
    assert.strictEqual(result.attributes?.['b'], 64, 'b is mapped');
    assert.strictEqual(result.attributes?.['a'], 0.75, 'a is mapped');

    // Check relationships
    assert.deepEqual(
      result.relationships?.['palette']?.data,
      { type: 'palette', id: 'test-palette-id' },
      'palette relationship is mapped'
    );
  });

  test('transformFromOrbit correctly maps palette to Supabase format', function (assert) {
    const mockOrbitPalette: InitializedRecord = {
      id: 'test-palette-id',
      type: 'palette',
      attributes: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        name: 'Test Palette',
        isColorHistory: true,
        isFavorite: false,
        isLocked: true,
        selectedColorIndex: 3,
        index: 7,
        colorOrder: [{ type: 'color', id: 'color-1' }],
      },
      relationships: {
        colors: {
          data: [{ type: 'color', id: 'color-1' }],
        },
      },
    };

    // Mock the source with userId
    const mockSource = {
      userId: 'test-user-id',
    };

    // Access the private method via reflection for testing
    // @ts-expect-error - accessing private method for testing
    const transformFromOrbit = SupabaseSource.prototype.transformFromOrbit;
    const result = transformFromOrbit.call(mockSource, mockOrbitPalette);

    assert.strictEqual(result['id'], 'test-palette-id', 'id is mapped');
    assert.strictEqual(
      result['user_id'],
      'test-user-id',
      'user_id is added from session'
    );
    assert.strictEqual(result['name'], 'Test Palette', 'name is mapped');
    assert.strictEqual(
      result['is_color_history'],
      true,
      'is_color_history is mapped'
    );
    assert.strictEqual(
      result['is_favorite'],
      false,
      'is_favorite is mapped'
    );
    assert.strictEqual(result['is_locked'], true, 'is_locked is mapped');
    assert.strictEqual(
      result['selected_color_index'],
      3,
      'selected_color_index is mapped'
    );
    assert.strictEqual(result['sort_index'], 7, 'sort_index is mapped');
    assert.deepEqual(
      result['color_order'],
      [{ type: 'color', id: 'color-1' }],
      'color_order is mapped'
    );

    // updatedAt and createdAt should NOT be in the output (Supabase handles these)
    assert.notOk(result['created_at'], 'created_at is not set (Supabase handles it)');
    assert.notOk(result['updated_at'], 'updated_at is not set (Supabase handles it)');
  });

  test('transformFromOrbit correctly maps color to Supabase format', function (assert) {
    const mockOrbitColor: InitializedRecord = {
      id: 'color-1',
      type: 'color',
      attributes: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        name: 'Red',
        r: 200,
        g: 100,
        b: 50,
        a: 0.5,
      },
      relationships: {
        palette: {
          data: { type: 'palette', id: 'test-palette-id' },
        },
      },
    };

    // Mock the source with userId
    const mockSource = {
      userId: 'test-user-id',
    };

    // Access the private method via reflection for testing
    // @ts-expect-error - accessing private method for testing
    const transformFromOrbit = SupabaseSource.prototype.transformFromOrbit;
    const result = transformFromOrbit.call(mockSource, mockOrbitColor);

    assert.strictEqual(result['id'], 'color-1', 'id is mapped');
    assert.strictEqual(
      result['user_id'],
      'test-user-id',
      'user_id is added from session'
    );
    assert.strictEqual(
      result['palette_id'],
      'test-palette-id',
      'palette_id is mapped from relationship'
    );
    assert.strictEqual(result['name'], 'Red', 'name is mapped');
    assert.strictEqual(result['r'], 200, 'r is mapped');
    assert.strictEqual(result['g'], 100, 'g is mapped');
    assert.strictEqual(result['b'], 50, 'b is mapped');
    assert.strictEqual(result['a'], 0.5, 'a is mapped');

    // updatedAt and createdAt should NOT be in the output (Supabase handles these)
    assert.notOk(result['created_at'], 'created_at is not set (Supabase handles it)');
    assert.notOk(result['updated_at'], 'updated_at is not set (Supabase handles it)');
  });
});
