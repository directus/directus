import { describe, expectTypeOf, test } from 'vitest';
import { createDirectus, readItems, rest } from '../src/index.js';
import type { CollectionA, CollectionB, TestSchema } from './schema.js';

describe('Test Relational return typing', () => {

    test('Flat relational ID #23545', () => {
        const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

        const _itemFlatRelation = () => client.request(readItems('collection_a', {
            fields: ['m2o']
        }));

        type Item = Awaited<ReturnType<typeof _itemFlatRelation>>[0];
        
        const result: Item = {
            m2o: 123
        };

        type Expected = {
            m2o: Exclude<CollectionA['m2o'], CollectionB>; // number
        };

        expectTypeOf(result).toEqualTypeOf<Expected>();
    });
    
    test('Nested relational ID #23545', () => {
        const client = createDirectus<TestSchema>('https://directus.example.com').with(rest());

        const _itemNestedRelation = () => client.request(readItems('collection_a', {
            fields: [
                { 'm2o': ['id'] }
            ]
        }));

        type Item = Awaited<ReturnType<typeof _itemNestedRelation>>[0];

        const result: Item = {
            m2o: {
                id: 123
            }
        };

        type Expected = {
            m2o: Pick<CollectionB, "id">
        };

        expectTypeOf(result).toEqualTypeOf<Expected>();
    });
});