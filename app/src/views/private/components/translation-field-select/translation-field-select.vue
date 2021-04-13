<template>
	<v-select
		@input="$listeners.input"
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
import { defineComponent, ref, watch } from '@vue/composition-api';
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
				this.$emit('input', this.field);
			}
		},
	},
	setup(props) {
		const _collection = ref<string | null>(props.collection);
		const field = ref<any>(null);
		const items = ref<any[]>([]);
		const { fields } = useFields();
		return { field, fields, items, _collection };

		function useFields() {
			const fields = ref<any[]>([]);
			watch(_collection, fetchFields, { immediate: true });
			return { fields };

			async function fetchFields() {
				if (!_collection.value) return;
				const fieldsStore = useFieldsStore();
				fields.value = await fieldsStore
					.getFieldsForCollectionAlphabetical(_collection.value)
					.filter((field: any) => field.type === 'translations');
			}
		}
	},
});
</script>
