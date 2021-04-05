<template>
	<v-select @input="$listeners.input" :value="value" :items="items" :disabled="disabled">
		<template #selected-option="{ text }">{{ text }}</template>
	</v-select>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/';

export default defineComponent({
	props: {
		value: {
			type: String,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	computed: {
		items(): any[] {
			const fieldsStore = useFieldsStore();
			const fields = fieldsStore
				.getFieldsForCollectionAlphabetical(this.$props.collection)
				.filter((field: any) => field.type === 'translations');
			return fields.map((field: any) => ({
				text: field.name,
				value: field.field,
			}));
		},
	},
});
</script>
