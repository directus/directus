<template>
	<v-notice type="warning" v-if="collection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<v-form v-else :fields="options" primary-key="+" v-model="fieldData.meta.options" />
</template>

<script lang="ts">
import { Field, Relation, Collection } from '@/types';
import { defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';

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
		const { t } = useI18n();

		const junctionRelation = props.relations.find(
			(relation) =>
				relation.related_collection === props.collection && relation.meta?.one_field === props.fieldData.field
		);

		const manyCollection = junctionRelation
			? props.relations.find(
					(relation) =>
						relation.collection === junctionRelation.collection &&
						junctionRelation.field === relation.meta?.junction_field
			  )?.related_collection
			: null;

		const options = [
			{
				field: 'referencingField',
				name: t('interfaces.tags-m2m.reference-field'),
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
				name: t('display'),
				type: 'string',
				collection: manyCollection,
				meta: {
					width: 'full',
					interface: 'display-template',
				},
			},
			{
				field: 'placeholder',
				name: t('placeholder'),
				type: 'string',
				meta: {
					width: 'full',
					interface: 'text-input',
					options: {
						placeholder: t('enter_a_placeholder'),
					},
				},
			},
			{
				field: 'allowCustom',
				name: t('interfaces.dropdown.allow_other'),
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'toggle',
					options: {
						label: t('interfaces.dropdown.allow_other_label'),
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'closeOnSelect',
				name: t('interfaces.tags-m2m.close-on-select'),
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'toggle',
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'alphabetize',
				name: t('interfaces.tags.alphabetize'),
				type: 'boolean',
				meta: {
					width: 'half-left',
					interface: 'toggle',
					options: {
						label: t('interfaces.tags.alphabetize_label'),
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'iconLeft',
				name: t('icon_left'),
				type: 'string',
				meta: {
					width: 'half',
					interface: 'icon',
				},
			},
			{
				field: 'iconRight',
				name: t('icon_right'),
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
