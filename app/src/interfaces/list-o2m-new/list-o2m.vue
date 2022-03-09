<template>
    <draggable @update:model-value="sortItems($event)" :disabled="totalItems > 20">
        <div v-for="item in displayItems" @click="editing = true">
            {{item}}
            <v-button @click="remove">Delete</v-button>
        </div>
    </draggable>

    <v-button @click="editing = true">Add new</v-button>
    <v-button @click="selecting = true">Select Existing</v-button>
    <v-pagination v-if="totalItems > 20"></v-pagination>

    <drawer-item v-if="editing" @input="update" />
	<drawer-collection v-if="selecting" @input="create" />
</template>

<script setup lang="ts">
import { useRelationInfo } from '@/composables/use-relation-info';
import { computed, ref, toRefs } from 'vue';

const props = defineProps<{
    value: (string | number | Record<string, any>)[];
    collection: string,
    field: string,
}>()

const emit = defineEmits(['input'])

const value = computed({
    get: () => props.value,
    set: (value) => {
        emit('input', value)
    }
})

const {collection, field} = toRefs(props)

const {relationInfo} = useRelationInfo(collection, field)

const editing = ref(false)
const selecting = ref(false)
const query = ref({
    page: 1,
    limit: 20
})

const {displayItems, totalItems, create, update, remove, sort} = useRelationMultiple(value, query)

function sortItems(whatever: any) {
    sort(whatever)
}

</script>