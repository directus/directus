import api from "@/api"
import { addRelatedPrimaryKeyToFields } from "@/utils/add-related-primary-key-to-fields"
import { getEndpoint } from "@/utils/get-endpoint"
import { unexpectedError } from "@/utils/unexpected-error"
import { merge } from "lodash"
import { stringify } from "querystring"
import { computed, ref, Ref, watch } from "vue"
import { RelationM2A } from "./use-relation-m2a"
import { RelationM2M } from "./use-relation-m2m"
import { RelationO2M } from "./use-relation-o2m"

type Item = {
    create: Record<string, any>[],
    update: (Record<string, any> | string | number)[],
    delete: (string | number)[],
}

export type RelationQueryMultiple = {
    page: number,
    limit: number,
    fields: string[]
}

export function useRelationMultiple(value: Ref<Item>, previewQuery: Ref<RelationQueryMultiple>, relation: Ref<RelationM2A | RelationM2M | RelationO2M | undefined>, itemId: Ref<string | number | null>) {

    let loading = ref(false)
    let displayItems = ref<Record<string, any>[]>([])
    let existingItemCount = ref(0)
    let totalItemCount = ref(0)

    watch(value, updateDisplayItems, { immediate: true })

    return { create, update, remove, displayItems, totalItemCount }

    function create(item: Record<string, any>) {
        value.value.create.push(item)
    }
    function update(item: Record<string, any> | string | number, index?: number) {
        if(index === undefined) {
            value.value.update.push(item)
        } else {
            value.value.update.splice(index, 1, item)
        }
    }
    function remove(identifier: Record<string, any> | number | string, where: 'create' | 'update' | 'delete') {
        if(typeof identifier === 'object') {
            
        }
    }

    async function updateDisplayItems() {
        if(!relation.value) return

        let targetCollection: string
        let targetPKField: string
        let reverseJunctionField: string
        const fields = new Set(previewQuery.value.fields)

        switch(relation.value.type) {
            case 'm2a':
                targetCollection = relation.value.junctionCollection.collection
                targetPKField = relation.value.junctionPrimaryKeyField.field
                reverseJunctionField = relation.value.reverseJunctionField.field
                fields.add(relation.value.junctionPrimaryKeyField.field)
                fields.add(relation.value.collectionField.field)
                fields.add(relation.value.junctionField.field)
                break
            case 'm2m':
                targetCollection = relation.value.junctionCollection.collection
                targetPKField = relation.value.junctionPrimaryKeyField.field
                reverseJunctionField = relation.value.reverseJunctionField.field
                fields.add(relation.value.junctionPrimaryKeyField.field)
                fields.add(`${relation.value.junctionField.field}.${relation.value.relatedPrimaryKeyField.field}`)
                break
            case 'o2m':
                targetCollection = relation.value.relatedCollection.collection
                targetPKField = relation.value.relatedPrimaryKeyField.field
                reverseJunctionField = relation.value.reverseJunctionField.field
                fields.add(relation.value.relatedPrimaryKeyField.field)
                break
        }

        try {
            loading.value = true

            await updateItemCount(targetCollection, targetPKField, reverseJunctionField)

            const response = await api.get(getEndpoint(targetCollection), {
                params: {
                    fields: fields,
                    filter: {
                        [reverseJunctionField]: itemId.value
                    },
                    page: previewQuery.value.page,
                    limit: previewQuery.value.limit
                },
            });

            let items: Record<string, any>[] = response.data.data.map((item: Record<string, any>) => {
                const edits = value.value.update.find(edit => typeof edit === 'object' && edit[targetPKField] === item[targetPKField])

                return merge(item, edits ?? {})
            })
            const createdStart = Math.max(previewQuery.value.page * previewQuery.value.limit - totalItemCount.value, 0)
            const createdEnd = Math.min(createdStart + previewQuery.value.limit, value.value.create.length)

            items.push(...value.value.create.slice(createdStart, createdEnd))

            displayItems.value = items

        } catch (err: any) {
            unexpectedError(err);
        } finally {
            loading.value = false;
        }

    }
    async function updateItemCount(collection: string, pkField: string, reverseJunctionField: string) {
        const response = await api.get(getEndpoint(collection), {
            params: {
                aggregate: {
                    count: pkField
                },
                filter: {
                    [reverseJunctionField]: itemId.value
                },
            },
        });

        existingItemCount.value = response.data.data[0].count[pkField]
        totalItemCount.value = existingItemCount.value + value.value.create.length + value.value.update.length
    }
}