<template>
	<v-select
		@update:model-value="$emit('select', $event)"
		item-text="text"
		item-value="value"
		v-model="field"
		:items="items"
		:disabled="disabled"
	>
		<template #selected-option="{ text }">{{ text }}</template>
	</v-select>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useFieldsStore } from '@/stores/';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	watch: {
		fields: function () {
			const field = this.field;
			this.items = this.fields.map((field: any) => ({
				text: field.name,
				value: field.field,
			}));
			const [item] = this.items;
			this.field = item?.value || null;
			if (this.field !== field) {
				this.$emit('select', this.field);
			}
		},
	},
	setup(props) {
		const currentCollection = ref<string | null>(props.collection);
		const field = ref<any>(null);
		const items = ref<any[]>([]);
		const { fields } = useFields();
		return { field, fields, items, currentCollection };

		function useFields() {
			const fields = ref<any[]>([]);
			watch(currentCollection, fetchFields, { immediate: true });
			return { fields };

			async function fetchFields() {
				if (!currentCollection.value) return;
				const fieldsStore = useFieldsStore();
				fields.value = await fieldsStore
					.getFieldsForCollectionAlphabetical(currentCollection.value)
					.filter((field: any) => field.type === 'translations');
			}
		}
	},
});
</script>
