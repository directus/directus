import { Ref, watch } from "vue"
import { RelationM2A } from "./use-relation-m2a"
import { RelationM2M } from "./use-relation-m2m"
import { RelationO2M } from "./use-relation-o2m"

type Item = {
    create: Record<string, any>[],
    update: (Record<string, any> | string | number)[],
    delete: (string | number)[],
}

type Query = {
    page: number,
    sort: string,
    filter: string,
    search: string
    fields: string[]
}

export function useRelationMultiple(value: Ref<Item>, relation: Ref<RelationM2A | RelationM2M | RelationO2M | undefined>) {

    let displayItems: Record<string, any>[] = []
    let totalItems = 0

    watch(value, getDisplayItems, { immediate: true })

    return { create, update, remove, displayItems, totalItems }

    function create(item: Record<string, any>) {
        const pkField = relation.value

        const existing = value.value.create.find(i => i[] === item.id)
        value.value.create.push(item)
    }
    function update(index: number, item: Record<string, any>) {
        
    }
    function remove(index: number) {

    }

    async function getDisplayItems() {

    }
    async function getItemCount() {

    }
}