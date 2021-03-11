<template>
	<div>
		<v-divider>Display fields (in dropdown)</v-divider>
		<!-- Some space is needed in the layout - don't know better way now -->
		<!-- Vue compiler clears out &nbsp; - so use a trick -->
		<p>&nbsp;{{ '\xa0' }}</p>
		<v-field-template :collection="relatedCollection" v-model="template" :depth="1" />
		<p>&nbsp;{{ '\xa0' }}</p>
		<v-divider>Filter (optional)</v-divider>
		<p>&nbsp;{{ '\xa0' }}</p>
		<v-form :fields="options" primary-key="+" v-model="fieldData.meta.options" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { useFieldsStore } from '@/stores';
import { Field } from '@/types';
import { Relation } from '@/types/relations';

export default defineComponent({
	name: 'm2o-interface-filtered-dropdown',
	props: {
		collection: String,
		fieldData: Object as PropType<Field>,
		relations: Array as PropType<Relation[]>,
		value: Object as PropType<any>,
	},
	setup(props, { emit }) {
		if (!props.relations) return;
		const relation: Relation = props.relations[0];
		const template = computed({
			get() {
				return props.value?.template;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					template: newTemplate,
				});
			},
		});
		return {
			relation,
			relatedCollection: relation.one_collection,
			relatedColumns: useFieldsStore().getFieldsForCollection(relation.one_collection),
			options: getOptionsFor(relation),
			template,
		};
	},
});

function getOptionsFor(relation: Relation) {
	let choices = [{ text: '<none>', value: '' }];
	choices = choices.concat(
		useFieldsStore()
			.getFieldsForCollectionAlphabetical(relation.one_collection)
			.map((field: Field) => ({
				text: field.field,
				value: field.field,
				disabled: !field.schema,
			}))
	);
	return [
		{
			field: 'column',
			name: 'Related column',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices,
				},
			},
		},
		{
			field: 'relation',
			name: 'Relation',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: 'equals', value: '_eq' },
						{ text: 'differs', value: '_neq' },
						{ text: 'greater than', value: '_gt' },
						{ text: 'less than', value: '_lt' },
						{ text: 'in (values)', value: '_in' },
						{ text: 'not in (values)', value: '_nin' },
						{ text: 'containing', value: '_contains' },
						{ text: 'not containing', value: '_ncontains' },
						{ text: 'empty/false', value: '_empty' },
						{ text: 'not empty/false', value: '_nempty' },
						{ text: 'greater or equal', value: '_gte' },
						{ text: 'less or equal', value: '_lte' },
					],
				},
			},
			schema: {
				default_value: '_eq',
			},
		},
		{
			field: 'related_value',
			name: 'Related value',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: 'Enter value to be filtered against',
				},
			},
		},
	];
}
</script>
