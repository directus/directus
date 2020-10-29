<template>
	<v-form :fields="options" primary-key="+" v-model="fieldData.meta.options" />
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';
import { Relation, Collection } from '@/types';
import { useCollectionsStore } from '../../stores';
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
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const relationsStore = useRelationsStore();

		const sortField = computed({
			get() {
				return props.value?.sortField;
			},
			set(newFields: string) {
				emit('input', {
					...(props.value || {}),
					sortField: newFields,
				});
			},
		});

		const fields = computed({
			get() {
				return props.value?.fields;
			},
			set(newFields: string) {
				emit('input', {
					...(props.value || {}),
					fields: newFields,
				});
			},
		});

		const junctionCollection = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			const junctionRelation = props.relations.find(
				(relation) => relation.one_collection === props.collection && relation.one_field === field
			);
			return junctionRelation?.many_collection || null;
		});

		const junctionCollectionExists = computed(() => {
			return !!collectionsStore.state.collections.find(
				(collection) => collection.collection === junctionCollection.value
			);
		});

		const options = [
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
				field: 'referencingField',
				name: i18n.t('interfaces.many-to-many-reference.reference-field'),
				type: 'string',
				meta: {
					width: 'full',
					interface: 'text-input',
					options: {
						placeholder: i18n.t('interfaces.many-to-many-reference.reference-field'),
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

		return { options, fields, sortField, junctionCollection, junctionCollectionExists };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';
.form-grid {
	@include form-grid;
}
</style>
