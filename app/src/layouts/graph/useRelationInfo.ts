import { useRelationM2A } from "@/composables/use-relation-m2a";
import { useRelationM2M } from "@/composables/use-relation-m2m";
import { useRelationM2O } from "@/composables/use-relation-m2o";
import { useRelationO2M } from "@/composables/use-relation-o2m";
import { useFieldsStore } from "@/stores/fields";
import { isNil } from "lodash";
import { computed, Ref } from "vue";

export function useRelationInfo(collection: Ref<string | null>, relationField: Ref<string | null>) {
    const fieldsStore = useFieldsStore()

    const relationInfo = computed(() => {
        if (!collection.value || !relationField.value) return undefined;

        const type = fieldsStore.getField(collection.value, relationField.value)?.meta?.special?.find(value => ['file', 'files', 'm2o', 'o2m', 'm2m', 'm2a', 'translations'].includes(value));

        switch (type) {
            case 'file':
            case 'm2o':
                return useRelationM2O(collection as any, relationField as any).relationInfo.value;
            case 'o2m':
                return useRelationO2M(collection as any, relationField as any).relationInfo.value;
            case 'files':
            case 'm2m':
            case 'translations':
                return useRelationM2M(collection as any, relationField as any).relationInfo.value;
            case 'm2a':
                return useRelationM2A(collection as any, relationField as any).relationInfo.value;
        }

        return undefined
    })

    const relationCollections = computed(() => {
        if (!relationInfo.value) return [];

        switch(relationInfo.value.type) {
            case 'm2a':
                return relationInfo.value.allowedCollections
            case 'm2m':
                return [relationInfo.value.junctionCollection]
            case 'm2o':
            case 'o2m':
                return [relationInfo.value.relatedCollection]
        }
    })

    const relatedToItself = computed(() => relationInfo.value && relationInfo.value.type !== 'm2a' && relationInfo.value.type !== 'm2m' && relationInfo.value.relatedCollection.collection === collection.value)

    const relationOptions = computed(() => {
        if(collection.value === null) return [];
        
        const fields = fieldsStore.getFieldsForCollection(collection.value) as any[]
    
        return fields.reduce<{text: string, value: string}[]>((acc, field) => {
            if(!isNil(field.meta?.special)) {
                acc.push({
                    text: field.name,
                    value: field.field,
                });
            }
    
            return acc;
        }, []);
    })

    return { relationInfo, relationOptions, relationCollections, relatedToItself }
}