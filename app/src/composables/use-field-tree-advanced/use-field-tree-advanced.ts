import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores/';
import { Relation } from '@/types';
import { getRelationType } from '@/utils/get-relation-type';
import { cloneDeep, get, orderBy, set } from 'lodash';
import { computed, Ref, ref, ComputedRef } from 'vue';

type FieldTree = Record<string, FieldInfo>;
type FieldInfo = { name: string, field: string; children: FieldTree; group?: string, collection: string }
type FieldOption = { name: string, field: string; key: string; children?: FieldOption[]; group?: string };

export default function useFieldTreeAdvanced(
	collection: Ref<string | null>,
) {
	const fieldsStore = useFieldsStore();
	const collectionsStore = useCollectionsStore();
	const relationsStore = useRelationsStore();

	const tree = ref<FieldTree>({})

    if(collection.value) {
        tree.value = getFieldTreeForCollection(collection.value)
    }

    const visitedRelations = computed(() => getVisitedRelations(tree.value))

    Object.values(tree.value).forEach(value => {
        loadFieldRelations(value.field)
    })

    const treeList = computed(() => treeToList(tree.value))

	return { tree,treeList, loadFieldRelations, getField, treeToList, getVisitedRelations, visitedRelations };

    function treeToList(tree: FieldTree, parentName?: string): FieldOption[] {
        return Object.values(tree).map(field => {
            const key = parentName ? `${parentName}.${field.field}` : field.field
            const children = treeToList(field.children, key)
            return {
                name: field.name,
                key,
                field: field.field,
                group: field.group,
                children: children.length > 0? children : undefined
            }
        })
    }

    function getFieldTreeForCollection(collection: string) {
        return fieldsStore.getFieldsForCollectionAlphabetical(collection).reduce((acc, field) => {
            acc[field.field] = {
                field: field.field,
                name: field.name,
                collection: field.collection,
                children: {}
            }
            return acc
        }, {} as FieldTree)
    }

    function getField(fieldPath: string): FieldOption | undefined {
        const path = fieldPath.split('.')

        function getFieldRecursive(path: string[], list: FieldOption[]): FieldOption | undefined {
            const targetField = path.shift()
            const subList = list.find(el => el.field === targetField)
            if(subList === undefined || subList.children === undefined) return undefined
            if(path.length === 0) return subList
            return getFieldRecursive(path, subList.children)
        }

        return getFieldRecursive(path, treeList.value)
    }


    function loadFieldRelations(fieldPath: string) {
        const path = fieldPath.replaceAll('.','.children.')
        const field = get(tree.value, path) as FieldInfo | undefined
        if (field === undefined) return 

        const relations = relationsStore.getRelationsForField(field.collection, field.field)
        if (relations.length === 0) return
        
        relations.forEach(relation => {
            if(relationVisited(relation)) return

            const relationType = getRelationType({relation, collection: field.collection, field: field.field})
            if(relation.meta === undefined) return

            if(relationType === 'o2m') {
                set(tree.value,  `${path}.children`, getFieldTreeForCollection(relation.meta.many_collection))
            } else if(relationType === 'm2o') {
                set(tree.value, `${path}.children`, getFieldTreeForCollection(relation.meta.one_collection))
            }
        })
    }

    type SimpleRelation = [string, string, string, string]

    function relationVisited(relation: Relation) {
        if(relation.meta === undefined) return
        const simpleRelation: SimpleRelation = [relation.meta.many_collection, relation.meta.one_collection, relation.meta.many_field, relation.meta.one_field || '']
        return visitedRelations.value.find(relation => relationEquals(simpleRelation, relation)) !== undefined
    }

    function relationEquals(rel1: SimpleRelation, rel2: SimpleRelation) {
        for(let rel of rel1) {
            if(rel2.includes(rel) === false) return false
        }
        return true
    }

    function getVisitedRelations(tree: FieldTree) {
        

        function getVisitedRelationsR(tree: FieldTree) {
            
            const relations: SimpleRelation[] = []
    
            Object.values(tree).forEach(value => {
                Object.values(value.children).forEach(value2 => {
                    relations.push([value.collection, value.field, value2.collection, value2.field])
                })
                getVisitedRelationsR(value.children).forEach(relation => {
                    relations.push(relation)
                })
            })
    
            return relations
        }

        return getVisitedRelationsR(tree).reduce((acc, rel1) => {
            const exists = acc.findIndex(rel2 => relationEquals(rel1, rel2))
            if(exists === -1) acc.push(rel1)
            return acc
        }, [] as SimpleRelation[])
    }
}
