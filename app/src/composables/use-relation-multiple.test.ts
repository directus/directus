import { test, expect, vi } from 'vitest';
import { computed, defineComponent, h, ref, toRefs } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useSync } from '@directus/shared/composables';
import { RelationO2M } from './use-relation-o2m';

const relationO2M: RelationO2M = {
    relatedCollection: {
        name: 'Worker',
        collection: 'worker',
        icon: 'user',
        meta: null,
        schema: null,
        type: 'table'
    },
    relatedPrimaryKeyField: {
        name: 'ID',
        collection: 'worker',
        field: 'id',
        type: 'integer',
        meta: null,
        schema: null
    },
    reverseJunctionField: {
        name: 'Facility',
        collection: 'facility',
        field: 'facility',
        type: 'integer',
        meta: null,
        schema: null
    },
    relation: {
        collection: 'worker',
        field: 'facility',
        related_collection: 'facility',
        meta: null,
        schema: null
    },
    type: 'o2m',
}

const workerData = [
    {id: 1, name: 'test', facility: 1},
    {id: 2, name: 'test2', facility: 1},
    {id: 3, name: 'test3', facility: 1},
    {id: 4, name: 'test4', facility: 1},
]

const TestComponent = (run: () => any) => defineComponent({
    props: ['value','relation','id'],
    emits: ['update:value'],
    render: ({displayItems}: {displayItems: any}) => h('div', JSON.stringify(displayItems)),
    setup(props, {emit}) {
        const value = useSync(props, 'value', emit);
        const {relation, id} = toRefs(props)

        const query = computed<RelationQueryMultiple>(() => {
            const q: RelationQueryMultiple = {
                limit: 15,
                page: 1,
                fields: ['id'],
            };

            return q;
        });

        const { displayItems, create } = useRelationMultiple(value, query, relation, id)

        create({
            id: '1',
            name: 'test',
        })

        return run(props)
    },
});

/*
Facility                 Worker
┌─────────────┐          ┌─────────────────┐
│id: number   │◄────┐    │id: number       │
│name: string │     │    │name: string     │
│workers      │     └────┤facility: number │
│             │          │                 │
│             │          │                 │
└─────────────┘          └─────────────────┘
 */

test('composable on o2m', async () => {

    vi.mock('@/api', () => {
        return {default: {
            get: (path: string, {params}: {params: Record<string, any>}) => {
                console.log("GET:", path, params);
                if(path === '/items/worker' && params?.aggregate?.count === 'id') {
                    return Promise.resolve({data: {
                        data: [{count: {id: workerData.length}}],
                    }})
                }

                return Promise.resolve({
                    data: {
                        data: workerData,
                    },
                })
            },
        }}
    })

    vi.mock('@/utils/unexpected-error', () => {
        return {
            unexpectedError: (error: any) => {
                console.error(error)
                throw error;
            },
        }
    })

	const wrapper = mount(TestComponent, {
        props: { relation: relationO2M, value: [], id: 1 },
    });

    await flushPromises()

    expect(wrapper.exists()).toBe(true);

	expect(wrapper.text()).toBe(JSON.stringify([...workerData, {id: 1, name: 'test', $type: 'created', $index: 0}]));
});
