<template>
	<v-select v-model="selected" :items="tree" itemText="field">
	</v-select>
</template>

<script lang="ts">
import { Field } from './system-filter.vue';
import { computed, defineComponent, PropType, ref, toRefs } from 'vue';
import { useFieldsStore } from '@/stores';
import useFieldTree from '@/composables/use-field-tree';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const selected = ref([])
		const {collection} = toRefs(props)
		const fieldsStore = useFieldsStore()

		const {tree} = useFieldTree(collection)

		return { tree, selected };
	},
});
</script>
