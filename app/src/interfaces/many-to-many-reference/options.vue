<template>
	<v-notice type="warning" v-if="collection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<v-form v-else :fields="options" primary-key="+" v-model="fieldData.meta.options" />
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation, Collection } from '@/types';
import i18n from '@/lang';
export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		value: {
			type: Object as PropType<any>,
			default: null,
		},
		newCollections: {
			type: Array as PropType<Collection[]>,
			default: () => [],
		},
		newFields: {
			type: Array as PropType<Field[]>,
			default: () => [],
		},
	},
	setup(props) {
		const junctionRelation = props.relations.find(
			(relation) => relation.one_collection === props.collection && relation.one_field === props.fieldData.field
		);

		let manyCollection = null;

		if (junctionRelation) {
			manyCollection = props.relations.find(
				(relation) =>
					relation.many_collection === junctionRelation.many_collection &&
					junctionRelation.many_field === relation.junction_field
			)?.one_collection;
		}

		const options = [
			{
				field: 'referencingField',
				name: i18n.t('interfaces.many-to-many-reference.reference-field'),
				type: 'string',
				collection: manyCollection,
				required: true,
				meta: {
					width: 'full',
					interface: 'field',
				},
			},
			{
				field: 'displayTemplate',
				name: i18n.t('display'),
				type: 'string',
				collection: manyCollection,
				meta: {
					width: 'full',
					interface: 'display-template',
				},
			},
			{
				field: 'placeholder',
				name: i18n.t('placeholder'),
				type: 'string',
				meta: {
					width: 'full',
					interface: 'text-input',
					options: {
						placeholder: i18n.t('enter_a_placeholder'),
					},
				},
			},
			{
				field: 'alphabetize',
				name: i18n.t('interfaces.tags.alphabetize'),
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'toggle',
					options: {
						label: i18n.t('interfaces.tags.alphabetize_label'),
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'allowCustom',
				name: i18n.t('interfaces.dropdown.allow_other'),
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'toggle',
					options: {
						label: i18n.t('interfaces.dropdown.allow_other_label'),
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'iconLeft',
				name: i18n.t('icon_left'),
				type: 'string',
				meta: {
					width: 'half',
					interface: 'icon',
				},
			},
			{
				field: 'iconRight',
				name: i18n.t('icon_right'),
				type: 'string',
				meta: {
					width: 'half',
					interface: 'icon',
				},
			},
		];

		return {
			manyCollection,
			options,
		};
	},
});
</script>
